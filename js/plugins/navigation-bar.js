(function(){

    var D = Flotr.DOM;

    Flotr.addPlugin('navigationBar', {
        element: null,
        minWidth: null,
        width: null,
        
        options: {
            container: null,
            handleMinWidth: 80
        },

        callbacks: {
            'flotr:afterinit': function(){
                if(this.options.navigationBar === false) return;
                this.navigationBar.render();
            },
            'flotr:destroy': function(){
                if(this.options.navigationBar === false) return;
                D.remove(this.navigationBar.element);
                this.navigationBar.element = null;
            },
            'flotr:setBounds': function(bounds){
                if(this.options.navigationBar === false) return;
                this.navigationBar.update(bounds);
            },
            'flotr:resize': function(size){
                this.navigationBar.width = D.size(this.navigationBar.element).width;
            }
        },
        
        
        /**
         * Pan callback
         */
        __pan: function(target, position){
            var
                bounds = this.navigation.__bounds,
                delta = this.axes.x.datamax - this.axes.x.datamin;

            bounds.x1 = this.axes.x.datamin + delta * position.relLeft;
            bounds.x2 = bounds.x1 + delta * position.relWidth;
            this.navigation.setBounds(bounds);
            return true;
        },
        
        
        /**
         * Update callback
         */
        update: function(bounds){
            var
                // Get left bound
                leftBound = (bounds.x1 - this.axes.x.datamin) / (this.axes.x.datamax - this.axes.x.datamin) * this.navigationBar.width,
                // Get right bound
                rightBound = (this.axes.x.datamax - bounds.x2) / (this.axes.x.datamax - this.axes.x.datamin) * this.navigationBar.width,
                // Calculate width
                width = Math.max(this.navigationBar.width - rightBound - leftBound, this.navigationBar.options.handleMinWidth);

            // Set width
            D.setStyles(this.navigationBar.handle, {left: leftBound+'px', width: width+'px'});
        },
        
        
        /**
         * Render callback
         */
        render: function(){
            // Create timeline container
            this.navigationBar.element = D.create('div');
            D.addClass(this.navigationBar.element, 'navigation-bar');
            D.setStyles(this.navigationBar.element, {marginLeft: Math.round(this.plotOffset.left)+'px', marginRight: Math.round(this.plotOffset.right)+'px'});
            
            // Create handle
            var handle = this.navigationBar.handle = D.create('div');
            D.addClass(handle, 'handle');
            new Application.UI.Behaviours.Draggable(handle, {
                constrainAxis: 'x',
                limitingElement: this.navigationBar.element,
                callbacks: {
                    drag: this.navigationBar.__pan
                }
            });
            
            // Create zoom handles
            var leftHandle = this.navigationBar.leftHandle = D.create('div');
            D.addClass(leftHandle, 'left');
            new Application.UI.Behaviours.Draggable(leftHandle, {
                constrainAxis: 'x',
                limitingElement: this.navigationBar.element,
                plot: this,
                callbacks: {
                    drag: function(draggable, position){
                        var left = handle.offsetLeft + position.deltaX;

                        // If we're about to overflow, quit
                        if(
                            left < 0 ||
                            left > handle.offsetLeft + handle.offsetWidth - draggable.options.plot.navigationBar.options.handleMinWidth
                        ) return false;

                        D.setStyles(handle, {
                            left: left + 'px',
                            width: handle.offsetWidth - position.deltaX + 'px'
                        });
                        
                        // Recalculate plot bounds
                        var bounds = draggable.options.plot.navigation.getBounds();
                        bounds.x1 = draggable.options.plot.axes.x.datamin + (draggable.options.plot.axes.x.datamax - draggable.options.plot.axes.x.datamin) * (left / draggable.options.limitingElement.offsetWidth);
                        draggable.options.plot.navigation.setBounds(bounds);
                        
                        // Don't let the draggable behaviour handle positioning of the handle
                        return false;
                    }
                }
            });
            
            var rightHandle = this.navigationBar.rightHandle = D.create('div');
            D.addClass(rightHandle, 'right');
            new Application.UI.Behaviours.Draggable(rightHandle, {
                constrainAxis: 'x',
                limitingElement: this.navigationBar.element,
                plot: this,
                callbacks: {
                    drag: function(draggable, position){
                        var width = handle.offsetWidth + position.deltaX;

                        // If we're about to overflow, quit
                        if(
                            handle.offsetLeft + width > draggable.__limitingElement.offsetWidth ||
                            width < draggable.options.plot.navigationBar.options.handleMinWidth
                        ) return false;
                        
                        D.setStyles(handle, {width: width+'px'});
                        
                        // Recalculate plot bounds
                        var bounds = draggable.options.plot.navigation.getBounds();
                        bounds.x2 = draggable.options.plot.axes.x.datamin + (draggable.options.plot.axes.x.datamax - draggable.options.plot.axes.x.datamin) * ((handle.offsetLeft + width) / draggable.options.limitingElement.offsetWidth);
                        draggable.options.plot.navigation.setBounds(bounds);
                        
                        // Don't let the draggable behaviour handle positioning of the handle
                        return false;
                    }
                }
            });
            
            // Attach zoom handles to pan handle (haah!)
            D.insert(this.navigationBar.handle, this.navigationBar.leftHandle);
            D.insert(this.navigationBar.handle, this.navigationBar.rightHandle);
            
            // Insert handle into timeline
            D.insert(this.navigationBar.element, this.navigationBar.handle);
            
            // Insert the timeline into DOM
            D.insert(this.options.navigationBar.container || this.el.parentNode, this.navigationBar.element);

            this.navigationBar.width = D.size(this.navigationBar.element).width;
            this.navigationBar.minWidth = D.size(this.navigationBar.leftHandle).width + D.size(this.navigationBar.rightHandle).width;
        }
    });
})(); 
