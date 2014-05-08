(function(){

var D = Flotr.DOM;

Flotr.addPlugin('tooltip', {
	_tooltip: null,

	// Flotr callback bindings
	callbacks: {
		'mouseenter': function(event){
			if(this.options.tooltip === false) return;
			this.tooltip.show(event.originalEvent);
		},
		'flotr:track': function(position, series, values){
			if(this.options.tooltip === false) return;

			var serializedValues = [];
			for(var i = 0, length = series.length; i < length; i++) serializedValues.push([series[i].name, series[i].formatValue(values[i])]);
			this.tooltip.update(position, position.x, serializedValues);
		},
		'mouseleave': function(event){
			if(this.options.tooltip === false) return;
			this.tooltip.hide();
		}
	},


	create: function(){
		if(this.options.tooltip === false) return;
		
		var _tooltip = D.create('div');

		D.addClass(_tooltip, 'flotr-tooltip');
		D.addClass(_tooltip, 'hidden');

		D.insert(this.el, _tooltip);

		this.tooltip._tooltip = _tooltip;
	},


	show: function(event){
		if(!this.tooltip._tooltip) this.tooltip.create();
		D.removeClass(this.tooltip._tooltip, 'hidden');
	},


	update: function(position, time, values){
		var markup = '';
		for(var i = 0, length = values.length; i < length; i++) markup += '<tr><td>'+ values[i][0] +':</td><td>'+ values[i][1] +'</td></tr>';

		markup = '<table>'+ markup +'</table>';
		markup += '<p class="time">'+ moment(time).format('LLL') +'</p>';

		this.tooltip._tooltip.innerHTML = markup;

		var
			tooltipOffset = this.tooltip._tooltip.offsetWidth,
			offsetLeft = tooltipOffset / 2,
			plotOffset = this.plotOffset.left,
			marginLeft = Math.min(this.plotWidth - offsetLeft + plotOffset, Math.max(offsetLeft + plotOffset, position.relX + plotOffset));

		// Calculate position
		D.setStyles(this.tooltip._tooltip, {
			left: -offsetLeft +'px',
			marginLeft: marginLeft +'px'
		});
	},


	hide: function(){
		D.addClass(this.tooltip._tooltip, 'hidden');
	}
});

})();