/**
 * Flotr Series Library
 */

(function () {

var
  _ = Flotr._;

function Series (o) {
  _.extend(this, o);
}

Series.prototype = {
  range: {data: null},

  getRange: function () {
    // If dataset hasn't changed the range is based on, return cached results
    if(this.range.data === this.data) return this.range;

    var
      data = this.data,
      i = data.length,
      xmin = Number.MAX_VALUE,
      ymin = Number.MAX_VALUE,
      xmax = -Number.MAX_VALUE,
      ymax = -Number.MAX_VALUE,
      xused = false,
      yused = false,
      x, y;

    if (i < 0 || this.hide) return false;

    while(i--) {
      x = data[i][0], y = data[i][1];
      if (x !== null) {
        xmin = Math.min(xmin, x);
        xmax = Math.max(xmax, x);
      }
      if (y !== null) {
        ymin = Math.min(ymin, y);
        ymax = Math.max(ymax, y);
      }
    };

    this.range = {
      xmin : xmin,
      xmax : xmax,
      ymin : ymin,
      ymax : ymax,
      xused : (xmin != Number.MAX_VALUE || xmax != -Number.MAX_VALUE),
      yused : (ymin != Number.MAX_VALUE || ymax != -Number.MAX_VALUE),
      data: this.data,
      length: this.data.length
    };

    return this.range;
  }
};

_.extend(Series, {
  /**
   * Collects dataseries from input and parses the series into the right format. It returns an Array 
   * of Objects each having at least the 'data' key set.
   * @param {Array, Object} data - Object or array of dataseries
   * @return {Array} Array of Objects parsed into the right format ({(...,) data: [[x1,y1], [x2,y2], ...] (, ...)})
   */
  getSeries: function(data){
    return _.map(data, function(s){
      var series;
      if (s.data) {
        series = new Series();
        _.extend(series, s);
      } else {
        series = new Series({data:s});
      }
      return series;
    });
  }
});

Flotr.Series = Series;

})();
