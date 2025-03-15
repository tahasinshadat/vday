/****************************************************
 * 1) DEFINE CONSTRUCTOR FUNCTIONS (FlowerGarden, etc.)
 ****************************************************/

// Vector for Petals
function Vector(x, y) {
  this.x = x;
  this.y = y;
}
Vector.prototype = {
  rotate: function(theta) {
    var x = this.x, y = this.y;
    this.x = Math.cos(theta)*x - Math.sin(theta)*y;
    this.y = Math.sin(theta)*x + Math.cos(theta)*y;
    return this;
  },
  mult: function(f) {
    this.x *= f;
    this.y *= f;
    return this;
  },
  clone: function() {
    return new Vector(this.x, this.y);
  }
};

// Petal
function Petal(stretchA, stretchB, startAngle, angle, growFactor, bloom) {
  this.stretchA = stretchA;
  this.stretchB = stretchB;
  this.startAngle = startAngle;
  this.angle = angle;
  this.growFactor = growFactor;
  this.bloom = bloom;
  this.r = 1;
  this.isfinished = false;
}
Petal.prototype.draw = function() {
  var ctx = this.bloom.garden.ctx;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  var v1 = new Vector(0, this.r).rotate(degToRad(this.startAngle));
  var v2 = v1.clone().rotate(degToRad(this.angle));
  var v3 = v1.clone().mult(this.stretchA);
  var v4 = v2.clone().mult(this.stretchB);
  ctx.strokeStyle = this.bloom.c;
  ctx.beginPath();
  ctx.moveTo(v1.x, v1.y);
  ctx.bezierCurveTo(v3.x, v3.y, v4.x, v4.y, v2.x, v2.y);
  ctx.stroke();
};
Petal.prototype.render = function() {
  if (this.r <= this.bloom.r) {
    this.r += this.growFactor;
    this.draw();
  } else {
    this.isfinished = true;
  }
};

// Bloom
function Bloom(p, r, c, pc, garden) {
  this.p = p;     // position
  this.r = r;     // radius
  this.c = c;     // color
  this.pc = pc;   // petal count
  this.garden = garden;
  this.petals = [];
  this.init();
  this.garden.addBloom(this);
}
Bloom.prototype.init = function() {
  var angle = 360 / this.pc;
  var startAngle = randomInt(0, 90);
  for (var i = 0; i < this.pc; i++) {
    this.petals.push(new Petal(
      random(FlowerGarden.options.petalStretch.min, FlowerGarden.options.petalStretch.max),
      random(FlowerGarden.options.petalStretch.min, FlowerGarden.options.petalStretch.max),
      startAngle + i * angle,
      angle,
      random(FlowerGarden.options.growFactor.min, FlowerGarden.options.growFactor.max),
      this
    ));
  }
};
Bloom.prototype.draw = function() {
  var finished = true;
  this.garden.ctx.save();
  this.garden.ctx.translate(this.p.x, this.p.y);
  for (var i = 0; i < this.petals.length; i++) {
    this.petals[i].render();
    finished = finished && this.petals[i].isfinished;
  }
  this.garden.ctx.restore();
  if (finished) {
    this.garden.removeBloom(this);
  }
};

// FlowerGarden "class"
function FlowerGarden(ctx, element) {
  this.blooms = [];
  this.ctx = ctx;
  this.element = element;
}
FlowerGarden.prototype = {
  render: function() {
    for (var i = 0; i < this.blooms.length; i++) {
      this.blooms[i].draw();
    }
  },
  addBloom: function(b) {
    this.blooms.push(b);
  },
  removeBloom: function(b) {
    for (var i = 0; i < this.blooms.length; i++) {
      if (this.blooms[i] === b) {
        this.blooms.splice(i, 1);
        return;
      }
    }
  },
  createRandomBloom: function(x, y) {
    this.createBloom(
      x, y,
      randomInt(FlowerGarden.options.bloomRadius.min, FlowerGarden.options.bloomRadius.max),
      randomrgba(
        FlowerGarden.options.color.rmin, FlowerGarden.options.color.rmax,
        FlowerGarden.options.color.gmin, FlowerGarden.options.color.gmax,
        FlowerGarden.options.color.bmin, FlowerGarden.options.color.bmax,
        FlowerGarden.options.color.opacity
      ),
      randomInt(FlowerGarden.options.petalCount.min, FlowerGarden.options.petalCount.max)
    );
  },
  createBloom: function(x, y, r, c, pc) {
    new Bloom(new Vector(x, y), r, c, pc, this);
  },
  clear: function() {
    this.blooms = [];
    this.ctx.clearRect(0, 0, this.element.width, this.element.height);
  }
};

// FlowerGarden Options
FlowerGarden.options = {
  petalCount:    { min: 8,  max: 15 },
  petalStretch:  { min: 0.1, max: 3 },
  growFactor:    { min: 0.1, max: 1 },
  bloomRadius:   { min: 8,  max: 10 },
  density:       10,
  growSpeed:     1000 / 60,
  color: {
    rmin: 128, rmax: 255,
    gmin: 0,   gmax: 128,
    bmin: 0,   bmax: 128,
    opacity: 0.2
  },
  tanAngle: 60
};

// Utility
function degToRad(deg) {
  return deg * Math.PI / 180;
}
function random(min, max) {
  return Math.random() * (max - min) + min;
}
function randomInt(min, max) {
  return Math.floor(random(min, max + 1));
}
function rgba(r, g, b, a) {
  return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}
