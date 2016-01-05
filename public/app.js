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
    var DAYS_IN_A_WEEK = 7;

    Date.prototype.getWeek = function (dowOffset) {
    /*getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.epoch-calendar.com */

        dowOffset = typeof(dowOffset) == 'int' ? dowOffset : 0; //default dowOffset to zero
        var newYear = new Date(this.getFullYear(),0,1);
        var day = newYear.getDay() - dowOffset; //the day of week the year begins on
        day = (day >= 0 ? day : day + 7);
        var daynum = Math.floor((this.getTime() - newYear.getTime() -
        (this.getTimezoneOffset()-newYear.getTimezoneOffset())*60000)/86400000) + 1;
        var weeknum;
        //if the year starts before the middle of a week
        if(day < 4) {
            weeknum = Math.floor((daynum+day-1)/7) + 1;
            if(weeknum > 52) {
                nYear = new Date(this.getFullYear() + 1,0,1);
                nday = nYear.getDay() - dowOffset;
                nday = nday >= 0 ? nday : nday + 7;
                /*if the next year starts before the middle of
                  the week, it is week #1 of that year*/
                weeknum = nday < 4 ? 1 : 53;
            }
        }
        else {
            weeknum = Math.floor((daynum+day-1)/7);
        }
        return weeknum;
    };
    Date.prototype.monthDays= function(){
        var d= new Date(this.getFullYear(), this.getMonth()+1, 0);
        return d.getDate();
    }
    function _generateUUID(){
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

    function _getDaysLeftOfCurrentWeek() {
        var ZERO_BASED_SUNDAY = 0;
        var SEVEN_BASED_SUNDAY = 7;
        var day_of_week = new Date().getDay();
        if (day_of_week === ZERO_BASED_SUNDAY) {
            day_of_week = SEVEN_BASED_SUNDAY;
        }
        var days_left_of_week = DAYS_IN_A_WEEK - day_of_week;
        var full_days_left_of_week = days_left_of_week + 1;
        return full_days_left_of_week;
    }
    function _getDaysLeftOfCurrentMonth() {
        var day_of_month = new Date().getDate();
        var days_in_month = new Date().monthDays();
        var days_left_of_month = days_in_month - day_of_month;
        var full_days_left_of_month = days_left_of_month + 1;
        return full_days_left_of_month;
    }
    function _getDaysOfCurrentMonth() {
        return new Date().monthDays();
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
                'id': _generateUUID(),
                name: params['name'],
                frequency: params['frequency'],
                duration: params['duration']
            }
        );
        storeGoalsToDisk();
    }
    function _getStartDateOfDuration(goal) {
        if (goal.duration === 'week') {
            var start_date = new Date();
            // set to Monday of this week
            start_date.setDate(start_date.getDate() - (start_date.getDay() + 6) % 7);
        } else if (goal.duration === 'month') {
            var date = new Date();
            var start_date = new Date(date.getFullYear(), date.getMonth(), 1);
        }
        start_date.setHours(0,0,0,0);
        return start_date;
    }
    function _getEndDateOfDuration(goal) {
        if (goal.duration === 'week') {
            var end_date = new Date();
            // set to Monday of this week
            end_date.setDate(end_date.getDate() - (end_date.getDay() + 6) % 7 + 6);
        } else if (goal.duration === 'month') {
            var date = new Date();
            var end_date = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        }
        end_date.setHours(23,59,59,999);
        return end_date;
    }

    function _updateGoalProperties(goal) {
        var today_date = _serializerDate(new Date());
        var hasActivityToday = false;
        var numberActivitiesInDuration = 0;
        var durationStartDate = _getStartDateOfDuration(goal);
        var durationEndDate = _getEndDateOfDuration(goal)
        angular.forEach(goal.activities, function(activity) {
            var added_date = new Date(activity.date_added);
            if (added_date >= durationStartDate && added_date <= durationEndDate) {
                numberActivitiesInDuration++;
            }
            hasActivityToday = hasActivityToday || activity.date_added === today_date;
        });
        goal._number_activities_inn_duration = numberActivitiesInDuration;
        goal._duration_start = durationStartDate;
        goal._duration_end = durationEndDate;
        goal._has_activity_today = hasActivityToday;
        if (goal.duration === 'week') {
            goal._days_left = _getDaysLeftOfCurrentWeek();
            goal._days_total = DAYS_IN_A_WEEK;
        } else if (goal.duration === 'month') {
            goal._days_left = _getDaysLeftOfCurrentMonth();
            goal._days_total = _getDaysOfCurrentMonth();
        }

    }
    function preProcessGoals(goals) {
        var today_date = _serializerDate(new Date());
        lodash.forEach(goals, function(goal) {
            _updateGoalProperties(goal);
        });
    }
    function preSaveWorkOnGoals(goals) {
        lodash.forEach(goals, function(goal) {
            delete goal['_has_activity_today'];
            delete goal['_days_left'];
            delete goal['_days_total'];
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
        preSaveWorkOnGoals(goals);
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

    $scope.getDaysLeftOfGoalDuration = function(goal) {

    };

    function init() {
        $scope.goals = GoalService.listGoals();
    }

    init();
});

