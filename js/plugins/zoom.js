(function(){

var E = Flotr.EventAdapter,
    _ = Flotr._;

    Flotr.addPlugin('zoom', {
        options: {
            zoomFactor: 0.2,
            mode: 'x'
        },
        
        
        callbacks: {
            'flotr:beforeinit': function(graph){
                E.observe(this.el, 'mousewheel', this.zoom.mouseWheel);
            },
            'flotr:destroy': function(){
                E.stopObserving(this.el, 'mousewheel', this.zoom.mouseWheel);
            }
        },
        
        
        /**
         * Mousewheel callback
         */
        mouseWheel: function(event){
            if(!event) event = window.event;

            var delta = 0, __e = event.originalEvent;
            if(__e.wheelDelta){
                delta = __e.wheelDelta;
            }else if(__e.detail){
                delta = -__e.detail;
            }

            delta = delta > 0 ? 1 : -1;

            this.zoom.zoom(delta);
            
            event.preventDefault();
        },
        
        
        /**
         * Graph bounds recalculator
         */
        zoom: function(delta){
            var
                zf = delta * this.zoom.options.zoomFactor,
                xa = this.axes.x,
                xaSpan = xa.max - xa.min,
                ya = this.axes.y,
                yaSpan = ya.max - ya.min,
                bounds = {
                    x1: xa.min,
                    x2: xa.max,
                    y1: ya.min,
                    y2: ya.max
                },
                zoomX = this.zoom.options.mode.indexOf('x') != -1,
                zoomY = this.zoom.options.mode.indexOf('y') != -1;

            // Recalculate bounds
            if(zoomX){
                bounds.x1 = ((bounds.x1 + xaSpan * zf) >= xa.datamin) ? (bounds.x1 + xaSpan * zf) : xa.datamin;
                bounds.x2 = ((bounds.x2 - xaSpan * zf) <= xa.datamax) ? (bounds.x2 - xaSpan * zf) : xa.datamax;
            }
            
            if(zoomY){
                bounds.y1 = ((bounds.y1 + yaSpan * zf) >= ya.datamin) ? (bounds.y1 + yaSpan * zf) : ya.datamin;
                bounds.y2 = ((bounds.y2 - yaSpan * zf) <= ya.datamax) ? (bounds.y2 - yaSpan * zf) : ya.datamax;
            }

            E.fire(this.el, 'flotr:zoom', [bounds, this]);
        }
    });

})();
