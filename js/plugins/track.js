(function () {

var E = Flotr.EventAdapter,
    _ = Flotr._;

Flotr.addPlugin('track', {

	_prevIndexes: [],
	_prevCoords: {x: -Number.MAX_VALUE, y: -Number.MAX_VALUE},
	_position: null,
	_trackInterval: null,

	options: {
		enabled: true,
		updateInterval: 100
	},

	callbacks: {
		// When mouse is downed (drag panning), stop the ticker
		'mousedown': function(){ this.track._stopTicker(); },
		// When the mouse is released, restart the ticker
		'mouseup': function(){ this.track._startTicker(); },
		'mouseenter': function(){ this.track._startTicker(); },
		'flotr:mousemove': function(event, position){ this.track._position = position; },
		'mouseleave': function(){ this.track._stopTicker(); }
	},


	_startTicker: function(){
		if(this.options.track.enabled === false) return;

		this.track._trackInterval = setInterval((function(context){
			return context.calculateHit;
		})(this.track), this.options.track.updateInterval);
	},


	_stopTicker: function(){
		if(this.options.track.enabled === false) return;

		clearInterval(this.track._trackInterval);
	},


	/**
	 * Hit calculation
	 */
	calculateHit: function(position){
		if(this.options.track.enabled === false) return;

		position = position || this.track._position;
		var
			values = [],
			prevX = this.track._prevCoords.x;

		// If the x-coordinate hasn't changed, do nothing
		if(prevX == position.x) return;

		seriesLoop:
		for(var i = 0, length = this.series.length, series, range, maxIndex, indexRange; i < length; i++){
			series = this.series[i];
			range = series.getRange();
			maxIndex = series.data.length - 1;
			indexRange = null;
			// Pre-populate the values container
			values[i] = null;

			// If we're overflowing the series' datarange, do nothing
			if(position.x < range.xmin){
				this.track._prevIndexes[i] = 0;
				continue seriesLoop;
			}else if(position.x > range.xmax){
				this.track._prevIndexes[i] = maxIndex;
				continue seriesLoop;
			}

			// Otherwise, try to find current value for series
			// First, get previous index for the series
			var index = this.track._prevIndexes[i] || 0;
			if(position.x < prevX){
				while(index >= 0){
					if(series.data[index][0] <= position.x){
						indexRange = index <= 0 ? 0 : [index, index + 1];
						break;
					}

					index--;
				}
			}else if(position.x > prevX){
				while(index <= maxIndex){
					if(series.data[index][0] >= position.x){
						indexRange = index >= maxIndex ? maxIndex : [index - 1, index];
						break;
					}

					index++;
				}
			}else{
				continue;
			}

			this.track._prevIndexes[i] = index;

			// Normalize indexRange
			if(!series.data[indexRange[0]] || !series.data[indexRange[1]]){
				if(series.data[indexRange[0]]){
					indexRange = indexRange[0];
				}else if(series.data[indexRange[1]]){
					indexRange = indexRange[1];
				}else{
					continue seriesLoop;
				}
			}

			if(typeof indexRange == 'number'){
				values[i] = series.data[indexRange] ? series.data[indexRange][1] : null;
			}else if(indexRange.constructor.toString().indexOf('Array') != -1){
				var
					x1 = series.xaxis.d2p(series.data[indexRange[0]][0]),
					y1 = series.yaxis.d2p(series.data[indexRange[0]][1]),
					x2 = series.xaxis.d2p(series.data[indexRange[1]][0]),
					y2 = series.yaxis.d2p(series.data[indexRange[1]][1]);

				values[i] = series.yaxis.p2d(((y2 - y1) / (x2 - x1)) * (position.relX - x1) + y1);
			}
		}

		// Stash current x-coordinate
		this.track._prevCoords.x = position.x;

		Flotr.EventAdapter.fire(this.el, 'flotr:track', [this.series, values]);
	}

});

})();