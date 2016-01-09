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
dashApp.service('lodash', function() {
   return _;
});

dashApp.controller('DashboardController', function($scope, GoalService) {
    $scope.STATE_ADD_GOAL = 'ADD_GOAL';
    $scope.STATE_ADD_ACTIVITY_ON_DATE = 'ADD_ACTIVITY_ON_DATE';
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

    $scope.addActivity = function(goal) {
        if (GoalService.addActivityOnGoal(goal)) {
            console.log('Added!');
        } else {
            console.log('Not added activity');
        }
    };

    $scope.removeActivity = function(goal) {
        if (GoalService.removeActivityOnGoal(goal)) {
            console.log('Removed!');
        } else {
            console.log('Not removed');
        }
    };

    $scope.showAddActivityOnDate = function(goal) {
        $scope.state = $scope.STATE_ADD_ACTIVITY_ON_DATE;
        $scope.add_activity_model = {
            goal: goal
        };
    };

    $scope.cancelAddActivityOnDate = function() {
        $scope.state = null;
    };

    $scope.addActivityOnDate = function() {
        if (!($scope.add_activity_model.date instanceof Date)) {
            return;
        }
        if (!GoalService.addActivityOnGoal($scope.add_activity_model.goal, $scope.add_activity_model.date)) {
            console.log('Already have activity on date. Ignoring');
        }
        $scope.state = null;
    };

    $scope.getDaysLeftOfGoalDuration = function(goal) {

    };

    function init() {
        $scope.goals = GoalService.listGoals();
    }

    init();
});

