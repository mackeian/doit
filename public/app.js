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
dashApp.service('GoalService', function($http, lodash) {
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
    function preProcessGoals(goals) {
        var today_date = _serializerDate(new Date());
        lodash.forEach(goals, function(goal) {
            var hasActivityToday =  lodash.find(goal.activities, function(activity) {
               return activity.date_added === today_date;
            });
            goal._has_activity_today = !!hasActivityToday;
        });
    }
    function preSaveWorkOnGoals(goals) {
        lodash.forEach(goals, function(goal) {
            delete goal['_has_activity_today'];
        });
    }

    function listGoals() {
        if (goals.length === 0) {
            goals = fetchGoalsFromDisk();
        }
        preProcessGoals(goals);
        return goals;
    }
    function clearGoals() {
        goals = [];
        storeGoalsToDisk();
    }

    function _serializerDate(date) {
        return date.toISOString().slice(0,10).replace(/-/g,"");
    }

    /* Activity */
    function addActivityOnGoal(goal, date_to_add) {
        if (date_to_add === undefined) {
            date_to_add = new Date();
        }
        date_to_add = _serializerDate(date_to_add);
        var date_today = _serializerDate(new Date());

        if (goal.activities === undefined) {
            goal.activities = [];
        }

        var activity_already_on_date = lodash.find(goal.activities, function(activity) {
                return activity.date_added === date_to_add;
            }
        );
        if (activity_already_on_date) {
            return false;
        }
        goal.activities.push(
            {
                date_added: date_to_add,
            }
        );
        goal._has_activity_today = goal._has_activity_today || date_to_add === date_today;
        storeGoalsToDisk();
        return true;
    }

    function removeActivityOnGoal(goal, date_to_remove) {
        if (!goal.activities) {
            return false;
        }

        if (date_to_remove === undefined) {
            date_to_remove = new Date();
        }
        date_to_remove = _serializerDate(date_to_remove);
        var date_today = _serializerDate(new Date());
        var index_of_activity_on_date = lodash.findIndex(goal.activities, function(activity) {
           return activity.date_added === date_to_remove;
        });
        if (index_of_activity_on_date >= 0) {
            goal.activities.splice(index_of_activity_on_date, 1);
            if (date_to_remove === date_today) {
                goal._has_activity_today = false;
            }
            storeGoalsToDisk();
            return true;
        }
        return false;
    }

    /* Storage */
    function storeGoalsToDisk() {
        localStorage.setItem('doit:goals', angular.toJson(goals));
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
        clearGoals: clearGoals,
        addActivityOnGoal: addActivityOnGoal,
        removeActivityOnGoal: removeActivityOnGoal
    };
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

    function init() {
        $scope.goals = GoalService.listGoals();
    }

    init();
});

