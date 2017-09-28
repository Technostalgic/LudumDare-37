///
///	code by Isaiah Smith
///		
///	https://technostalgic.itch.io  
///	twitter @technostalgicGM
///

var particles = [];

class particle{
  constructor(x, y, color = "#000"){
    this.pos = new vec2(x, y);
    this.vel = new vec2();
    this.color = color;
  }

  setRandVel(factor, minDirection = 0, maxDirection = Math.PI * 2){
    var ang = Math.random() * (maxDirection - minDirection) + minDirection;
    this.vel = vec2.fromAng(ang, factor);
  }
  add(){
    particles.push(this);
  }

  update(thisindex){
    this.pos = this.pos.plus(this.vel.multiply(dt));
    this.vel = this.vel.multiply(0.85);
    if(this.vel.distance() < 1)
      particles.splice(thisindex, 1);
  }
  draw(){
    context.strokeStyle = this.color;
    context.lineWidth = 2;
    var f = this.vel.multiply(dt);
    context.beginPath();
    context.moveTo(this.pos.x - f.x, this.pos.y - f.y);
    context.lineTo(this.pos.x + f.x, this.pos.y + f.y);
    context.stroke();
  }
}
class seekerParticle extends particle{
  constructor(x, y, color, target = {pos: null}){
    super(x, y, color);
    this.target = target;
    this.seekmode = false;
    this.seekspeed = 1;
  }

  seek(){
    var dif = this.target.pos.minus(this.pos);
    dif = dif.normalized(this.seekspeed);
    this.vel = this.vel.plus(dif.multiply(dt));
  }

  update(thisindex){
    var friction = .85;
    if(!this.seekmode)
      if(this.vel.distance() < 1)
        this.seekmode = true;
    if(this.seekmode){
      this.seek();
      if(this.pos.distance(this.target.pos) < tilesize)
        particles.splice(thisindex, 1);
      friction = .9;
    }
    this.pos = this.pos.plus(this.vel.multiply(dt));
    this.vel = this.vel.multiply(0.85);
  }
}

function updateParticles(){
  for(var i = 0; i < particles.length; i += 1)
    particles[i].update(i);
}
function drawParticles(){
  for(var i = 0; i < particles.length; i += 1)
    particles[i].draw();
}