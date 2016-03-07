angular.module("proton.controllers.Settings")

.controller('LabelsController', function(
    $rootScope,
    $scope,
    $translate,
    $log,
    authentication,
    confirmModal,
    Label,
    labelModal,
    networkActivityTracker,
    notify
) {
    $scope.labels = authentication.user.Labels;

    // Drag and Drop configuration
    $scope.labelsDragControlListeners = {
        containment: "#labelContainer",
        accept: function(sourceItemHandleScope, destSortableScope) {
            return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
        },
        orderChanged: function() {
          labelOrder = [];
          _.forEach($scope.labels, function(d,i) {
            labelOrder[i] = d.Order;
            d.Order = i;
          });
          $scope.saveLabelOrder(labelOrder);
        }
    };

    $scope.createLabel = function() {
        $rootScope.$broadcast('createLabel');
    };

    $scope.editLabel = function(label) {
        var origName = label.Name;
        var origColor = label.Color;

        labelModal.activate({
            params: {
                title: $translate.instant('EDIT_LABEL'),
                label: label,
                create: function(name, color) {
                    networkActivityTracker.track(
                        Label.update({
                            ID: label.ID,
                            Name: name,
                            Color: color,
                            Display: label.Display
                        }).then(function(result) {
                            var data = result.data;

                            if(angular.isDefined(data) && data.Code === 1000) {
                                label.Color = data.Label.Color;
                                label.Name = data.Label.Name;
                                labelModal.deactivate();
                                notify({message: $translate.instant('LABEL_EDITED'), classes: 'notification-success'});
                            } else if(angular.isDefined(data) && angular.isDefined(data.Error)) {
                                label.Name = origName;
                                label.Color = origColor;
                                notify({message: data.Error, classes: 'notification-danger'});
                            } else {
                                label.Name = origName;
                                label.Color = origColor;
                                notify({message: $translate.instant('ERROR_DURING_THE_LABEL_REQUEST'), classes: 'notification-danger'});
                            }
                        }, function(error) {
                            notify({message: 'Error during the label edition request', classes: 'notification-danger'});
                            $log.error(error);
                        })
                    );
                },
                cancel: function() {
                    labelModal.deactivate();
                }
            }
        });
    };

    $scope.deleteLabel = function(label) {
        confirmModal.activate({
            params: {
                title: $translate.instant('DELETE_LABEL'),
                message: 'Are you sure you want to delete this label?', // TODO translate
                confirm: function() {
                    networkActivityTracker.track(
                        Label.delete(label.ID)
                        .then(
                            function(result) {
                                var data = result.data;

                                if(angular.isDefined(data) && data.Code === 1000) {
                                    confirmModal.deactivate();
                                    notify({message: $translate.instant('LABEL_DELETED'), classes: 'notification-success'});
                                    authentication.user.Labels.splice(authentication.user.Labels.indexOf(label), 1);
                                } else if(angular.isDefined(data) && angular.isDefined(data.Error)) {
                                    notify({message: data.Error, classes: 'notification-danger'});
                                    $log.error(data);
                                } else {
                                    notify({message: $translate.instant('ERROR_DURING_THE_LABEL_REQUEST'), classes: 'notification-danger'});
                                    $log.error(result);
                                }
                            },
                            function(error) {
                                notify({message: 'Error during the label deletion request ', classes: 'notification-danger'});
                                $log.error(error);
                            }
                        )
                    );
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    $scope.saveLabelOrder = function(labelOrder) {
        networkActivityTracker.track(
            Label.order({
                "Order": labelOrder
            }).then(function(result) {
                var data = result.data;

                if (angular.isDefined(data) && data.Code === 1000) {
                    notify({message: $translate.instant('LABEL_ORDER_SAVED'), classes: 'notification-success'});
                } else if (angular.isDefined(data) && angular.isDefined(data.Error)) {
                    notify({message: data.Error, classes: 'notification-danger'});
                    $log.error(result);
                } else {
                    notify({message: $translate.instant('ERROR_DURING_THE_LABEL_REQUEST'), classes: 'notification-danger'});
                    $log.error(result);
                }
            }, function(error) {
                notify({message: 'Error during the label edition request ', classes: 'notification-danger'});
                $log.error(error);
            })
        );
    };

    $scope.toggleDisplayLabel = function(label) {
        Label.update({
            ID: label.ID,
            Name: label.Name,
            Color: label.Color,
            Display: Number(label.Display)
        }).then(function(result) {
            var data = result.data;

            if (angular.isDefined(data) && data.Code === 1000) {
                notify({message: $translate.instant('LABEL_EDITED'), classes: 'notification-success'});
            } else if (angular.isDefined(data) && angular.isDefined(data.Error)) {
                notify({message: data.Error, classes: 'notification-danger'});
                $log.error(result);
            } else {
                notify({message: $translate.instant('ERROR_DURING_THE_LABEL_REQUEST'), classes: 'notification-danger'});
                $log.error(result);
            }
        }, function(error) {
            notify({message: 'Error during the label edition request ', classes: 'notification-danger'});
            $log.error(error);
        });
    };
});
