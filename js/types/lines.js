/** Lines **/
Flotr.addType('lines', {
  options: {
    show: false,           // => setting to true will show lines, false will hide
    lineWidth: 2,          // => line width in pixels
    fill: false,           // => true to fill the area from the line to the x axis, false for (transparent) no fill
    fillBorder: false,     // => draw a border around the fill
    fillColor: null,       // => fill color
    fillOpacity: 0.4,      // => opacity of the fill color, set to 1 for a solid fill, 0 hides the fill
    steps: false,          // => draw steps
    stacked: false,        // => setting to true will show stacked lines, false will show normal lines
    maxPoints: 300         // => maximum number of points to render. 
  },

  stack : {
    values : []
  },

  // Cache
  previousScale: null,
  simplifiedData: null,


  /**
   *
   */
  _simplify: function(data, options){

    var
      xScale = options.xScale,
      yScale = options.yScale,
      simplificationFactor = options.simplificationFactor,
      _data = [];

    var i = 0, length = data.length, segments = [], segment = [];

    while(true){
      // I see fail in my future
      if(i >= length) break;

      // If point's value is null, simplify the segment and push it to segments stack
      if(data[i][1] === null){
        if(segment.length >= 2) _data = _data.concat(simplify(segment, simplificationFactor), null);

        segment = [];
        ++i;
        continue;
      }

      segment.push([xScale(data[i][0]), yScale(data[i][1]), data[i]]);

      ++i;
    }

    // If there's something left in the segment object, stack it
    if(segment.length >= 2) _data = _data.concat(simplify(segment, simplificationFactor), null);

    return _data;
  },


  /**
   * Draws lines series in the canvas element.
   * @param {Object} options
   */
  draw : function (options) {

    var
      context     = options.context,
      lineWidth   = options.lineWidth,
      shadowSize  = options.shadowSize,
      offset;

    context.save();
    context.lineJoin = 'round';

    if (shadowSize) {

      context.lineWidth = shadowSize / 2;
      offset = lineWidth / 2 + context.lineWidth / 2;
      
      // @TODO do this instead with a linear gradient
      context.strokeStyle = "rgba(0,0,0,0.1)";
      this.plot(options, offset + shadowSize / 2, false);

      context.strokeStyle = "rgba(0,0,0,0.2)";
      this.plot(options, offset, false);
    }

    context.lineWidth = lineWidth;
    context.strokeStyle = options.color;

    this.plot(options, 0, true);

    context.restore();
  },

  plot : function (options, shadowOffset, incStack) {
    var
      context   = options.context,
      series    = options.series,
      width     = options.width, 
      height    = options.height,
      xScale    = options.xScale,
      yScale    = options.yScale,
      data      = options.data, 
      stack     = options.stacked ? this.stack : false,
      length    = data.length - 1,
      prevx     = null,
      prevy     = null,
      zero      = yScale(0),
      start     = null,
      x1, x2, y1, y2, stack1, stack2,
      maxPoints = options.maxPoints,
      simplificationFactor = width / maxPoints;
      
    var fill = function(){
      // TODO stacked lines
      if(!shadowOffset && options.fill && start){
        x1 = xScale(start[0]);
        context.fillStyle = options.fillStyle;
        context.lineTo(x2, zero);
        context.lineTo(x1, zero);
        context.lineTo(x1, yScale(start[1]));
        context.fill();
        
        if(options.fillBorder) context.stroke();
      }
    };

    if (length < 1) return;

    // If scale has changed (zoom has changed) resimplify the dataset
    if(series._previousScale != series.xaxis.scale) series.simplifiedData = this._simplify(data, {xScale: xScale, yScale: yScale, simplificationFactor: simplificationFactor});
    series._previousScale = series.xaxis.scale;

    var
      startIndex = null, endIndex = null,
      i = series.simplifiedData.length - 1,
      point,
      startTime = options.xInverse(0),
      endTime = options.xInverse(width);

    // Determine start and end indexes to draw
    while(i--){
      if(series.simplifiedData[i] === null) continue;

      point = series.simplifiedData[i][2];

      if(endIndex === null && point[0] < endTime) endIndex = i;
      if(startIndex === null && point[0] < startTime){
        startIndex = i;
        break;
      }
    }

    // Normalize start and end indexes
    startIndex = Math.max(0, startIndex - 1);
    endIndex = Math.min(endIndex + 2, series.simplifiedData.length - 1);

    // Now let's draw some!
    context.beginPath();

    for(i = startIndex, point, nextPoint; i < endIndex; i++){
      point = series.simplifiedData[i], nextPoint = series.simplifiedData[i+1];

      // Allow for empty values
      if(point === null || nextPoint === null){
        if(options.fill){
          if(i > 0){
            context.stroke();
            fill();
            start = null;
            context.closePath();
            context.beginPath();
          }
        }

        continue;
      }

      // Normalize points
      point = point[2], nextPoint = nextPoint[2];

      x1 = xScale(point[0]);
      x2 = xScale(nextPoint[0]);

      if(start === null) start = point;
        
      if(stack){
        stack1 = stack.values[point[0]] || 0;
        stack2 = stack.values[nextPoint[0]] || stack.values[point[0]] || 0;
        y1 = yScale(point[1] + stack1);
        y2 = yScale(nextPoint[1] + stack2);
        if (incStack) {
          stack.values[point[0]] = point[1] + stack1;
          if (i == length-1) {
            stack.values[nextPoint[0]] = nextPoint[1] + stack2;
          }
        }
      }else{
        y1 = yScale(point[1]);
        y2 = yScale(nextPoint[1]);
      }

      if((prevx != x1) || (prevy != y1 + shadowOffset)) context.moveTo(x1, y1 + shadowOffset);
      
      prevx = x2, prevy = y2 + shadowOffset;

      if(options.steps){
        context.lineTo(prevx + shadowOffset / 2, y1 + shadowOffset);
        context.lineTo(prevx + shadowOffset / 2, prevy);
      }else{
        //context.lineTo(prevx, prevy);
        var xc = (x1 + x2) / 2;
        var yc = (y1 + y2) / 2;
        context.quadraticCurveTo(x1, y1, xc, yc);
      }
    }
    
    if (!options.fill || options.fill && !options.fillBorder) context.stroke();
    
    fill();

    context.closePath();
  },

  // Perform any pre-render precalculations (this should be run on data first)
  // - Pie chart total for calculating measures
  // - Stacks for lines and bars
  // precalculate : function () {
  // }
  //
  //
  // Get any bounds after pre calculation (axis can fetch this if does not have explicit min/max)
  // getBounds : function () {
  // }
  // getMin : function () {
  // }
  // getMax : function () {
  // }
  //
  //
  // Padding around rendered elements
  // getPadding : function () {
  // }

  extendYRange : function (axis, data, options, lines) {

    var o = axis.options;

    // If stacked and auto-min
    if (options.stacked && ((!o.max && o.max !== 0) || (!o.min && o.min !== 0))) {

      var
        newmax = axis.max,
        newmin = axis.min,
        positiveSums = lines.positiveSums || {},
        negativeSums = lines.negativeSums || {},
        x, j;

      for (j = 0; j < data.length; j++) {

        x = data[j][0] + '';

        // Positive
        if (data[j][1] > 0) {
          positiveSums[x] = (positiveSums[x] || 0) + data[j][1];
          newmax = Math.max(newmax, positiveSums[x]);
        }

        // Negative
        else {
          negativeSums[x] = (negativeSums[x] || 0) + data[j][1];
          newmin = Math.min(newmin, negativeSums[x]);
        }
      }

      lines.negativeSums = negativeSums;
      lines.positiveSums = positiveSums;

      axis.max = newmax;
      axis.min = newmin;
    }

    if (options.steps) {

      this.hit = function (options) {
        var
          data = options.data,
          args = options.args,
          yScale = options.yScale,
          mouse = args[0],
          length = data.length,
          n = args[1],
          x = options.xInverse(mouse.relX),
          relY = mouse.relY,
          i;

        for (i = 0; i < length - 1; i++) {
          if (x >= data[i][0] && x <= data[i+1][0]) {
            if (Math.abs(yScale(data[i][1]) - relY) < 8) {
              n.x = data[i][0];
              n.y = data[i][1];
              n.index = i;
              n.seriesIndex = options.index;
            }
            break;
          }
        }
      };

      this.drawHit = function (options) {
        var
          context = options.context,
          args    = options.args,
          data    = options.data,
          xScale  = options.xScale,
          index   = args.index,
          x       = xScale(args.x),
          y       = options.yScale(args.y),
          x2;

        if (data.length - 1 > index) {
          x2 = options.xScale(data[index + 1][0]);
          context.save();
          context.strokeStyle = options.color;
          context.lineWidth = options.lineWidth;
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(x2, y);
          context.stroke();
          context.closePath();
          context.restore();
        }
      };

      this.clearHit = function (options) {
        var
          context = options.context,
          args    = options.args,
          data    = options.data,
          xScale  = options.xScale,
          width   = options.lineWidth,
          index   = args.index,
          x       = xScale(args.x),
          y       = options.yScale(args.y),
          x2;

        if (data.length - 1 > index) {
          x2 = options.xScale(data[index + 1][0]);
          context.clearRect(x - width, y - width, x2 - x + 2 * width, 2 * width);
        }
      };
    }
  }

});
