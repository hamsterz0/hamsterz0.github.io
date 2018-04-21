var drops = []

function Drop() {
  this.x = random(width);
  this.y = random(-500, -50);
  this.z = random(0, 20);
  this.len = map(this.z, 0, 20, 1, 20);
  this.yspeed = map(this.z, 0, 20, 1, 10);

  this.fall = function() {
    this.y = this.y + this.yspeed;
    var grav = map(this.z, 0, 20, 0, 0.02);
    this.yspeed = this.yspeed + grav;

    if (this.y > height) {
      this.y = random(-200, -100);
      this.yspeed = map(this.z, 0, 20, 1, 5);
    }
  }

  this.show = function() {
    var thick = map(this.z, 0, 20, 4, 8);
    strokeWeight(thick);
    stroke(55, 216, 200);
    line(this.x, this.y, this.x, this.y+this.len);
  }
}

function setup() {
  ele = document.getElementsByTagName("BODY")[0];
  var cnv = createCanvas(ele.offsetWidth, ele.offsetHeight);
  cnv.style('position', 'fixed');
  cnv.style('z-index', '-1');
  cnv.parent('sketch-holder');
  for(let i = 0; i < 10; i++) {
    drops[i] = new Drop();
  }
}

function draw() {
  background(255, 255, 255);
  for(let i = 0; i < drops.length; i++) {
    drops[i].fall();
    drops[i].show();
  }
}
