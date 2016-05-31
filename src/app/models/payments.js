angular.module("proton.models.payments", [])

.factory("Payment", function($http, $q, gettextCatalog, authentication, CONSTANTS, url) {
    return {
        /**
        * Donate for perks. Does not require authentication.
        * @param {Object} Obj
        */
        donate: function(Obj) {
            return $http.post(url.get() + '/payments/donate', Obj);
        },
        /**
        * Cancel given subscription.
        * @param {Object} Obj
        */
        unsubscribe: function(Obj) {
            return $http.post(url.get() + '/payments/unsubscribe', Obj);
        },
        /**
         * Create Paypal Payment
         * @param {Object} params
         * @return {Promise}
         */
        paypal: function(params) {
            return $http.post(url.get() + '/payments/paypal', params);
        },
        /**
         * Get payment method status
         * @return {Promise}
         */
        status: function() {
            return $http.get(url.get() + '/payments/status');
        },
        /**
         * Get invoices in reverse time order
         * @param {Object} params
         * @return {Promise}
         */
        invoices: function(params) {
            return $http.get(url.get() + '/payments/invoices', {params: params});
        },
        /**
         * Get an invoice as pdf
         */
        invoice: function(id) {
            return $http.get(url.get() + '/payments/invoices/' + id, {responseType: "arraybuffer"});
        },
        /**
         * Return information to pay invoice unpaid
         */
         check: function(id) {
             return $http.post(url.get() + '/payments/invoices/' + id + '/check');
         },
         /**
          * Pay an unpaid invoice
          * @param {String} id
          * @param {Object} params
          * @return {Promise}
          */
         pay: function(id, params) {
            return $http.post(url.get() + '/payments/invoices/' + id, params);
         },

        /**
         * Get plans available to user
         */
        plans: function(currency, cycle) {
            return $http.get(url.get() + '/payments/plans', {
                params: {
                    Currency: currency,
                    Cycle: cycle
                },
                transformResponse: function(data, headersGetter, status) {
                    data = angular.fromJson(data);

                    if(angular.isDefined(data) && data.Code === 1000) {
                        // Add free plan
                        data.Plans.unshift({
                            Type: 1,
                            Cycle: cycle,
                            Currency: currency,
                            Name: 'free',
                            Title: 'Free',
                            Amount: 0,
                            MaxDomains: 0,
                            MaxAddresses: 1,
                            MaxSpace: 500 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE,
                            MaxMembers: 0,
                            TwoFactor: 0
                        });

                        _.each(data.Plans, function(plan) {
                            switch (plan.Name) {
                                case 'free':
                                    plan.editable = false;
                                    plan.display = true;
                                    plan.sending = '150 ' + gettextCatalog.getString('Messages per day', null);
                                    plan.labels = '20 ' + gettextCatalog.getString('Labels', null);
                                    plan.support = gettextCatalog.getString('Limited support', null);
                                    break;
                                case 'plus':
                                    plan.editable = true;
                                    plan.display = true;
                                    plan.sending = '1000 ' + gettextCatalog.getString('Messages per day', null);
                                    plan.labels = '200 ' + gettextCatalog.getString('Labels', null);
                                    plan.support = gettextCatalog.getString('Support', null);
                                    break;
                                case 'business':
                                    plan.editable = true;
                                    plan.display = false;
                                    plan.sending = '???';
                                    plan.labels = '???';
                                    plan.support = '???';
                                    break;
                                case 'visionary':
                                    plan.editable = false;
                                    plan.display = true;
                                    plan.sending = gettextCatalog.getString('Unlimited sending', null);
                                    plan.labels = gettextCatalog.getString('Unlimited labels', null);
                                    plan.support = gettextCatalog.getString('Priority support', null);
                                    break;
                                default:
                                    break;
                            }
                        });
                    }

                    return data;
                }
            });
        },
        /**
        * Get current subscription
        * @return {Promise}
        */
        subscription: function() {
            return $http.get(url.get() + '/payments/subscription', {
                transformResponse: function(data, headersGetter, status) {
                    data = angular.fromJson(data);

                    if (angular.isDefined(data) && data.Code === 1000) {
                        data.Subscription.Name = _.findWhere(data.Subscription.Plans, {Type: 1}).Name;
                        data.Subscription.Title = _.findWhere(data.Subscription.Plans, {Type: 1}).Title;
                    }

                    if (angular.isDefined(data) && data.Code === 22110) {
                        data.Code = 1000;
                        data.Subscription = {
                            Name: 'free',
                            Title: 'ProtonMail Free',
                            MaxDomains: 0,
                            MaxAddresses: 1,
                            MaxSpace: 5368709120, // 500 MB
                            MaxMembers: 1,
                            Cycle: 12,
                            Currency: authentication.user.Currency
                        };
                    }

                    return data;
                }
            });
        },
        /**
         * Validate a subscription
         */
        valid: function(params) {
            return $http.post(url.get() + '/payments/subscription/check', params);
        },
        updateMethod: function(params) {
            return $http.post(url.get() + '/payments/methods', params);
        },
        deleteMethod: function(id) {
            return $http.delete(url.get() + '/payments/methods/' + id);
        },
        /**
         * Get payment methods in priority order
         */
        methods: function() {
            return $http.get(url.get() + '/payments/methods');
        },
        /**
         * First will be charged for subscriptions
         */
        order: function(params) {
            return $http.post(url.get() + '/payments/methods/order', params);
        },
        /**
         * Create a subscription
         */
        subscribe: function(params) {
            return $http.post(url.get() + '/payments/subscription', params);
        },
        /**
         * Delete current subscription, locked
         */
        delete: function() {
            return $http.delete(url.get() + '/payments/subscription');
        },
        /**
        *  Get payments corresponding to the given user.
        * @param {Integer} timestamp
        * @param {Integer} limit
        */
        user: function(timestamp, limit) {
            return $http.get(url.get() + '/payments/user', {
                params: {
                    Time: timestamp,//
                    Limit: limit
                },
                transformResponse: function(data, headersGetter, status) {
                    data = angular.fromJson(data);

                    if(angular.isDefined(data) && data.Code === 1000) {
                        var month = 60 * 60 * 24 * 30; // Time for a month in second

                        _.each(data.Payments, function(invoice) {
                            if(parseInt((invoice.PeriodEnd - invoice.PeriodStart) / month) === 1) {
                                invoice.BillingCycle = 12;
                            } else {
                                invoice.BillingCycle = 1;
                            }
                        });
                    }

                    return data;
                }
            });
        },
        /**
        *  Get payments corresponding to the given organization.
        * @param {Integer} timestamp
        * @param {Integer} limit
        */
        organization: function(timestamp, limit) {
            return $http.get(url.get() + '/payments/organization', {
                params: {
                    Time: timestamp,
                    Limit: limit
                },
                transformResponse: function(data, headersGetter, status) {
                    data = angular.fromJson(data);

                    if (angular.isDefined(data) && data.Code === 1000) {
                        var month = 60 * 60 * 24 * 30; // Time for a month in second

                        _.each(data.Payments, function(invoice) {
                            if(parseInt((invoice.PeriodEnd - invoice.PeriodStart) / month) === 1) {
                                invoice.BillingCycle = 12;
                            } else {
                                invoice.BillingCycle = 1;
                            }
                        });
                    }

                    return data;
                }
            });
        },
        cardType: function(number) {
            var deferred = $q.defer();

            deferred.resolve($.payment.cardType(number));

            return deferred.promise;
        },
        validateCardNumber: function(number) {
            var deferred = $q.defer();

            if ($.payment.validateCardNumber(number) === false) {
                deferred.reject(new Error(gettextCatalog.getString('Card number invalid', null, 'Error')));
            } else {
                deferred.resolve();
            }

            return deferred.promise;
        },
        validateCardExpiry: function(month, year) {
            var deferred = $q.defer();

            if ($.payment.validateCardExpiry(month, year) === false) {
                deferred.reject(new Error(gettextCatalog.getString('Expiration date invalid', null, 'Error')));
            } else {
                deferred.resolve();
            }

            return deferred.promise;
        },
        validateCardCVC: function(cvc) {
            var deferred = $q.defer();

            if ($.payment.validateCardCVC(cvc) === false) {
                deferred.reject(new Error(gettextCatalog.getString('CVC invalid', null, 'Error')));
            } else {
                deferred.resolve();
            }

            return deferred.promise;
        }
    };
});
