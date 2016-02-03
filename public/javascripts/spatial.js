/*
 * Copyright 2013 Boris Smus. All Rights Reserved.

 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Modifications made by Nikhil Bhanu to extend the example found on http://chimera.labs.oreilly.com/books/1234000001552/ch06.html#s06_5
*/


function Field(canvas) {
    this.ZOOM_STEP = 1;
    this.canvas = canvas;
    this.isMouseInside = false;
    this.center = {x: canvas.width/2, y: canvas.height/2};
    this.angle = 0;
    this.zoom = 0;
    this.point = null;
    var canvasOffset = $("#canvas").offset();
    this.offsetX = canvasOffset.left;
    this.offsetY = canvasOffset.top;
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
    this.isDragging = false;
    this.loadedOnce = false;

    var obj = this;
    // Setup mouse listeners.
    canvas.addEventListener('mousedown', function() {
        obj.handleMouseDown.apply(obj, arguments)
    });
    canvas.addEventListener('mouseup', function() {
        obj.handleMouseUp.apply(obj, arguments)
    });
    canvas.addEventListener('mouseover', function() {
        obj.handleMouseOver.apply(obj, arguments)
    });
    canvas.addEventListener('mouseout', function() {
        obj.handleMouseOut.apply(obj, arguments)
    });
    canvas.addEventListener('mousemove', function() {
        obj.handleMouseMove.apply(obj, arguments)
    });
    canvas.addEventListener('mousewheel', function() {
        obj.handleMouseWheel.apply(obj, arguments);
    });
    // Setup keyboard listener
    window.addEventListener('keydown', function() {
        obj.handleKeyDown.apply(obj, arguments);
    });

    this.manIcon = new Image();
    this.manIcon.src = './images/man.svg';

    this.speakerIcon = new Image();
    this.speakerIcon.src = './images/speaker.svg';

    // Render the scene when the icon has loaded.
    var ctx = this;
    this.manIcon.onload = function() {
        ctx.render();
    }
}

Field.prototype.render = function() {
    // Draw points onto the canvas element.
    var ctx = this.canvas.getContext('2d');

    if(!this.loadedOnce) {
        ctx.drawImage(this.manIcon, this.center.x - this.manIcon.width/2,
                                    this.center.y - this.manIcon.height/2);
        ctx.drawImage(this.speakerIcon, this.center.x, this.center.y);
    }

    this.canMouseX=parseInt(this.clientX-this.offsetX);
    this.canMouseY=parseInt(this.clientY-this.offsetY);

    ctx.fill();

    if (this.point) {
        if(this.isDragging) {
            ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            ctx.drawImage(this.manIcon, this.point.x - this.manIcon.width/2, this.point.y - this.manIcon.height/2);
            ctx.drawImage(this.speakerIcon, this.center.x, this.center.y);
        }
    }
};

Field.prototype.handleMouseDown = function(e) {
    this.canMouseX = parseInt(e.clientX-this.offsetX);
    this.canMouseY = parseInt(e.clientY-this.offsetY);
    // set the drag flag
    this.isDragging = true;
    this.loadedOnce = true;
}

Field.prototype.handleMouseUp = function(e) {
    this.canMouseX = parseInt(e.clientX-this.offsetX);
    this.canMouseY = parseInt(e.clientY-this.offsetY);
    this.point = {x: e.offsetX, y: e.offsetY};
    this.render();
    if (this.callback) {
    // Callback in coordinate system centered at canvas center.
        this.callback({x: this.point.x - this.center.x,
                       y: this.point.y - this.center.y});
    }
    // clear the drag flag
    this.isDragging = false;
}

Field.prototype.handleMouseOver = function(e) {
    this.isMouseInside = true;
};

Field.prototype.handleMouseOut = function(e) {
      this.isMouseInside = false;
      if (this.callback) {
          this.callback(null);
      }
      this.point = null;
      this.render();
};

Field.prototype.handleMouseMove = function(e) {
    if (this.isMouseInside) {
        //Update the position.
        if(this.isDragging) {
            this.point = {x: e.offsetX, y: e.offsetY};
            // Re-render the canvas.
            this.render();
            // Callback.
            if (this.callback) {
                // Callback in coordinate system centered at canvas center.
                this.callback({x: this.point.x - this.center.x,
                               y: this.point.y - this.center.y});
            }
        }
    }
};

Field.prototype.handleKeyDown = function(e) {
      // If it's right or left arrow, change the angle.
      if (e.keyCode == 37 || e.keyCode == 38) {
          this.zoomIn(-this.ZOOM_STEP);
      } else if (e.keyCode == 39 || e.keyCode == 40) {
          this.zoomIn(this.ZOOM_STEP);
      }
};

Field.prototype.handleMouseWheel = function(e) {
      e.preventDefault();
      this.zoomIn(e.wheelDelta/500);
};

Field.prototype.zoomIn = function(delta) {
    this.zoom += delta;
    if (this.zoomCallback) {
        this.zoomCallback(this.zoom);
    }
    this.render();
}

Field.prototype.registerPointChanged = function(callback) {
    this.callback = callback;
};

Field.prototype.registerZoomChanged = function(callback) {
    this.zoomCallback = callback;
};

function SpatializedSample(el) {
      var sample = this;
      this.isPlaying = false;
      this.size = {width: 800, height: 700};

      // Load the sample to pan around.
      loadSounds(this, {
          buffer: './sounds/plan.mp3'
      });

      // Create a new canvas element.
      var canvas = document.createElement('canvas');
      canvas.setAttribute('id', 'canvas');
      canvas.setAttribute('width', this.size.width);
      canvas.setAttribute('height', this.size.height);
      el.appendChild(canvas);

      // Create a new Area.
      field = new Field(canvas);
      field.registerPointChanged(function() {
          sample.changePosition.apply(sample, arguments);
      });
      field.registerZoomChanged(function() {
          sample.changeZoom.apply(sample, arguments);
      });
}

SpatializedSample.prototype.play = function() {
      // Hook up the audio graph for this sample.
      var source = context.createBufferSource();
      source.buffer = this.buffer;
      source.loop = true;
      var panner = context.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 1;
      panner.maxDistance = 10000;
      panner.rolloffFactor = 1;
      panner.coneInnerAngle = 360;
      panner.coneOuterAngle = 0;
      panner.coneOuterGain = 0;
      panner.setOrientation(1,0,0);
      panner.setVelocity(0,0,0);
      // Set the panner node to be at the origin looking in the +x
      // direction.
      panner.connect(context.destination);
      source.connect(panner);
      source.start(0);
      // Position the listener at the origin.
      var listener = context.listener;

      listener.setPosition(0, 0, 0);
      foo = panner;

      // Expose parts of the audio graph to other functions.
      this.source = source;
      this.panner = panner;
      this.isPlaying = true;
}

SpatializedSample.prototype.stop = function() {
      this.source.stop(0);
      this.isPlaying = false;
}

SpatializedSample.prototype.changePosition = function(position) {
      // Position coordinates are in normalized canvas coordinates
      // with -0.5 < x, y < 0.5
      if (position) {
            if (!this.isPlaying) {
              this.play();
            }
            mul = 1;
            x = position.x / this.size.width;
            y = -position.y / this.size.height;
            if(typeof(this.zoom) === 'undefined')
                this.zoom = 0;
            this.panner.setPosition(x * mul, y * mul, -this.zoom);
      }
      else {
          this.stop();
      }
};

SpatializedSample.prototype.changeZoom = function(zoom) {
      this.zoom = zoom;
      this.panner.setPosition(x * mul, y * mul, -zoom);
};
