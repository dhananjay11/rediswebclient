(function() {

    var app = angular.module('predfangy', []);
    app.redisApi = 'http://localhost:5000/';
    app.keyCount = {};
    function run($rootScope, $location, $http, $scope) {}

    app.controller('DocsCtrl', function($scope, $http){
       console.log("write the docs, idiot.");
       this.addJunkData = function(){
            $http.get(app.redisApi + 'rjunk').
            success(function(data, status, headers, config) {
                console.log("Junk data added successfully!");
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
            console.log(this.show);
            return this.show;
        };
    });
    app.controller('ConfigCtrl', function($scope, $rootScope) {
        app.redisApi = 'http://localhost:5000/';
        this.ce = app.redisApi;
        $scope.formModel = {};
        this.setConfig = function(model) {
            app.redisApi = model.endpoint;
            this.ce = app.redisApi;
            console.log(this.formModel);
        };
    });
    app.directive("navTabs", function() {
        return {
            restrict: "E",
            templateUrl: "views/nav.html",
            controller: function() {
                this.tab = 1;
                this.isSet = function(checkTab) {
                    return this.tab === checkTab;
                };
                this.setTab = function(activeTab) {
                    this.tab = activeTab;
                    console.log(this.tab);
                };
            },
            controllerAs: "nav"
        };
    });
    // get redis keys from api
    app.controller("RedisCtrl", function($rootScope, $scope, $http, $timeout) {
        $scope.keysList = {};
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

        this.editValueIconClick = function(key) {
            this.getKeyVal(key);
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
            $scope.keysList = {};
            $scope.searchResults = [];
            $scope.getAllKeys();

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
                        $scope.cachedKeyVals[key] = val;
                    },
                    function(response) { // optional
                        console.log('FAILURE - KV PAIR NOT SET: ' + key + ' : ' + val)
                    });
        };
        $scope.getAllKeys = function() {
            $http.get(app.redisApi + 'rlist').
            success(function(data, status, headers, config) {
                $scope.keysList = data.keys;
                $scope.keysList.forEach(function(k) {
                    $scope.showKVFormFor[k] = false;
                });
                console.log("Keys retrieved successfully!");
            }).
            error(function(data, status, headers, config) {
                console.log("Unable to obtain keys from redis server. Check your connectiostring on the config tab!");
            });
        };
        this.getKeyVal = function(key) {
            $http.get(app.redisApi + "rget?key=" + key).
            success(function(data, status, headers, config) {
                $scope.cachedKeyVals[key] = data[key];
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
            console.log(model);
            if (!(model.key in $scope.keysList) && model.key !== "" && model.value !== "") {
                $scope.keysList.push(model.key);
                $scope.cachedKeyVals[model.key] = model.value;
                this.sendKV(model.key, model.value);
                console.log(model);
            }
            $scope.newKeyValModel = {};
            model = {};
        };
        //initial grab of keys
        $scope.getAllKeys();
        //$scope.keyCount = $scope.keyList.length;
        //this.filterForKeys("test search");
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