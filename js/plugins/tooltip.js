(function(){

Flotr.addPlugin('tooltip', {
	// Flotr callback bindings
	callbacks: {
		'flotr:track': function(position, series, values){
			console.log('tracking! position:', position, 'series:', series, 'values:', values);
		}
	},


	drawTooltip: function(content, x, y, options) {
		var
			mt = this.getMouseTrack(),
			style = 'opacity:0.7;background-color:#000;color:#fff;display:none;position:absolute;padding:2px 8px;-moz-border-radius:4px;border-radius:4px;white-space:nowrap;',
			p = options.position,
			m = options.margin,
			plotOffset = this.plotOffset;

		if(x !== null && y !== null){
			if(!options.relative){ // absolute to the canvas
				if(p.charAt(0) == 'n') style += 'top:' + (m + plotOffset.top) + 'px;bottom:auto;';
				else if(p.charAt(0) == 's') style += 'bottom:' + (m + plotOffset.bottom) + 'px;top:auto;';
				if(p.charAt(1) == 'e') style += 'right:' + (m + plotOffset.right) + 'px;left:auto;';
				else if(p.charAt(1) == 'w') style += 'left:' + (m + plotOffset.left) + 'px;right:auto;';
			}else { // relative to the mouse
				if(p.charAt(0) == 'n') style += 'bottom:' + (m - plotOffset.top - y + this.canvasHeight) + 'px;top:auto;';
				else if(p.charAt(0) == 's') style += 'top:' + (m + plotOffset.top + y) + 'px;bottom:auto;';
				if(p.charAt(1) == 'e') style += 'left:' + (m + plotOffset.left + x) + 'px;right:auto;';
				else if(p.charAt(1) == 'w') style += 'right:' + (m - plotOffset.left - x + this.canvasWidth) + 'px;left:auto;';
			}

			mt.style.cssText = style;
			D.empty(mt);
			D.insert(mt, content);
			D.show(mt);
		}else{
			D.hide(mt);
		}
	}
});

})();