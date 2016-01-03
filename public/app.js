var dashApp = angular.module('doitApp', ['ngRoute']);

dashApp.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
            when('/', {
                templateUrl: 'templates/dashboard.html',
                controller: 'DashboardController'
            })
            .otherwise({
                redirectTo: '/404'
            });
        }
    ]
);
dashApp.service('FooService', function($http) {
    var epics = {};
    return {
        get_epics: function() {
            return epics;
        },
        set_epics: function(_epics) {
            epics = _epics;
        }
    };
});

dashApp.controller('DashboardController', function($scope) {
   $scope.foo = 'Hej!';
});

