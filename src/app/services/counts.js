angular.module("proton.messages.counts", ["proton.constants"])
    .service('messageCounts', function($q, Message, CONSTANTS, $rootScope, tools) {
		    var totalCounts = _.bindAll({
                move: function(messages) {
                    var counterUpdates = {Locations: {}, Labels: {}};

                    _.each(messages, function(message) {
                        if (message.Location !== message.OldLocation) {
                            var mID = counterUpdates.Locations[message.Location];
                            mID = (typeof mID === 'undefined') ? 0 : mID;
                            counterUpdates.Locations[message.Location] = mID + 1;

                            var curID = counterUpdates.Locations[message.OldLocation];
                            curID = (typeof curID === 'undefined') ? 0 : curID;
                            counterUpdates.Locations[message.OldLocation] = curID - 1;
                        }
                    });
                    this.update('Locations', counterUpdates.Locations);
                },
                label: function(messages, add, remove) {
                    var counterUpdates = {Locations: {}, Labels: {}, Starred: 0};

                    _.each(add.concat(remove), function(id) {counterUpdates.Labels[id] = 0;});

                    _.each(messages, function(message) {
                            _.each(add, function(id) {
                                var count = counterUpdates.Labels[id];
                                counterUpdates.Labels[id] = (_.indexOf(message.LabelIDs, id) === -1) ? count + 1 : count;
                            });
                            _.each(remove, function(id) {
                                var count = counterUpdates.Labels[id];
                                counterUpdates.Labels[id] = (_.indexOf(message.LabelIDs, id) !== -1) ? count - 1 : count;
                            });
                    });

                    this.update('Labels', counterUpdates.Labels);
                },
                update: function(location, updates) {
                    _.each(updates, function(val, id) {
                        var ID = $rootScope.messageTotals[location][id];
                        ID = (typeof ID === 'undefined') ? val : ID + val;
                        $rootScope.messageTotals[location][id] = (ID < 0) ? 0 : ID;
                    });
                }
            });

            var unreadCounts = _.bindAll({
                move :  function(messages) {

                    // Object to hold the changes to each count. Can be positive or negative depending if increased or decreased
                    var counterUpdates = {Locations: {}, Labels: {}, Starred : 0};

                    // Checks each message to see if count should increase decrease or stay the same
                    _.each(messages, function(message) {
                        if (message.Location !== message.OldLocation) {
                            var mID = counterUpdates.Locations[message.Location];
                            mID = (typeof mID === 'undefined') ? 0 : mID;
                            counterUpdates.Locations[message.Location] = (message.IsRead === 0) ? mID + 1 : mID;

                            var curID = counterUpdates.Locations[message.OldLocation];
                            curID = (typeof curID === 'undefined') ? 0 : curID;
                            counterUpdates.Locations[message.OldLocation] = (message.IsRead === 0) ? curID - 1 : curID;
                        }
                    });

                    this.update('Locations', counterUpdates.Locations);
                },
                mark : function(messages, status) {
                    // Object to hold the changes to each count. Can be positive or negative depending if increased or decreased
                    var counterUpdates = {Locations: {}, Labels: {}, Starred: 0};

                    // Checks each message and each label for each message to see if count should increase decrease or stay the same
                    _.each(messages, function(message) {
                        var starred = (message.Starred === 1);
                        var sID = counterUpdates.Starred;
                        var mID = counterUpdates.Locations[message.Location];

                        mID = (typeof mID === 'undefined') ? 0 : mID;
                        counterUpdates.Locations[message.Location] = (status) ? mID - 1 : mID + 1;
                        counterUpdates.Starred = (starred && status) ? sID - 1 : (starred && !status) ? sID + 1 : sID;

                        _.each(message.LabelIDs, function(labelID) {
                            lID = counterUpdates.Labels[labelID];
                            lID = (typeof lID === 'undefined') ? 0 : lID;
                            counterUpdates.Labels[labelID] = (status) ? lID - 1 : lID + 1;
                        });
                    });

                    api.counters.Starred = api.counters.Starred + counterUpdates.Starred;
                    this.update('Locations', counterUpdates.Locations);
                    this.update('Labels', counterUpdates.Labels);
                },
                label: function(messages, add, remove) {
                    var counterUpdates = {Locations: {}, Labels: {}, Starred: 0};

                    _.each(add.concat(remove), function(id) {counterUpdates.Labels[id] = 0;});

                    _.each(messages, function(message) {
                        if (message.IsRead === 0) {
                            _.each(add, function(id) {
                                var count = counterUpdates.Labels[id];
                                counterUpdates.Labels[id] = (_.indexOf(message.LabelIDs, id) === -1) ? count + 1 : count;
                            });
                            _.each(remove, function(id) {
                                var count = counterUpdates.Labels[id];
                                counterUpdates.Labels[id] = (_.indexOf(message.LabelIDs, id) !== -1) ? count - 1 : count;
                            });
                        }
                    });

                    this.update('Labels', counterUpdates.Labels);
                },

                // Updates counters with the update object
                update: function(location, updates) {
                    _.each(updates, function(val, id) {
                        var ID = api.counters[location][id];
                        ID = (typeof ID === 'undefined') ? val : ID + val;
                        api.counters[location][id] = (ID < 0) ? 0 : ID;
                    });
                }
            });

            var api = _.bindAll({
                counters: {Labels:{}, Locations:{}, Starred: 0},
                unreadChangedLocally : false,
                totalChangedLocally : false,
                get: function() {
                    return this.counters;
                },
                update: function(counters) {
                    this.counters = counters;
                },
                refresh: function() {
                    Message.unreaded({}).$promise.then(function(json) {
                        this.counters.Starred = json.Starred;
                        _.each(json.Labels, function(obj) { this.counters.Labels[obj.LabelID] = obj.Count; }.bind(this));
                        _.each(json.Locations, function(obj) { this.counters.Locations[obj.Location] = obj.Count; }.bind(this));
                    }.bind(this));
                },
                updateTotals: function(action, messages) {
                    totalCounts[action](messages);
                    this.totalChangedLocally = true;
                },
                updateUnread: function(action, messages, status) {
                    unreadCounts[action](messages, status);
                    this.unreadChangedLocally = true;
                },
                updateUnreadLabels: function(messages, add, remove) {
                    unreadCounts.label(messages, add, remove);
                },
                updateTotalLabels: function(messages, add, remove) {
                    totalCounts.label(messages, add, remove);
                },
                empty: function(location) {
                    this.counters.Locations[location] = 0;
                }
            });

            return api;
	});
