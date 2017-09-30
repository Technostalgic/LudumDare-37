///
///	code by Isaiah Smith
///		
///	https://technostalgic.itch.io  
///	twitter @technostalgicGM
///

//initialize dynamic particle query:
var particles = [];

/* class particle
	Type that contains information to render and update particle effects
*/
class particle{
	/* constructor(x, y, color)
		initializes a particle instance
		parameters:
			x:Number - x coord of particle
			y:Nyumer - y coord of particle
			color:String - a color in hexadecimal format
	*/
	constructor(x, y, color = "#000"){
		this.pos = new vec2(x, y);
		this.vel = new vec2();
		this.color = color;
	}
	
	/* member function setRandVel(factor, minDirection, maxDirection)
		sets the particle's velocity to a random direction and speed
		parameters:
			factor:Number - the desired speed of the particle
			minDirection:Number - in radians, the minimum possible direction
			maxDirection:Number - in radians, the maximum possible direction
	*/
	setRandVel(factor, minDirection = 0, maxDirection = Math.PI * 2){
		var ang = Math.random() * (maxDirection - minDirection) + minDirection;
		this.vel = vec2.fromAng(ang, factor);
	}
	/* member function add()
		adds the particle to the dynamic particle query
	*/
	add(){
		particles.push(this);
	}
	
	/* update(thisindex)
		updates the particle
		parameters:
			thisindex:Number - the index of the particle in the dynamic particle query
	*/
	update(thisindex){
		this.pos = this.pos.plus(this.vel.multiply(dt));
		this.vel = this.vel.multiply(0.85);
		if(this.vel.distance() < 1)
		particles.splice(thisindex, 1);
	}
	/* member function draw()
		renders the particle on screen
	*/
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
/* class seekerParticle - particle
	a particle, but moves toward a target
*/
class seekerParticle extends particle{
	/* constructor(x, y, color, target)
		initializes a seekerParticle
		params:
			x - see super
			y - *
			color - *
			target:{pos:vec2} - the object for the particle to seek
	*/
	constructor(x, y, color, target = {pos: null}){
		super(x, y, color);
		this.target = target;
		this.seekmode = false;
		this.seekspeed = 1;
	}
	
	/* member function seek()
		moves the particle toward it's target
	*/
	seek(){
		var dif = this.target.pos.minus(this.pos);
		dif = dif.normalized(this.seekspeed);
		this.vel = this.vel.plus(dif.multiply(dt));
	}
	/* member function update(thisindex)
		see super
	*/
	update(thisindex){
		var friction = .85;
		
		//sets the particle to seek after reaching a low enough speed
		if(!this.seekmode)
			if(this.vel.distance() < 1)
				this.seekmode = true;
		
		if(this.seekmode){
			this.seek();
			
			//remove the particle when it gets too close to it's target
			if(this.pos.distance(this.target.pos) < tilesize)
				particles.splice(thisindex, 1);
			
			friction = .9;
		}
		this.pos = this.pos.plus(this.vel.multiply(dt));
		this.vel = this.vel.multiply(friction);
	}
}

function updateParticles(){
	/* function updateParticles()
		updates the particles in the dynamic particle query
	*/
	for(var i = 0; i < particles.length; i += 1)
		particles[i].update(i);
}
function drawParticles(){
	/* function drawParticles()
		draws the particles in the dynamic particle query
	*/
	for(var i = 0; i < particles.length; i += 1)
		particles[i].draw();
}