function randomrgba(rmin, rmax, gmin, gmax, bmin, bmax, a) {
  var r = Math.round(random(rmin, rmax));
  var g = Math.round(random(gmin, gmax));
  var b = Math.round(random(bmin, bmax));
  return rgba(r, g, b, a);
}

/****************************************************
 * 2) NOW THE MAIN CODE AFTER DEFINITIONS
 ****************************************************/
$(document).ready(function() {
  /* =======================
     A) Live Timer
  ========================== */
  var together = new Date("May 17, 2024 12:15:00");
  function updateTimer() {
    var now = new Date();
    var diff = now - together;
    var seconds = Math.floor(diff / 1000) % 60;
    var minutes = Math.floor(diff / (1000 * 60)) % 60;
    var hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    $("#timer").text(
      days + " days " + hours + " hours " + minutes + " minutes " + seconds + " seconds"
    );
  }
  setInterval(updateTimer, 1000);
  updateTimer();
  
  /* =======================
     B) Floating Images (Fade Transition)
  ========================== */
  // Each key holds 5 image filenames in "images/" folder
  let imagesMapping = {
    0: ["images/p (17).jpg", "images/p (4).jpg", "images/p (25).jpg", "images/p (11).jpg", "images/p (30).jpg"],
    1: ["images/p (9).jpg", "images/p (2).jpg", "images/p (22).jpg", "images/p (13).jpg", "images/p (19).jpg"],
    2: ["images/p (6).jpg", "images/p (27).jpg", "images/p (3).jpg", "images/p (14).jpg", "images/p (21).jpg"],
    3: ["images/p (1).jpg", "images/p (26).jpg", "images/p (15).jpg", "images/p (8).jpg", "images/p (24).jpg"],
    4: ["images/p (12).jpg", "images/p (10).jpg", "images/p (28).jpg", "images/p (5).jpg", "images/p (16).jpg"],
    5: ["images/p (7).jpg", "images/p (29).jpg", "images/p (18).jpg", "images/p (23).jpg", "images/p (20).jpg"]
  };


  // For each image, we’ll:
//   - Assign a random cycle interval (e.g. 8-12 seconds)
//   - Use a 2-second fade out, then 2-second fade in
//   - Recursively schedule the next change
$('.floating-image').each(function() {
    var $img = $(this);
    var index = $img.data('index');
    var imgArray = imagesMapping[index];
    
    $img.data('imgArray', imgArray);
    $img.data('currentIndex', 0);
    $img.attr('src', imgArray[0]); // start with the first image
  
    // Random cycle time between 8s and 12s (8000-12000ms)
    var cycleTime = Math.floor(Math.random() * 9000) + 3000; 
    var fadeTime  = 2000; // 2 seconds fade
  
    // Recursive function to cycle each image
    function cycleImage() {
      setTimeout(function() {
        var currentIndex = $img.data('currentIndex');
        var nextIndex = (currentIndex + 1) % imgArray.length;
        $img.data('currentIndex', nextIndex);
  
        // Fade out, switch image, then fade in
        $img.fadeOut(fadeTime, function() {
          $img.attr('src', imgArray[nextIndex]).fadeIn(fadeTime);
        });
        
        // Schedule the next cycle
        cycleImage();
      }, cycleTime);
    }
  
    // Start cycling
    cycleImage();
  });
  
  /* =======================
     C) Flower Heart Animation
  ========================== */
  var $loveHeart = $("#loveHeart");
  var offsetX = $loveHeart.width() / 2;
  var offsetY = $loveHeart.height() / 2 - 55;
  
  // Prepare canvas
  var flowerCanvas = document.getElementById("flowerCanvas");
  flowerCanvas.width = $loveHeart.width();
  flowerCanvas.height = $loveHeart.height();
  var myGardenCtx = flowerCanvas.getContext("2d");
  // "source-over" so petals appear properly
  myGardenCtx.globalCompositeOperation = "source-over";
  
  // Our custom FlowerGarden instance
  var myGarden = new FlowerGarden(myGardenCtx, flowerCanvas);
  
  // Function to get a heart point for a given angle
  function getHeartPoint(angle) {
    var t = angle / Math.PI;
    var x = 19.5 * (16 * Math.pow(Math.sin(t), 3));
    var y = -20 * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
    return [offsetX + x, offsetY + y];
  }

  // Start the heart animation after 3 seconds
  function startHeartAnimation() {
    var interval = 50;
    var angle = 10;
    var heartPoints = [];
    var animationTimer = setInterval(function() {
      var bloomPoint = getHeartPoint(angle);
      var draw = true;
      for (var i = 0; i < heartPoints.length; i++) {
        var p = heartPoints[i];
        var distance = Math.sqrt(
          Math.pow(p[0] - bloomPoint[0], 2) + Math.pow(p[1] - bloomPoint[1], 2)
        );
        // Avoid overlapping blooms
        if (distance < FlowerGarden.options.bloomRadius.max * 1.3) {
          draw = false;
          break;
        }
      }
      if (draw) {
        heartPoints.push(bloomPoint);
        myGarden.createRandomBloom(bloomPoint[0], bloomPoint[1]);
      }
      if (angle >= 30) {
        clearInterval(animationTimer);
      } else {
        angle += 0.2;
      }
    }, interval);
  }

  // Trigger heart animation after 3 seconds
  setTimeout(startHeartAnimation, 3000);

  // Render loop for the FlowerGarden
  setInterval(function() {
    myGarden.render();
  }, FlowerGarden.options.growSpeed);
});
