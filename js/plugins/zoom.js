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

            this.zoom.zoom(delta, this.getEventPosition(event));
            
            event.preventDefault();
        },
        
        
        /**
         * Graph bounds recalculator
         */
        zoom: function(delta, position){
            var
                dT,
                xa = this.axes.x,
                ya = this.axes.y,
                // Determine zoom factor
                zf = this.zoom.options.zoomFactor / 2,
                // Set initial bounds
                bounds = {x1: xa.min, x2: xa.max, y1: ya.min, y2: ya.max},
                // Determine which axes to zoom
                zoomX = this.zoom.options.mode.indexOf('x') != -1,
                zoomY = this.zoom.options.mode.indexOf('y') != -1;

            // Recalculate bounds
            if(zoomX){
                // Precalculate x-axis related stuff
                var
                  xaSpan = xa.max - xa.min,
                  mx = position ? position.x - xa.min : xaSpan / 2,
                  dMx = mx / xaSpan;

                bounds.x1 = Math.max(bounds.x1 + xaSpan * zf * delta, xa.datamin);
                bounds.x2 = Math.min(bounds.x2 - xaSpan * zf * delta, xa.datamax);

                // Calcualte translation delta
                dT = (0.5 - dMx) * (bounds.x2 - bounds.x1);

                // Normalize translation delta
                // If we need to pan left, check that the translation delta wouldn't overflow axis' datamin
                if(dT > 0){
                  dT = bounds.x1 - Math.max(bounds.x1 + dT, xa.datamin);
                // Otherwise check that the delta wouldn't overflow datamax
                }else{
                  dT = bounds.x2 - Math.min(bounds.x2 + dT, xa.datamax);
                }

                dT *= 0.25;

                bounds.x1 += dT;
                bounds.x2 += dT;
            }
            
            if(zoomY){
                // Precalculate y-axis related stuff
                var
                  yaSpan = ya.max - ya.min,
                  my = position ? position.y - ya.min : yaSpan / 2,
                  dMy = my / yaSpan;

                bounds.y1 = Math.max(bounds.y1 + yaSpan * zf * delta, ya.datamin);
                bounds.y2 = Math.min(bounds.y2 - yaSpan * zf * delta, ya.datamax);

                // Calcualte translation delta
                dT = (0.5 - dMy) * (bounds.y2 - bounds.y1);

                // Normalize translation delta
                // If we need to pan left, check that the translation delta wouldn't overflow axis' datamin
                if(dT > 0){
                  dT = bounds.y1 - Math.max(bounds.y1 + dT, ya.datamin);
                // Otherwise check that the delta wouldn't overflow datamax
                }else{
                  dT = bounds.y2 - Math.min(bounds.y2 + dT, ya.datamax);
                }

                dT *= 0.25;

                bounds.y1 += dT;
                bounds.y2 += dT;
            }

            E.fire(this.el, 'flotr:zoom', [bounds, this]);
        }
    });

})();
