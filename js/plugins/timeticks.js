(function(){

var E = Flotr.EventAdapter,
    _ = Flotr._;

    Flotr.addPlugin('timeticks', {
        options: {
            noTicks: 6,
            formats: {
                year: 'YYYY',
                month: 'MMM',
                day: 'D. MMM',
                hour: 'HH:mm',
                second: ':ss'
            }
        },


        /**
         * Timeticks' step map
         * First value is its human readable name/identificator,
         * second value is a list of possible steps
         */
        stepMap: [
            ['years', [1]],
            ['months', [6, 3, 1]],
            ['days', [14, 7, 3, 1]],
            ['hours', [12, 6, 4, 3, 2, 1]],
            ['minutes', [30, 15, 10, 5, 2, 1]],
            ['seconds', [60, 30, 15, 10, 5, 1]]
        ],
        
        
        callbacks: {
            'flotr:beforegrid': function(series){
                if(this.options.xaxis.mode != 'smart-time') return;

                var
                    timezone = moment().zone(),
                    span = moment.twix(moment(this.axes.x.min), moment(this.axes.x.max)),
                    idealStep = moment.duration(span.asDuration() / this.timeticks.options.noTicks),
                    step, stepId;

                // Calculate the real step
                _.every(this.timeticks.stepMap, function(step){
                    var keyValue = idealStep.get(step[0]), alignmentValue;

                    if(!keyValue) return true;

                    _.every(step[1], function(value){ alignmentValue = value; return (keyValue == value || keyValue % value == keyValue); });

                    stepId = step[0];
                    step = moment.duration(alignmentValue, stepId);
                    return false;
                });

                span.start = this.timeticks.align(span.start, step, timezone, -1);
                span.end = this.timeticks.align(span.end, step, timezone, 1);

                // Iterate the ticks and stack them on x-axis
                var iterator = span.iterate(step), ticks = [];
                while(iterator.hasNext()){
                    var tick = iterator.next();
                    // NOTE: Flotr seems to do its own timezone managment, so we're settings TZ to 0 before
                    // creating the timestamp out of it
                    ticks.push({v: tick.zone(0).valueOf(), label: this.timeticks.format(tick, stepId)});
                }

                this.axes.x.ticks = ticks;
            }
        },
        
        
        align: function(timePoint, step, timezone, direction){
            var modulus = timePoint.zone(0).valueOf() % step;
            return direction < 0 ? timePoint.subtract(modulus) : timePoint.subtract(modulus).add(step);
        },
        
        
        /**
         * Label formatter callback
         */
        format: function(tick, step, timezone){
            var formats = this.timeticks.options.formats, format = [];

            switch(step){
                case 'years':
                    format = format.concat([formats.month, formats.year]);
                    break;
                case 'months':
                    format = format.concat([formats.day]);
                    if(tick.months() == 1) format.push(formats.year);
                    break;
                default:
                    if(tick.hours() == 0 && tick.minutes() == 0 && tick.seconds() == 0) format.push(formats.day);

                    if(step == 'seconds'){
                        format.push(tick.seconds() == 0 ? formats.hour + formats.second : formats.second);
                    }else{
                        format.push(formats.hour);
                    }
            }

            return tick.format(format.join(' '));
        }
    });

})();