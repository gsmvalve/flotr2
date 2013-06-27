(function(){

var E = Flotr.EventAdapter,
    _ = Flotr._;

    Flotr.addPlugin('timeticks', {
        options: {
            formats: {
                year: 'YYYY',
                month: 'MMM YYYY',
                day: 'D. MMM HH:mm',
                hour: 'HH:mm',
                second: 'HH:mm:ss'
            }
        },
        
        
        /**
         * Spec object for time spans
         * Note: we have set it up with two arrays since Chrome and possibly Opera autosort objects
         * by key. And since we need the order specified from biggest to smallest, the spec object
         * can't be implemented as {key: <meta>, key: <meta>, ...} which would be a lot cleaner way.
         */
        spec: {
            keys: [31536000000, 604800000, 259200000, 86400000, 21600000, 10800000, 7200000, 3600000, 1800000, 600000, 180000, 120000, 30000, 10000, 9999],
            meta: [
                // 31536000000
                {step: 18144000000, format: 'year'},
                // 604800000
                {step: 604800000, format: 'month'},
                // 259200000
                {step: 86400000, format: 'day'},
                // 86400000
                {step: 21600000, format: 'hour'},
                // 21600000
                {step: 7200000, format: 'hour'},
                // 10800000
                {step: 3600000, format: 'hour'},
                // 7200000
                {step: 1800000, format: 'hour'},
                // 3600000
                {step: 900000, format: 'hour'},
                // 1800000
                {step: 600000, format: 'hour'},
                // 600000
                {step: 300000, format: 'hour'},
                // 180000
                {step: 60000, format: 'hour'},
                // 120000
                {step: 30000, format: 'second'},
                // 30000
                {step: 10000, format: 'second'},
                // 10000
                {step: 5000, format: 'second'},
                // 9999
                {step: 1000, format: 'second'}
            ]
        },
        
        
        callbacks: {
            'flotr:beforegrid': function(series){
                if(this.options.xaxis.mode != 'smart-time') return;

                var
                    start = this.axes.x.min,
                    end = this.axes.x.max,
                    span = end - start,
                    datum, meta;

                // Get the starting point for our time calculations
                for(var i = 0, length = this.timeticks.spec.keys.length, limit; i < length; i++){
                    limit = this.timeticks.spec.keys[i];
                    if(span > limit){
                        meta = this.timeticks.spec.meta[i];
                        datum = this.timeticks.findClosest(start, meta.step);
                        datum = datum > start ? datum : datum + meta.step;
                        break;
                    }
                }
                
                // Rebuild the ticks
                this.axes.x.ticks = [];
                while(datum < this.axes.x.max){
                    this.axes.x.ticks.push({
                        v: datum,
                        label: this.timeticks.format(datum, meta.format)
                    });
                    datum += meta.step;
                }
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
            if(time.month() === 0 && time.date() == 1) return time.format(formats.year);
            if(time.date() == 1) return time.format(formats.month);
            if(time.hours() === 0 && time.minutes() === 0) return time.format(formats.day);
            return time.format(formats[format]);
        }
    });

})();
