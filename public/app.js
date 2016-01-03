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
dashApp.service('GoalService', function($http) {
    function generateUUID(){
        var d = new Date().getTime();
        if(window.performance && typeof window.performance.now === "function"){
            d += performance.now();; //use high-precision timer if available
        }
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });
        return uuid;
    }
    var goal_skeleton = {
        'id': '',
        name: '',
        frequency: 1,
        duration: 'week'
    };
    function addGoal(params) {
        goals.push(
            {
                'id': generateUUID(),
                name: params['name'],
                frequency: params['frequency'],
                duration: params['duration']
            }
        );
        storeGoalsToDisk();
    }
    function listGoals() {
        if (goals.length === 0) {
            goals = fetchGoalsFromDisk();
        }
        return goals;
    }
    function clearGoals() {
        goals = [];
        storeGoalsToDisk();
    }
    function storeGoalsToDisk() {
        localStorage.setItem('doit:goals', JSON.stringify(goals));
    }
    function fetchGoalsFromDisk() {
        var fetched_goals = localStorage.getItem('doit:goals');
        if (fetched_goals) {
            return JSON.parse(fetched_goals);
        }
        return [];
    }

    var goals = [];
    return {
        addGoal: addGoal,
        listGoals: listGoals,
        clearGoals: clearGoals
    };
});

dashApp.controller('DashboardController', function($scope, GoalService) {
    $scope.STATE_ADD_GOAL = 'ADD_GOAL';
    $scope.state = null;

    $scope.showAddGoal = function() {
        $scope.state = $scope.STATE_ADD_GOAL;
    };
    $scope.cancelAddGoal = function() {
        $scope.state = null;
    };
    $scope.addGoal = function() {
        console.log('Add goal', $scope.add_goal_model);
        GoalService.addGoal($scope.add_goal_model);
        $scope.state = null;
        $scope.goals = GoalService.listGoals();
    };
    $scope.clearGoals = function() {
        GoalService.clearGoals();
        init();
    };

    function init() {
        $scope.goals = GoalService.listGoals();
    }

    init();
});

