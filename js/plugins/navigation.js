(function(){

    var D = Flotr.DOM, E = Flotr.EventAdapter;

    Flotr.addPlugin('navigation', {
        __bounds: null,
        __panning: null,
        __navigationEvent: null,
    
        selX: null,
        selY: null,

        options: {
            mode: 'x',
            zoomFactor: 0.2
        },
        
        
        callbacks: {
            'flotr:afterinit': function(){
                if(this.options.navigation === false) return;

                this.navigation.__bounds = {x1: this.axes.x.min, y1: this.axes.y.min, x2: this.axes.x.max, y2: this.axes.y.max};
                this.navigation.__delta = {x: 0, y: 0};
                this.navigation.__lastPos = {x: 0, y: 0};
            
                this.navigation.selX = this.navigation.options.mode.indexOf('x') != -1;
                this.navigation.selY = this.navigation.options.mode.indexOf('y') != -1;
    
                E.observe(this.el, 'mousedown', this.navigation.__mouseDown);
                E.observe(this.el, 'mousemove', this.navigation.__mouseMove);
                E.observe(this.el, 'mouseup', this.navigation.__mouseUp);
                E.observe(this.el, 'flotr:centered', this.navigation.setCenter);
                E.observe(this.el, 'flotr:select', this.navigation.setBounds);
                E.observe(this.el, 'flotr:zoom', this.navigation.setBounds);

                E.observe(this.el, 'flotr:aftergrid', function(x, y, options, context){ context.navigation.__bounds = {x1: x.min, y1: y.min, x2: x.max, y2: y.max}; });
            }
        },
        
        
        /**
         * Is left click helper
         */
        __isLeftClick: function(event, type){
            return (event.which ? (event.which === 1) : (event.button === 0 || event.button === 1));
        },
        
        
        /**
         * Mousedown callback
         */
        __mouseDown: function(event){
            if(event.shiftKey) return;
    
            var pointer = this.getEventPosition(event);
    
            if(!this.navigation.options || !this.navigation.options.mode || (!this.navigation.__isLeftClick(event) && Flotr._.isUndefined(event.touches))) return;
            
            this.navigation.__bounds.x1 = this.axes.x.min;
            this.navigation.__bounds.x2 = this.axes.x.max;
            this.navigation.__bounds.y1 = this.axes.y.min;
            this.navigation.__bounds.y2 = this.axes.y.max;
    
            // Set mouse is down flag. Used to determine if we should pan the plot
            this.navigation.__mouseIsDown = true;
        },
        
        
        __mouseMove: function(event){
            // If the mouse is not down, do nothing
            if(!this.navigation.__mouseIsDown) return;
            // Set panning flag to true. This is used to determine if we should
            // fire the 'positioned' event on mouse up
            this.navigation.__panning = true;
    
            this.navigation.__delta.x += this.lastMousePos.dX;
            this.navigation.__delta.y += this.lastMousePos.dY;
    
            this.navigation.__pan();
        },
        
        
        /**
         * Mouseup callback
         */
        __mouseUp: function(event){
            // React only if mousedown was also triggered by this module
            if(!this.navigation.__mouseIsDown) return;
            // If the plot wasn't panned, trigger 'positioned' event
            if(!this.navigation.__panning) Flotr.EventAdapter.fire(this.el, 'flotr:position', this.getEventPosition(event));
            
            // Reset flags
            this.navigation.__mouseIsDown = false;
            this.navigation.__panning = false;
        },
    
    
        /**
         * Panning callback
         */
        __pan: function(){
            // If delta hasn't changed, stop here
            if(!this.navigation.__delta.x && !this.navigation.__delta.y) return;
    
            // Calculate delta on graph
            // Note: we're factoring dX and dY values to speed up the panning. The problem here lies that
            // Flotr calculates dX and dY for every mousemove event triggered on the container, but since
            // we're sampling these values with the rate determined by options.fps, we don't get all the
            // delta changes. And thus, we can either listen to mousemove event and sum values of delta changes
            // or try to keep it simple and factor these to try to smooth the issue.
            var dX = -(this.navigation.__delta.x / this.axes.x.scale);
            var dY = -(this.navigation.__delta.y / this.axes.y.scale);
    
            this.navigation.__delta.x = 0;
            this.navigation.__delta.y = 0;
    
            this.navigation.setBounds({
                x1: this.navigation.__bounds.x1 + dX,
                x2: this.navigation.__bounds.x2 + dX,
                y1: this.navigation.__bounds.y1 + dY,
                y2: this.navigation.__bounds.y2 + dY
            });
    
            Flotr.EventAdapter.fire(this.el, 'flotr:pan', this.navigation.__bounds);
        },
        
        
        /**
         * Bounds normalization helper
         */
        __normalizeBounds: function(range, axis){
            var delta;

            // If requested range overflows the beginning of graph's bounds
            if(range[0] < axis.datamin && range[1] <= axis.datamax){
                delta = axis.datamin - range[0];
                range[0] = axis.datamin;
                range[1] = Math.min(axis.datamax, range[1] + delta);
            // If requested range overflows the end of graph's bounds
            }else if(range[0] >= axis.datamin && range[1] > axis.datamax){
                delta = range[1] - axis.datamax;
                range[0] = Math.max(axis.datamin, range[0] - delta);
                range[1] = axis.datamax;
            // If requested range doesn't fit into graph's bounds no matter what we do
            }else if(range[0] < axis.datamin && range[1] > axis.datamax){
                range[0] = axis.datamin;
                range[1] = axis.datamax;
            } 
    
            return range;
        },
        
        
        /**
         * Follows the plot's playback position
         */
        follow: function(position){
            var
                padding = 0.1,
                span = this.axes.x.max - this.axes.x.min;
    
            if(position - this.axes.x.min >= span * (1 - padding)){
                this.navigation.setCenter(this.axes.x.min + 1.5 * span - (2 * span * padding));
            }else if(position - this.axes.x.min <= span * padding){
                this.navigation.setCenter(this.axes.x.min + 0.5 * span - (span * padding));
            }
        },
        
        
        /**
         * Allows the user to set center on plot manually
         */
        setCenter: function(position, preventEvent){
            position = position.x || position;
    
            var span = this.axes.x.max - this.axes.x.min;
            this.navigation.setBounds(GSM.util.extend({}, this.navigation.__bounds, {
                x1: position - span / 2,
                x2: position + span / 2
            }));
        },
        
        
        /**
         * Gets current bounds
         */
        getBounds: function(){
            return this.navigation.__bounds;
        },
    
    
        /**
         * Allows the user the manually set bounds.
         * @param {Object} bounds - Object with coordinates of bounds.
         */
        setBounds: function(bounds){
            var normalized;

            if(this.navigation.selY){
                normalized = this.navigation.__normalizeBounds([bounds.y1, bounds.y2], this.axes.y);
                this.navigation.__bounds.y1 = normalized[0];
                this.navigation.__bounds.y2 = normalized[1];

                _.each([this.axes.y, this.axes.y2], function(axis){ if(axis.scale) axis.calculateTicks(); });
            }
    
            if(this.navigation.selX){
                normalized = this.navigation.__normalizeBounds([bounds.x1, bounds.x2], this.axes.x);
                this.navigation.__bounds.x1 = normalized[0];
                this.navigation.__bounds.x2 = normalized[1];

                _.each([this.axes.x, this.axes.x2], function(axis){ if(axis.scale) axis.calculateTicks(); });
            }
    
            // Determine if we should redraw the plot.
            // The logic here is to determine if the bounds change translates to visible change on the plot
            // (more than one pixel change on the screen). If it does, the plot gets redrawn.
            if(
                (this.navigation.selX && (
                    Math.abs(this.navigation.__bounds.x1 - this.axes.x.min) * this.axes.x.scale >= 1 ||
                    Math.abs(this.navigation.__bounds.x2 - this.axes.x.max) * this.axes.x.scale >= 1
                )) ||
                (this.navigation.selY && (
                    Math.abs(this.navigation.__bounds.y1 - this.axes.y.min) * this.axes.y.scale >= 1 ||
                    Math.abs(this.navigation.__bounds.y2 - this.axes.y.max) * this.axes.y.scale >= 1
                ))
            ){
                window.requestAnimationFrame(function(ctx){
                    return function(){
                        ctx.redraw({
                            xmin: ctx.navigation.__bounds.x1,
                            xmax: ctx.navigation.__bounds.x2,
                            ymin: ctx.navigation.__bounds.y1,
                            ymax: ctx.navigation.__bounds.y2
                        });

                        E.fire(ctx.el, 'flotr:setBounds', ctx.navigation.__bounds);
                    };
                }(this));
            }
        }
    });
})();