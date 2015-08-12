angular.module("proton.controllers.Auth", [
    "proton.authentication",
    "proton.pmcw",
    "proton.constants"
])

.controller("LoginController", function(
    $rootScope,
    $state,
    $scope,
    $log,
    $timeout,
    $http,
    CONSTANTS,
    CONFIG,
    authentication,
    networkActivityTracker,
    notify,
    pmcw
) {
    $rootScope.pageName = "Login";
    $rootScope.app_version = CONFIG.app_version;
    $rootScope.tempUser = $rootScope.tempUser || [];

    if ($rootScope.isLoggedIn && $rootScope.isLocked === false && $rootScope.user === undefined) {
        try {
            $rootScope.user = authentication.fetchUserInfo();
        }
        catch(err) {
            $log.error('appjs',err);
            alert(err);
        }
    }

    var clearErrors = function() {
        $scope.error = null;
    };

    // this does not add security and was only active for less than a day in 2013.
    // required for accounts created back then.
    // goal was to obfuscate the password in a basic manner.
    $scope.basicObfuscate = function(username, password) {
        var salt = username.toLowerCase();

        if (salt.indexOf("@") > -1) {
            salt = salt.match(/^([^@]*)@/)[1];
        }

        return pmcrypto.getHashedPassword(salt+password);
    };

    $rootScope.tryLogin = function() {
        $('input').blur();
        clearErrors();
        // transform to lowercase and remove the domain
        $scope.username = $scope.username.toLowerCase().split('@')[0];

        // custom validation
        if (pmcw.encode_utf8($scope.password).length > CONSTANTS.LOGIN_PW_MAX_LEN) {
            notify({
                classes: 'notification-danger',
                message: 'Passwords are limited to '+CONSTANTS.LOGIN_PW_MAX_LEN+' characters.'
            });
            return;
        }

        networkActivityTracker.track(
            authentication.loginWithCredentials({
                Username: $scope.username,
                Password: $scope.password,
                HashedPassword: $scope.basicObfuscate($scope.username, $scope.password)
            })
            .then(
                function(result) {
                    $log.debug('loginWithCredentials:result.data ', result);
                    if (result.data.Code!==undefined) {
                        if (result.data.Code===401) {
                            notify({
                                classes: 'notification-danger',
                                message: result.data.ErrorDescription
                            });
                        }
                        // TODO: where is tempUser used?
                    	else if (result.data.AccessToken) {
                            $rootScope.isLoggedIn = true;
                            $rootScope.tempUser = {};
                            $rootScope.tempUser.username = $scope.username;
                            $rootScope.tempUser.password = $scope.password;

                            // console.log('Going to unlock page.');
                            $state.go("login.unlock");
                            return;
    	                }
                    }
	                else if (result.Error) {
	                	var error  = (result.Code === 401) ? 'Wrong Username or Password' : (result.error_description) ? result.error_description : result.Error;
	                	notify({
	                        classes: 'notification-danger',
	                        message: error
	                    });
	                }
	                else {
	                	notify({
	                        classes: 'notification-danger',
	                        message: 'Unable to log you in.'
	                    });
	                }
	                return;
                },
                function(result) {
                    // console.log(result);
                    if (result.message===undefined) {
                        result.message = 'Sorry, our login server is down. Please try again later.';
                    }
                    notify({
                        classes: 'notification-danger',
                        message: result.message
                    });
                    $('input[name="Username"]').focus();
                }
            )
        );
    };

    $scope.tryDecrypt = function() {
        $('input').blur();
        var mailboxPassword = this.mailboxPassword;
        clearErrors();
        networkActivityTracker.track(
            authentication.unlockWithPassword(
                $rootScope.TemporaryEncryptedPrivateKeyChallenge,
                mailboxPassword,
                $rootScope.TemporaryEncryptedAccessToken,
                $rootScope.TemporaryAccessData
            )
            .then(
                function(resp) {
                    $log.debug('unlockWithPassword:resp'+resp);
                    return authentication.setAuthCookie()
                    .then(
                        function(resp) {
                            $log.debug('setAuthCookie:resp'+resp);
                            authentication.savePassword(mailboxPassword);
                            $state.go("secured.inbox");
                        },
                        function(err) {
                            $log.error('tryDecrypt', err);
                            notify({
                                classes: 'notification-danger',
                                message: err.message
                            });
                            $( "[type=password]" ).focus();
                        }
                    );
                }
            )
            .catch(function(err) {
                $log.error('tryDecrypt', err);
                notify({
                    classes: 'notification-danger',
                    message: err.message
                });
            })
        );
    };

    $scope.keypress = function(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            if ($state.is("login.unlock")) {
                $scope.tryDecrypt.call(this);
            } else {
                $scope.tryLogin.call(this);
            }
        }
    };
})

.controller("SecuredController", function(
    $scope,
    $rootScope,
    authentication,
    eventManager,
    Message
) {
    $scope.user = authentication.user;
    $scope.logout = $rootScope.logout;

    eventManager.start(authentication.user.EventID);

    $rootScope.isLoggedIn = true;
    $rootScope.isLocked = false;
    $rootScope.isSecure = authentication.isSecured;

    Message.totalCount().$promise.then(function(totals) {
        var total = {Labels:{}, Locations:{}, Starred: totals.Starred};

        _.each(totals.Labels, function(obj) { total.Labels[obj.LabelID] = obj.Count; });
        _.each(totals.Locations, function(obj) { total.Locations[obj.Location] = obj.Count; });

        $rootScope.messageTotals = total;
    });
});
