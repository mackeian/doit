var dashApp = angular.module('doitApp');

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
    };

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
    function _getDaysPassedOfCurrentWeek() {
        var ZERO_BASED_SUNDAY = 0;
        var SEVEN_BASED_SUNDAY = 7;
        var day_of_week = new Date().getDay();
        if (day_of_week === ZERO_BASED_SUNDAY) {
            day_of_week = SEVEN_BASED_SUNDAY;
        }
        var full_days_passed_of_week = day_of_week - 1;
        return full_days_passed_of_week;
    }
    function _getDaysPassedOfCurrentMonth() {
        var day_of_month = new Date().getDate();
        var days_in_month = new Date().monthDays();
        var full_days_passed_of_month = day_of_month - 1;
        return full_days_passed_of_month;
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
    function _dateWithoutTimeDetails(date) {
        date.setHours(0, 0, 0, 0);
        return date;
    }
    function _getWeekdayName(date) {
        var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        return days[date.getDay()];
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
        var today_date = _formatDateToISODateInTimezone(new Date());
        var hasActivityToday = false;
        var numberActivitiesInDuration = 0;
        var durationStartDate = _getStartDateOfDuration(goal);
        var durationEndDate = _getEndDateOfDuration(goal);
        goal.activities = lodash.sortBy(goal.activities, function(activity) {
            return new Date(activity.date_added);
        });
        var activity_added_dates_in_duration = [];
        angular.forEach(goal.activities, function(activity) {
            var added_date = _dateWithoutTimeDetails(new Date(activity.date_added));
            if (added_date >= durationStartDate && added_date <= durationEndDate) {
                numberActivitiesInDuration++;
                activity_added_dates_in_duration.push(added_date);
            }
            hasActivityToday = hasActivityToday || activity.date_added === today_date;
        });
        var days_passed_in_duration = -1;
        var days_left_in_duration = -1;
        var days_total_in_duration = -1;
        if (goal.duration === 'week') {
            days_passed_in_duration = _getDaysPassedOfCurrentWeek();
            days_left_in_duration = _getDaysLeftOfCurrentWeek();
            days_total_in_duration = DAYS_IN_A_WEEK;
        } else if (goal.duration === 'month') {
            days_passed_in_duration = _getDaysPassedOfCurrentMonth();
            days_left_in_duration = _getDaysLeftOfCurrentMonth();
            days_total_in_duration = _getDaysOfCurrentMonth();
        }

        var frequency_steps = [];
        var steps_completed = numberActivitiesInDuration;
        var percent_per_step = 1/goal.frequency;
        var duration_passed_percent = days_passed_in_duration / days_total_in_duration;

        var worst_incompleted_status = -1;
        for (var i=0; i<goal.frequency; i++) {
            var step_number = i + 1;
            var is_last_step = step_number === goal.frequency;
            var step_start_percent = i * percent_per_step;
            var step_end_percent = is_last_step ? 1 : step_start_percent + percent_per_step;
            var step_90_percent = step_end_percent - percent_per_step * 0.1;
            var step_50_percent = step_end_percent - percent_per_step * 0.5

            var is_step_completed = steps_completed >= step_number;

            var incompleted_status = null;
            var completed_at_label = '';
            if (is_step_completed) {
                if (goal.duration === 'week') {
                    completed_at_label = _getWeekdayName(activity_added_dates_in_duration[i]);
                } else if (goal.duration === 'month') {
                    completed_at_label = activity_added_dates_in_duration[i].getDate();
                    if (completed_at_label === 1) {
                        completed_at_label += 'st';
                    } else if (completed_at_label === 2) {
                        completed_at_label += 'nd';
                    } else if (completed_at_label === 3) {
                        completed_at_label += 'rd';
                    } else {
                        completed_at_label += 'th';
                    }
                }
            } else {
                if (duration_passed_percent >= step_90_percent) {
                    incompleted_status = 3;
                } else if (duration_passed_percent >= step_50_percent) {
                    incompleted_status = 2;
                } else if (duration_passed_percent >= step_start_percent) {
                    incompleted_status = 1;
                } else {
                    incompleted_status = 0;
                }
                worst_incompleted_status = incompleted_status > worst_incompleted_status ? incompleted_status : worst_incompleted_status;
            }
            frequency_steps.push(
                {
                    completed: is_step_completed,
                    completed_at_label: completed_at_label,
                    step_number: step_number,
                    incompleted_status: incompleted_status,
                    step_start_percent: step_start_percent,
                    step_90_percent: step_90_percent
                }
            );
        }
        //var last_step = lodash.last(frequency_steps);
        var goal_status = steps_completed === goal.frequency ? 100 : worst_incompleted_status;

        goal.statistics = {
            number_activities_in_duration: numberActivitiesInDuration,
            duration_start_formatted: _formatDateToISODateInTimezone(durationStartDate),
            duration_end_formatted: _formatDateToISODateInTimezone(durationEndDate),
            has_activity_today: hasActivityToday,
            days_passed_in_duration: days_passed_in_duration,
            days_left_in_duration: days_left_in_duration,
            days_total_in_duration: days_total_in_duration,
            frequency_steps: frequency_steps,
            current_status: goal_status
        };


    }
    function preProcessGoals(goals) {
        lodash.forEach(goals, function(goal) {
            _updateGoalProperties(goal);
        });
    }

    function _formatDateToISODateInTimezone(date) {
        var date_to_format = new Date(date);
        var hours_diff_from_utc = date.getTimezoneOffset()/60;
        var hours = date.getHours();
        date_to_format.setHours(hours - hours_diff_from_utc);
        return date_to_format.toISOString().slice(0, 10);
    }

    /* Public Goal */

    function addGoal(params) {
        goals.push(
            {
                'id': _generateUUID(),
                name: params.name,
                frequency: parseInt(params.frequency, 10),
                duration: params.duration
            }
        );
        _storeGoals();
    }

    function listGoals() {
        if (goals.length === 0) {
            goals = _fetchGoals();
        }
        preProcessGoals(goals);
        return goals;
    }

    function clearGoals() {
        goals = [];
        _storeGoals();
    }

    /* Public Activity */
    function addActivityOnGoal(goal, date_to_add) {
        if (date_to_add === undefined) {
            date_to_add = new Date();
        }
        date_to_add = _formatDateToISODateInTimezone(date_to_add);
        var date_today = _formatDateToISODateInTimezone(new Date());
        console.log('Adding date ' + date_to_add);

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
        _updateGoalProperties(goal);
        _storeGoals();
        return true;
    }

    function removeActivityOnGoal(goal, date_to_remove) {
        if (!goal.activities) {
            return false;
        }

        if (date_to_remove === undefined) {
            date_to_remove = new Date();
        }
        date_to_remove = _formatDateToISODateInTimezone(date_to_remove);
        var date_today = _formatDateToISODateInTimezone(new Date());
        var index_of_activity_on_date = lodash.findIndex(goal.activities, function(activity) {
           return activity.date_added === date_to_remove;
        });
        if (index_of_activity_on_date >= 0) {
            goal.activities.splice(index_of_activity_on_date, 1);
            _updateGoalProperties(goal);
            _storeGoals();
            return true;
        }
        return false;
    }

    /* Storage */
    function _storeGoals() {
        localStorage.setItem('doit:goals', angular.toJson(goals));
    }
    function _fetchGoals() {
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