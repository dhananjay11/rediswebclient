(function() {

    var app = angular.module('predfangy', ['ui.bootstrap']);
    app.redisApi = 'https://predisfangular.herokuapp.com/';
    app.refreshRate = 10;
    app.autoRefresh = true;

    function run($rootScope, $location, $http, $scope) {}

    app.filter('reverse', function() {
        return function(items) {
            return items.slice().reverse();
        };
    });
    app.controller('ConsoleCtrl', function($scope, $http) {
        $scope.history = [];
        $scope.histModel = {}
        $scope.commandModel = {}
        this.sendCommand = function() {
            $http({
                url: app.redisApi + "rruncommand",
                method: "POST",
                data: {
                    'command': $scope.commandModel.command,
                }
            })
                .then(function(response) {
                        $scope.histModel = {};
                        $scope.histModel.return = []
                        $scope.histModel.return = response.data['return'];
                        $scope.histModel.command = $scope.commandModel.command;
                        $scope.history.push($scope.histModel);
                        $scope.commandModel.command = '';
                        $scope.histModel = {};

                    },
                    function(response) {
                        $scope.histModel = {};
                        $scope.histModel.return = ["Inavlid command.  Type /help for a list of valid commands, or see http://redis.io/commands."];
                        $scope.histModel.command = $scope.commandModel.command;
                        $scope.history.push($scope.histModel);
                        //$scope.commandModel.command = '';
                        //$scope.histModel = {};
                        //http://localhost:5000/
                    });
        };
    });

    app.controller('DocsCtrl', function($scope, $http) {
        console.log("write the docs, bub.");
        this.addJunkData = function() {
            $http.get(app.redisApi + 'rjunk').
            success(function(data, status, headers, config) {
                console.log("Junk data added successfully!  It will expire in 300 seconds!");
            }).
            error(function(data, status, headers, config) {
                console.log("Unable to add junk data. Check your connectiostring on the config tab!");
            });
        };
    });
    app.controller("AddNewKVCtrl", function() {
        this.show = false;
        this.toggleForm = function() {
            this.show = !this.show;
            return this.show;
        };
    });
    app.controller('ConfigCtrl', function($scope, $rootScope) {
        app.redisApi = 'https://predisfangular.herokuapp.com/';
        this.ce = app.redisApi;
        $scope.formModel = {};
        this.setConfig = function(model) {
            app.redisApi = model.endpoint;
            this.ce = app.redisApi;
        };
        this.setRefreshRate = function(rate) {
            app.refreshRate = rate;
            app.autoRefresh = true;
        };
    });
    app.directive("navTabs", function() {
        return {
            restrict: "E",
            templateUrl: "views/nav.html",
            controller: function() {
                this.tab = 2;
                this.isSet = function(checkTab) {
                    return this.tab === checkTab;
                };
                this.setTab = function(activeTab) {
                    this.tab = activeTab;
                };
            },
            controllerAs: "nav"
        };
    });
    // get redis keys from api
    app.controller("RedisCtrl", function($rootScope, $scope, $http, $timeout) {
        $scope.keysList = [];
        $scope.currentKeyData = {};
        $scope.cachedKeyVals = {};
        $scope.redisSingleKVModel = {};
        $scope.newKeyValModel = {};
        $scope.showKVFormFor = {};
        $scope.showkvf = false;
        $scope.filterKeys = {};
        $scope.searchResults = {};
        $scope.searchText = "";
        $scope.showSearchResults = false;
        $scope.showExpFormFor = {};
        $scope.confModel = {};
        $scope.autoLoadValues = true;

        /*
        pagination controls
        */
        $scope.currentPage = 1;
        $scope.numPerPage = 15;
        $scope.paginate = function(value) {
            var begin, end, index;
            begin = ($scope.currentPage - 1) * $scope.numPerPage;
            end = begin + $scope.numPerPage;
            index = $scope.keysList.indexOf(value);
            return (begin <= index && index < end);
        };

        this.loadAllValues = function() {
            $scope.keysList.forEach(function(key) {
                $scope.getKeyVal(key);
            });
        };
        /* 
        end pagination controls 
        if ($scope.autoLoadKeys && $scope.cachedKeyVals[value] != undefined) {
                console.log(index, value, begin, end)
                if (begin <= index && index <= end) {
                    //$scope.keysList.slice(begin, end).forEach(function() {
                        $scope.getKeyVal(value);
                    //});
                }
                else{
                    console.log(index, value)
                }
            }
        */

        $scope.getKeyVal = function(key) {
            if ($scope.cachedKeyVals[key] === undefined) {
                $http.get(app.redisApi + "rget?key=" + key).
                success(function(data, status, headers, config) {
                    $scope.cachedKeyVals[key] = {};
                    $scope.cachedKeyVals[key].value = data[key];
                }).
                error(function(data, status, headers, config) {
                    console.log('Error getting key value for: ' + key)
                });
            }
        };
        this.showExpForm = function(key) {
            console.log(key);
            $scope.showExpFormFor[key] = !$scope.showExpFormFor[key];
            return $scope.showExpFormFor[key];
        };

        this.toggleAutoRefresh = function(refresh) {
            if (app.autoRefresh === true) {
                if (refresh) {
                    this.monitor = setInterval(this.checkCurrentKeys, (app.refreshRate * 1000));
                } else {
                    clearInterval(this.monitor);
                    app.autoRefresh = false;
                    this.monitor = {};
                }
            } else {
                app.autoRefresh = true;
                this.monitor = {};
                this.monitor = setInterval(this.checkCurrentKeys, (app.refreshRate * 1000));
            }
        };
        this.setExpSecs = function(key, secs) {
            console.log(key + ' ' + secs)

            $scope.cachedKeyVals[key].timeStamp = Date.now;
            $http({
                url: app.redisApi + "rexpsecs",
                method: "POST",
                data: {
                    'key': key,
                    'exp': secs
                }
            })
                .then(function(response) {
                        $scope.showExpFormFor[key] = false;
                        $scope.cachedKeyVals[key].expireAfter = true;
                        $scope.cachedKeyVals[key].expireAt = false;
                        $scope.cachedKeyVals[key].ctr = secs;
                        console.log(key + ' expires in ' + secs + ' seconds');
                    },
                    function(response) { // optional
                        console.log('FAILURE - expiration not set for: ' + key + ' : ' + secs)
                    });
        };

        this.editValueIconClick = function(key) {
            $scope.getKeyVal(key);
            $scope.showKVFormFor[key] = !$scope.showKVFormFor[key];
            return $scope.showKVFormFor[key];

        };

        this.flushAllKeys = function() {
            $http.get(app.redisApi + 'rflush').
            success(function(data, status, headers, config) {
                $scope.getAllKeys();
                console.log("All Redis keys have been flushed!");
            }).
            error(function(data, status, headers, config) {
                console.log("Unable to flush Redis keys.");
            });
        };

        this.deleteKVPair = function(key) {
            $http({
                url: app.redisApi + "rdel",
                method: "POST",
                data: {
                    'key': key,
                }
            })
                .then(function(response) {
                        var index = $scope.keysList.indexOf(key);
                        delete $scope.cachedKeyVals[key];
                        if (index > -1) {
                            $scope.keysList.splice(index, 1);
                        }
                        delete $scope.keysList[key];
                        console.log(key + 'has been deleted.');
                    },
                    function(response) {
                        console.log('FAILURE - Key not deleted.')
                    });
        };

        this.filterForKeys = function(searchText) {
            $scope.searchResults = [];
            $scope.keysList.forEach(function(k) {
                var n = k.search(searchText);
                if (n >= 0) {
                    $scope.searchResults[k] = true;
                }
            });
            if (Object.keys($scope.searchResults).length > 0) {
                $scope.showSearchResults = true;
            } else {
                $scope.showSearchResults = false;
            }
            if (searchText === "") {
                $scope.searchResults = [];
                $scope.showSearchResults = false;
            }
        };

        this.refreshAllKeys = function() {
            $scope.keysList = [];
            $scope.searchResults = [];
            $scope.getAllKeys();
            if ($scope.autoLoadValues) {
                this.loadAllValues();
            }

        };
        this.toggleKVForm = function(key) {
            $scope.showKVFormFor[key] = !$scope.showKVFormFor[key];
            return $scope.showKVFormFor[key];
        };
        this.showNewKVForm = function() {
            this.newKeyValModel = {};
            $scope.showkvf = !$scope.showkvf;
            console.log($scope.showkvf);
        };
        this.sendKV = function(key, val) {
            $http({
                url: app.redisApi + "rset",
                method: "POST",
                data: {
                    'key': key,
                    'val': val
                }
            })
                .then(function(response) {
                        console.log(key + ' now references ' + val);
                        $scope.cachedKeyVals[key].value = val;
                    },
                    function(response) { // optional
                        console.log('FAILURE - KV PAIR NOT SET: ' + key + ' : ' + val)
                    });
        };
        $scope.getAllKeys = function() {
            $http.get(app.redisApi + 'rlist').
            success(function(data, status, headers, config) {
                $scope.keysList = data.keys;
                $scope.totalItems = data.keys.length;
                $scope.keysList.forEach(function(k) {
                    $scope.showKVFormFor[k] = false;
                });
                console.log("Keys retrieved successfully!");
            }).
            error(function(data, status, headers, config) {
                console.log("Unable to obtain keys from redis server. Check your connectiostring on the config tab!");
            });
        };

        $scope.getKeyValClick = function(key) {
            $http.get(app.redisApi + "rget?key=" + key).
            success(function(data, status, headers, config) {
                $scope.cachedKeyVals[key] = {};
                $scope.cachedKeyVals[key].value = data[key];
                //$scope.showKVFormFor[key] = false;
            }).
            error(function(data, status, headers, config) {
                console.log('Error getting key value for: ' + key)
            });

        };

        this.updateExistingKey = function(key, val) {
            if (typeof key !== 'undefined' && typeof val !== 'undefined') {
                this.ev = {};
                this.ev[key] = val;
                this.sendKV(key, val);
                $scope.showKVFormFor[key] = false;
                console.log("writing: " + key + " : " + val);
            }
            this.ev = {};
        };
        this.setNewKeyVal = function(model) {
            if (!(model.key in $scope.keysList) && model.key !== "" && model.value !== "") {
                $scope.keysList.push(model.key);
                $scope.cachedKeyVals[model.key] = {}
                $scope.cachedKeyVals[model.key].value = model.value;
                this.sendKV(model.key, model.value);
            }
            $scope.newKeyValModel = {};
            model = {};
        };

        var intersection = function(a, b) {
            var result = new Array();
            while (a.length > 0 && b.length > 0) {
                if (a[0] < b[0]) {
                    a.shift();
                } else if (a[0] > b[0]) {
                    b.shift();
                } else {
                    result.push(a.shift());
                    b.shift();
                }
            }
            return result;
        };
        // build cache every x seconds on server and have it ready to retrieve to speed this up for multiple clients.
        this.checkCurrentKeys = function() {
            console.log(app.refreshRate);
            $http.get(app.redisApi + "rlist").
            success(function(data, status, headers, config) {
                var thisList = data.keys;
                $scope.keysList = thisList; //intersection($scope.keysList, thisList);
                $scope.totalItems = data.keys.length;
            }).
            error(function(data, status, headers, config) {
                console.log('Could not refresh keys list.');
            });
        };
        //initial grab of keys
        $scope.getAllKeys();
        //setInterval(this.checkCurrentKeys, (app.refreshRate * 1000));
    });
    // begin connection modal
    app.directive('modalDialog', function() {
        return {
            restrict: 'E',
            scope: {
                show: '='
            },
            replace: true, // Replace with the template below
            transclude: true, // we want to insert custom content inside the directive
            link: function(scope, element, attrs) {
                scope.dialogStyle = {};
                if (attrs.width)
                    scope.dialogStyle.width = attrs.width;
                if (attrs.height)
                    scope.dialogStyle.height = attrs.height;
                scope.hideModal = function() {
                    scope.show = false;
                };
            },
            template: "<div class='ng-modal' ng-show='show'><div class='ng-modal-overlay' ng-click='hideModal()'></div><div class='ng-modal-dialog' ng-style='dialogStyle'><div class='ng-modal-close' ng-click='hideModal()'>X</div><div class='ng-modal-dialog-content' ng-transclude></div></div></div>"
        };
    });
    app.controller('MyCtrl', ['$scope',
        function($scope) {
            $scope.modalShown = false;
            $scope.toggleModal = function() {
                $scope.modalShown = !$scope.modalShown;
            };
        }
    ]);
    // end connection modal
})();