/**
 * Flotr Date
 */
Flotr.Date = {
  /**
   * Timeticks' step map
   * First value is its human readable name/identificator,
   * second value is a list of possible steps
   */
  spec: [
      ['years', [1]],
      ['months', [6, 3, 1]],
      ['days', [14, 7, 3, 1]],
      ['hours', [12, 6, 4, 3, 2, 1]],
      ['minutes', [30, 15, 10, 5, 2, 1]],
      ['seconds', [60, 30, 15, 10, 5, 1]]
  ],


  formats: {
      year: 'YYYY',
      month: 'MMM',
      day: 'MMM Do',
      hour: 'HH:mm',
      second: ':ss'
  },


  generator: function(axis){
    var
      timezone = moment().zone(),
      span = moment.twix(moment(axis.min), moment(axis.max)),
      idealStep = moment.duration(span.asDuration() / axis.options.noTicks),
      formats = _.extend(this.formats, axis.options.formats),
      step, stepId;

    // Calculate the real step
    _.every(this.spec, function(map){
      var keyValue = idealStep.get(map[0]), alignmentValue;

      if(!keyValue) return true;

      _.every(map[1], function(value){ alignmentValue = value; return (keyValue == value || keyValue % value == keyValue); });

      stepId = map[0];
      step = moment.duration(alignmentValue, stepId);

      return false;
    });

    span.start = this.align(span.start, step, -1);
    span.end = this.align(span.end, step, 1);

    // Iterate the ticks and stack them on x-axis
    var iterator = span.iterate(step), ticks = [];
    while(iterator.hasNext()){
        var tick = iterator.next();
        ticks.push({v: tick.valueOf(), label: this.format(formats, tick, stepId)});
    }

    return ticks;
  },


  format: function(formats, tick, step, timezone){
    var format = [];

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
  },


  align: function(timePoint, step, direction){
    var modulus = timePoint.valueOf() % step;
    return direction < 0 ? timePoint.subtract(modulus) : timePoint.subtract(modulus).add(step);
  }
};