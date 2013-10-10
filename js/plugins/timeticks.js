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
                second: 'HH:mm:ss'
            }
        },
        
        
        /**
         * Spec object for time spans
         */
        spec: [
            [['years', 2], {tick: {step: ['months', 6], format: 'month'}, mainTick: {step: ['years', 1], format: 'year'}}],
            [['years', 1], {tick: {step: ['months', 3], format: 'month'}, mainTick: {step: ['years', 1], format: 'year'}}],
            [['months', 6], {tick: {step: ['months', 2], format: 'day'}, mainTick: {step: ['months', 1], format: 'month'}}],
            [['months', 3], {tick: {step: ['days', 14], format: 'day'}}],
            [['months', 1], {tick: {step: ['days', 7], format: 'day'}}],
            [['weeks', 2], {tick: {step: ['days', 4], format: 'day'}}],
            [['weeks', 1], {tick: {step: ['days', 2], format: 'month'}}],
            [['days', 2], {tick: {step: ['hours', 12], format: 'hour'}, mainTick: {step: ['days', 1], format: 'day'}}],
            [['hours', 24], {tick: {step: ['hours', 4], format: 'hour'}}],
            [['hours', 8], {tick: {step: ['hours', 2], format: 'hour'}}],
            [['hours', 3], {tick: {step: ['hours', 1], format: 'hour'}}],
            [['hours', 2], {tick: {step: ['minutes', 30], format: 'hour'}}],
            [['hours', 1], {tick: {step: ['minutes', 20], format: 'hour'}}],
            [['minutes', 30], {tick: {step: ['minutes', 10], format: 'hour'}}],
            [['minutes', 20], {tick: {step: ['minutes', 5], format: 'hour'}}],
            [['minutes', 10], {tick: {step: ['minutes', 2], format: 'hour'}}],
            [['minutes', 3], {tick: {step: ['minutes', 1], format: 'hour'}}],
            [['minutes', 2], {tick: {step: ['seconds', 30], format: 'second'}}],
            [['seconds', 30], {tick: {step: ['seconds', 10], format: 'second'}}],
            [['seconds', 10], {tick: {step: ['seconds', 5], format: 'second'}}],
            [['milliseconds', 1], {tick: {step: ['seconds', 1], format: 'second'}}]
        ],
        
        
        callbacks: {
            'flotr:beforegrid': function(series){
                if(this.options.xaxis.mode != 'smart-time') return;

                var
                    start = this.axes.x.min,
                    end = this.axes.x.max,
                    span = end - start,
                    datum, meta;

                // Get the starting point for our time calculations
                for(var i = 0, length = this.timeticks.spec.length, referenceMoment, referenceSpan, step; i < length; i++){
                    // We like it human readable, so let the computer crunch the numbers
                    referenceMoment = moment(0);
                    referenceSpan = referenceMoment.add.apply(referenceMoment, this.timeticks.spec[i][0]).unix() * 1000;

                    if(span > referenceSpan){
                        meta = this.timeticks.spec[i][1];

                        referenceMoment = moment(0);
                        step = referenceMoment.add.apply(referenceMoment, meta.tick.step).unix() * 1000;

                        datum = this.timeticks.findClosest(start, step);
                        break;
                    }
                }

                // Momentize the datum
                datum = moment(datum);

                var ticks = [];

                while(datum.unix() * 1000 < end){
                  // TODO: figure out a way to determine if tick matches main tick
                  ticks.push({
                    v: datum.unix() * 1000,
                    label: this.timeticks.format(datum.unix() * 1000, meta.tick.format)
                  });

                  datum.add.apply(datum, meta.tick.step);
                }

                this.axes.x.ticks = ticks;
            }
        },
        
        
        findClosest: function(point, span){
            var modulus = (point - moment().zone() * 60 * 1000) % span;
            return (modulus < span / 2) ? (point - modulus) : (point - modulus + span);
        },
        
        
        /**
         * Label formatter callback
         */
        format: function(time, format){
            time = moment(time);
            var formats = this.timeticks.options.formats;
            return time.format(formats[format]);
        }
    });

})();