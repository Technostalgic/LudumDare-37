///
///	code by Isaiah Smith
///		
///	https://technostalgic.itch.io  
///	twitter @technostalgicGM
///

var enemies = []; // initialize dynamic enemy query
var p1; // main player

/* class player
	type used to represent a controllable player character
*/
class player{
	/* constructor()
		initislaizes a new player instance
	*/
	constructor(){
		this.pos = new vec2(width / 2, 500);
		this.vel = new vec2();
		this._col = new box(0, 0, tilesize, tilesize);
		this.speed = 3;
		this.canJump = true;
		this.onCeil = false;
		this.isbuilding = false;
		this.lastbuiltUp = false;
		this.aimDir = new vec2();
		this.ammo = 10;
		this.attackdelay = 20;
	}
	
	/* member function getCol()
		returns the player's collision bounding box
	*/
	getCol(){
		return this._col.centerAt(this.pos);
	}
	/* member function tilePos()
		the position of the tile that the player is in
	*/
	tilePos(){
		return snapPoint(this.pos);
	}
	
	/* member function particleBurst(killer)
		makes a particle effect when the player dies
	*/
	particleBurst(killer){
		for(var i = 35; i > 0; i--){
			var p = new seekerParticle(this.pos.x, this.pos.y, "#55d", killer);
			p.setRandVel(Math.random() * 35);
			particles.push(p);
		}
	}
	/* member function applyGravity()
		applies a gravitational force to the player
	*/
	applyGravity(){
		var maxfall = 10;
	
		this.vel.y += gravity * dt;
		if(this.vel.y > maxfall)
			this.vel.y = 10;
	}
	/* member function applyFriction()
		applies a frictional force to the player
	*/
	applyFriction(){
		this.vel.x *= ((0.8 - 1) * dt) + 1;
	}
	/* member function checkCols()
		chacks if the player is colliding with anything
	*/
	checkCols(){
		this.canJump = false;
		this.onCeil = false;
		this.checkBounds();
		this.checkBlocks();
	}
	/* member function checkBounds()
		checks to see if the player is colliding with the edges of the world
	*/
	checkBounds(){
		var c = this.getCol();
		if(c.bottom() >= playbottom)
			this.hitGround(playbottom);
		if(c.top() < playtop)
			this.hitCeiling(playtop);
		if(c.left() < playleft)
			this.hitLWall(playleft);
		if(c.right() > playright)
			this.hitRWall(playright);
	}
	/* member function checkBlocks()
		checks to see if the player is colliding with any blocks
	*/
	checkBlocks(){
		var overlaps = [];
		for (var i = 0; i < blocks.length; i += 1){
			if(box.testOverlap(this.getCol(), blocks[i].col))
				overlaps.push(box.intersection(this.getCol(), blocks[i].col));
		}
		this.collideOverlaps(overlaps);
	}
	/* member function collideOverlaps(overlaps)
		applies collisions to all of the detected overlaps
		params:
			overlaps:[box] - an array of collisions that should be applied
	*/
	collideOverlaps(overlaps){
		if(overlaps.length <= 0)
			return;
		var c = this.getCol();
		for(var i = 0; i < overlaps.length; i += 1){
			if(overlaps[i].largestSideLength() < 2)
				continue;
		
			if(overlaps[i].size.x > overlaps[i].size.y){ //vertical collision
				if(c.top() == overlaps[i].top()) // ceiling
					this.hitCeiling(overlaps[i].bottom());
				else this.hitGround(overlaps[i].top()); //ground
			}
			else{ //horizontal collision
				if(c.left() == overlaps[i].left()) //right wall
					this.hitLWall(overlaps[i].right());
				else this.hitRWall(overlaps[i].left()); // left wall
			}
		}
	}
	/* member function hitBox(collision)
		applies a collision between the player and a box
		params:
			collision:box - the collision to apply
	*/
	hitBox(collision){
		switch(collision.closestEdge(this.pos.minus(new vec2(this.vel.x, 0)))){
			case 't': this.hitGround(collision.top()); break;
			case 'l': this.hitRWall(collision.left()); break;
			case 'r': this.hitLWall(collision.right()); break;
			case 'b': this.hitCeiling(collision.bottom()); break;
		}
	}
	/* member function hitGround(ypos)
		applies a collision between the player and a floor
		params:
			ypos:Number - the y-position of the floor
	*/
	hitGround(ypos){
		//console.log(this.vel);
		//console.log(this.pos.x);
		this.pos.y = ypos - this.getCol().size.y / 2;
		if(Math.abs(this.vel.y) > 5)
		sfx_bump.play();
		this.vel.y = 0;
		this.canJump = true;
	}
	/* member function hitCeiling(ypos)
		applies a collision between the player and a ceiling
		params:
			pos:Number - the y-position of the ceiling
	*/
	hitCeiling(ypos){
		if(this.vel.y > 0)
		return;
		this.pos.y = ypos + this.getCol().size.y / 2 + .01;
		this.vel.y = 0;
		this.onCeil = true;
	}
	/* member function hitLWall(xpos)
		applies a collision between the player and a wall to the right
		params:
			pos:Number - the x-position of the right side of the wall
	*/
	hitLWall(xpos){
		this.pos.x = xpos + this.getCol().size.x / 2;
		this.vel.x = 0;
	}
	/* member function hitRWall(xpos)
		applies a collision between the player and a wall to the left
		params:
			pos:Number - the x-position of the left side of the wall
	*/
	hitRWall(xpos){
		this.pos.x = xpos - this.getCol().size.x / 2;
		this.vel.x = 0;
	}
	
	/* member function control()
		handles the input logic for the player
	*/
	control(){
		if(this.isbuilding){
			
			// used so that when the player finishes building upward, they get pulled back down to the ground instead of keeping their upward velocity
			var maxfall = 10;
			
			if(pressedControls.left){ 
				this.buildLeft();
				if(this.lastbuiltUp){
					this.vel.y = maxfall;
					this.lastbuiltUp = false;
				}
			}
			else if(pressedControls.right) {
				this.buildRight();
				if(this.lastbuiltUp){
					this.vel.y = maxfall;
					this.lastbuiltUp = false;
				}
			}
			else {
				if(pressedControls.up) {
					this.buildUp();
				}
				else if(pressedControls.down) {
					this.buildDown();
					this.lastbuiltUp = false;
				}
				else if(this.lastbuiltUp){
					this.vel.y = maxfall;
					this.lastbuiltUp = false;
				}
				else this.isbuilding = false;
			}
			if(pressedControls.jump) this.jump();
		
			if(pressedControls.build) this.build();
			else this.isbuilding = false;
			return;
		}
		
		if(pressedControls.left) this.moveLeft();
		else if(pressedControls.right) this.moveRight();
		if(pressedControls.up) this.moveUp();
		else if(pressedControls.down) this.moveDown();
		if(pressedControls.jump) this.jump();
		if(pressedControls.build) this.build();
		if(pressedControls.break) this.break();
	}
	/* member function moveLeft()
		moves the player left
	*/
	moveLeft(){
		if(!pointCollision(new vec2(this.pos.x - tilesize / 2, this.pos.y)))
			this.vel.x = this.speed * -1;
		this.aimDir = vec2.left();
	}
	/* member function buildLeft()
		makes the player build under themself while moving left
	*/
	buildLeft(){
		if(!this.canJump || this.ammo <= 0)
			return;
		this.moveLeft();
		var bpos = snapPoint(this.pos.plus(new vec2(-0.4, 1).multiply(tilesize)));
		var dpos = this.tilePos().plus(vec2.left().multiply(tilesize / 1.5));
		for(var i = blocks.length - 1; i >= 0; i--)
			if(blocks[i].col.containsPoint(dpos))
				breakBlock(blocks[i]);
		this.placeBlock(bpos);
	}
	/*member function moveRight()
		moves the player right
	*/
	moveRight(){
		if(!pointCollision(new vec2(this.pos.x + tilesize / 2, this.pos.y)))
			this.vel.x = this.speed;
		this.aimDir = vec2.right();
	}
	/* member function buildRight()
		makes the player build under themself while moving right
	*/
	buildRight(){
		if(!this.canJump || this.ammo <= 0)
			return;
		this.moveRight();
		var bpos = snapPoint(this.pos.plus(new vec2(0.4, 1).multiply(tilesize)));
		this.placeBlock(bpos);
		var dpos = this.tilePos().plus(vec2.right().multiply(tilesize / 1.5));
		for(var i = blocks.length - 1; i >= 0; i--)
			if(blocks[i].col.containsPoint(dpos))
				breakBlock(blocks[i]);
	}
	/* member function moveUp()
		makes the player aim upward
	*/
	moveUp(){
		this.aimDir = vec2.up();
	}
	/* member function buildUp()
		moves the player upward, creating blocks below them as they rise
	*/
	buildUp(){
		this.moveUp();
		if(this.ammo <= 0)
			return;
		this.lastbuiltUp = true;
		this.moveUp();
		this.vel.y = this.speed * -1;
		this.vel.x = 0;
		var bpos = this.tilePos().plus(vec2.down().multiply(tilesize));
		var dpos = this.tilePos().plus(vec2.up().multiply(tilesize / 1.5));
		for(var i = blocks.length - 1; i >= 0; i--)
			if(blocks[i].col.containsPoint(dpos))
				breakBlock(blocks[i]);
		this.placeBlock(bpos);
	}
	/* member function moveDown()
		makes the player aim downward
	*/
	moveDown(){
		this.aimDir = vec2.down();
	}
	/* member function buildDown()
		if there is a block below the player, it gets bumped one tile downward
	*/
	buildDown(){
		this.moveDown();
		if(!this.canJump)
			return;
		this.pos = snapPoint(this.pos);
		this.vel = new vec2();
		var dpos = this.tilePos().plus(vec2.down().multiply(tilesize));
		var bpos = dpos.plus(vec2.down().multiply(tilesize));
		for(var i = blocks.length - 1; i >= 0; i--)
			if(blocks[i].col.containsPoint(dpos))
				breakBlock(blocks[i]);
		this.placeBlock(bpos);
	}
	/* member function jump()
		makes the player jump into the air if they are on solid ground
	*/
	jump(){
		if(this.canJump && !this.onCeil){
			var c = this.getCol();
			c.position.y -= 1;
			if(boxCollision(c))
				return;
			sfx_jump.play();
			this._jumpParticles();
			this.vel.y = -7;
			this.canJump = false;
			this.isbuilding = false;
		}
		if(this.vel.y < 0)
			this.vel.y -= gravity * dt * 0.5;
	}
	/* member function _jumpParticles() - private
		creates a particle effect when the player jumps
	*/
	_jumpParticles(){
		var c = this.getCol();
		for(var i = 10; i > 0; i -= 1){
			var p = new particle(c.position.x + Math.random() * c.size.x, c.bottom());
			p.setRandVel(Math.random() * 10, -Math.PI, 0);
			p.vel = p.vel.minus(this.vel);
			p.add();
		}
	}
	/* member function build()
		should be called when the `build` control is being pressed
	*/
	build(){
		if(!this.canJump)
			return;
		if(!this.isbuilding)
			this.vel.x = 0;
		if(Math.abs(this.vel.x) < 0.1)
			this.pos = snapPoint(this.pos).plus(this.pos).multiply(.5);
		this.isbuilding = true;
	}
	/* member function break()
		the player's "attack" mechanism; breaks any blocks in the direction it's
		aimed, and knocks back enemies
	*/
	break(){
		if(this.attackdelay > 0 || this.aimDir.equals(new vec2()))
			return;
		this._breakParticles();
		this.attackdelay = 20;
		sfx_attack.play();
		var c = this._getBreakBox();
		for (var i = blocks.length - 1; i >= 0; i--) {
			if(box.testOverlap(blocks[i].col, c))
				breakBlock(blocks[i]);
		}
		c = this._getSpitBox();
		for(var i = enemies.length - 1; i >= 0; i--){
			if(box.testOverlap(enemies[i].getCol(), c)){
				sfx_hitenemy.play();
				enemies[i].vel = enemies[i].pos.minus(this.pos).normalized(10);
				enemies[i]._thinktimer = Math.random() * 20 + 30; // 30 - 50 ticks
				enemies[i].mov += Math.random(Math.PI / 2);
				enemies[i].seeking = false;
			
				this.vel = this.aimDir.multiply(-this.speed);
				if(this.aimDir.y == 1)
					this.vel.y -= 2;
			} 
		}
	}
	/* member function _getBreakBox()
		returns the block-testing collision box for the player's break "attack"
	*/
	_getBreakBox(){
		var c = new box(0, 0, tilesize / 2, tilesize / 2);
		c.centerAt(this.pos.plus(this.aimDir.multiply(tilesize)));
		return c;
	}
	/* member function _getSpitBox()
		returns the enemy-testing collision box for the player's break "attack"
	*/
	_getSpitBox(){
		var c = new box(0, 0, tilesize, tilesize);
		if(this.aimDir.x != 0)
			c.size.x = tilesize * 2;
		if(this.aimDir.y != 0)
			c.size.y = tilesize * 2;
			c.centerAt(this.pos.plus(this.aimDir.multiply(tilesize * 1.5)));
		return c;
	}
	/* member function _breakParticles()
		creates a particle effect for the player's break "attack"
	*/
	_breakParticles(){
		for(var i = 12; i > 0; i--){
			var p = new particle(this.pos.x, this.pos.y, "#00a");
			p.vel = this.aimDir.multiply(Math.random() * 5 + 3);
			p.vel = p.vel.plus(new vec2((Math.random() - .5) * 3, 3 * (Math.random() - .5)));
			//p.vel = p.vel.plus(new vec2(this.vel.x, 0));
			p.pos = p.pos.plus(p.vel.multiply(3));
			particles.push(p);
		}
	}
	/* member function _blockBreakParticles(block)
		creates a particle effect that represents a block breaking
		params:
			blok:block - the block to break
	*/
	_blockBreakParticles(blok){
		var bpos = new vec2(blok.col.position.x + blok.col.size.x / 2, blok.col.position.y + blok.col.size.y / 2);
		var s = 6;
		for(var i = 4; i > 0; i--){ //right
			var p = new seekerParticle(bpos.x, bpos.y + Math.random() * tilesize - tilesize / 2, "#333", p1);
			p.vel = new vec2(Math.random() * s, 0);
			p.pos = p.pos.plus(p.vel.multiply(2));
			particles.push(p);
			p.seekspeed = 2;
		}
		for(var i = 4; i > 0; i--){ //left
			var p = new seekerParticle(bpos.x, bpos.y + Math.random() * tilesize - tilesize / 2, "#333", p1);
			p.vel = new vec2(Math.random() * -s, 0);
			p.pos = p.pos.plus(p.vel.multiply(2));
			particles.push(p);
			p.seekspeed = 2;
		}
		for(var i = 4; i > 0; i--){ //down
			var p = new seekerParticle(bpos.x + Math.random() * tilesize - tilesize / 2, bpos.y, "#333", p1);
			p.vel = new vec2(0, Math.random() * s);
			p.pos = p.pos.plus(p.vel.multiply(2));
			particles.push(p);
			p.seekspeed = 2;
		}
		for(var i = 4; i > 0; i--){ //up
			var p = new seekerParticle(bpos.x + Math.random() * tilesize - tilesize / 2, bpos.y, "#333", p1);
			p.vel = new vec2(0, Math.random() * -s);
			p.pos = p.pos.plus(p.vel.multiply(2));
			particles.push(p);
			p.seekspeed = 2;
		}
	}
	/* member function placeBlock(pos)
		places a block at the specifield location if possible
		params:
			pos:vec2 - the position to place the block
	*/
	placeBlock(pos){
		if(this.ammo <= 0)
			return;
		placeBlock(pos); //global function call; not recursive
	}
	
	/* member function update()
		the main logic step for the player
	*/
	update(){
		this.applyGravity();
		this.applyFriction();
		this.pos = this.pos.plus(this.vel.multiply(dt));
		this.checkCols();
		this.control();
		this.attackdelay -= dt;
	}
	/* member function draw()
		renders the player on screen
	*/
	draw(){
		var fillcol = "#aaf";
		var strokecol = "#337";
		context.fillStyle = fillcol;
		context.strokeStyle = strokecol;
		context.lineWidth = 2;
		var c = this.getCol();
		context.fillRect(c.position.x, c.position.y, c.size.x, c.size.y);
		context.strokeRect(c.position.x, c.position.y, c.size.x, c.size.y);
	}
}
/* class enemy
	type used to represent a dangerous enemy character
*/
class enemy{
	/* constructor() 
		initilaizes an enemy object
	*/
	constructor(){
		this.pos = new vec2();
		this.vel = new vec2();
		this.mov = 0;
		this.speed = 0.25;
		this.bounceFriction = 1 - Math.random() * Math.random();
		this.airFrictionX = 1 - Math.random() * .2;
		this.airFrictionY = this.airFrictionX - (Math.random() - .5) * .2;
		if(this.airFrictionY >= .99)
			this.airFrictionY = .98;
		if(this.airFrictionX >= .99)
			this.airFrictionX = .98;
		if(this.airFrictionY + this.airFrictionX > 1.85)
			this.speed *= 0.75 - Math.random() / 2;
	
		this._thinktimer = 80;
		this.active = false;
		this.seeking = false;
	}
	
	/* static function firstEnemy()
		returns the first enemy that should appear
	*/
	static firstEnemy(){
		var c = new enemy();
		c.pos = new vec2(width / 2, height / 2 + 200);
		c.speed = 0.15;
		c.bounceFriction = 0.5;
		c.airFrictionX = 0.93;
		c.airFrictionY = c.airFrictionX;
		return c;
	}
	
	/* member function canSeePlayer()
		returns true if the enemy's view of the player is unobstructed
	*/
	canSeePlayer(){
		//enemy should act like it doesn't know where the player is if they're dead
		if(lostgame)
			return false;
		
		// casts a ray to see if the line of sight has anything in the way
		var rc = ray.fromPoints(this.pos, p1.pos);
		
		// creates a bounding box for the ray so that the ray only tests intersection
		// for the blocks in that bounding box
		var rcbb = box.fromPoints(this.pos, p1.pos);
		var poscols = []; // the blocks in the bounding box
		for(var i = 0; i < blocks.length; i++){
			if(box.testOverlap(blocks[i].col, rcbb))
				poscols.push(blocks[i]);
		}
		
		// tests ray intersection for all the blocks in th ebounding box
		for(var i = 0; i < poscols.length; i++){
			if(poscols[i].col.testIntersect(rc))
				return false; // there is a ray intersection, the enemy's view is obstructed
		}
		return true;
	}
	/* member function search()
		searches for the player and starts following them if the enemy can see them
	*/
	search(){
		this._thinktimer = Math.random() * 20 + 30; // 30 - 50 ticks
		if(this.canSeePlayer()){
			this.seeking = true;
			this._thinktimer *= 4;
		}
		else{
			this.seeking = false;
			this.mov += Math.random(Math.PI / 2);
		}
	}
	/* member function seek()
		seeks out and moves toward the player
	*/
	seek(){
		var dif = p1.pos.minus(this.pos);
		dif = dif.normalized(this.speed);
		this.vel = this.vel.plus(dif.multiply(dt));
	}
	/* member function wander()
		wanders around the world aimlessly
	*/
	wander(){
		this.vel = this.vel.plus(vec2.fromAng(this.mov, this.speed * dt));
	}

	/* member function getCol()
		returns the collision box for the enemy
	*/
	getCol(){
		return new box(this.pos.x - tilesize / 2, this.pos.y - tilesize / 2, tilesize, tilesize);
	}
	/* member function checkCols()
		checks all the necessary collisions
	*/
	checkCols(){
		this.checkBounds();
		this.checkBlocks();
	}
	/* member function checkBounds();
		checks collision with the world border
	*/
	checkBounds(){
		var c = this.getCol();
		if(c.bottom() >= playbottom)
			this.hitGround(playbottom);
		if(c.top() < playtop)
			this.hitCeiling(playtop);
		if(c.left() < playleft)
			this.hitLWall(playleft);
		if(c.right() > playright)
			this.hitRWall(playright);
	}
	/* member function checkBlocks()
		checks collision with all the blocks in the world
	*/
	checkBlocks(){
		var overlaps = [];
		for (var i = 0; i < blocks.length; i += 1){
			if(box.testOverlap(this.getCol(), blocks[i].col))
				overlaps.push(box.intersection(this.getCol(), blocks[i].col));
		}
		this.collideOverlaps(overlaps);
	}
	
	collideOverlaps(overlaps){
		if(overlaps.length <= 0)
			return;
		var c = this.getCol();
		for(var i = 0; i < overlaps.length; i += 1){
			if(overlaps[i].largestSideLength() < 2)
				continue;
			
			if(overlaps[i].size.x > overlaps[i].size.y){ //vertical collision
				if(c.top() == overlaps[i].top()) // cieling
					this.hitCeiling(overlaps[i].bottom());
				else this.hitGround(overlaps[i].top()); // floor	
			}
			else{ //horizontal collision
				if(c.left() == overlaps[i].left()) //right wall
					this.hitLWall(overlaps[i].right());
				else this.hitRWall(overlaps[i].left()); //left wall
			}
		}
	}
	/* member function hitBox(collision)
		applies a collision between the enemy and a box
	*/
	hitBox(collision){
		switch(collision.closestEdge(this.pos.minus(new vec2(this.vel.x, 0)))){
			case 't': this.hitGround(collision.top()); break;
			case 'l': this.hitRWall(collision.left()); break;
			case 'r': this.hitLWall(collision.right()); break;
			case 'b': this.hitCeiling(collision.bottom()); break;
		}
	}
	/* member function hitGround(ypos)
		applies a collision between the enemy and a floor
		params:
			ypos:Number - the y-position of the floor
	*/
	hitGround(ypos){
		//console.log(this.vel);
		//console.log(this.pos.x);
		if(Math.abs(this.vel.y) > 2)
			sfx_enemybump.play();
		this.pos.y = ypos - this.getCol().size.y / 2;
		this.vel.y = -this.bounceFriction * Math.abs(this.vel.y);
		if(!this.seeking)
			this.mov = Math.PI / -2;
	}
	/* member function hitCeiling(ypos)
		applies a collision between the enemy and a ceiling
		params:
			ypos:Number - the y-position of the ceiling
	*/
	hitCeiling(ypos){
		if(Math.abs(this.vel.y) > 2)
			sfx_enemybump.play();
		this.pos.y = ypos + this.getCol().size.y / 2;
		this.vel.y = this.bounceFriction * Math.abs(this.vel.y);
		if(!this.seeking)
			this.mov = Math.PI / 2;
	}
	/* member function hitLWall(xpos)
		applies a collision between the enemy and a wall to the left
		params:
			xpos:Number - the x-position of the left wall
	*/
	hitLWall(xpos){
		if(Math.abs(this.vel.x) > 2)
			sfx_enemybump.play();
		this.pos.x = xpos + this.getCol().size.x / 2;
		this.vel.x = this.bounceFriction * Math.abs(this.vel.x);
		if(!this.seeking)
			this.mov = 0;
	}
	/* member function hitRWall(xpos)
		applies a collision between the enemy and a wall to the right
		params:
			xpos:Number - the x-position of the right wall
	*/
	hitRWall(xpos){
		if(Math.abs(this.vel.x) > 2)
			sfx_enemybump.play();
		this.pos.x = xpos - this.getCol().size.x / 2;
		this.vel.x = -this.bounceFriction * Math.abs(this.vel.x);
		if(!this.seeking)
			this.mov = Math.PI;
	}
	/* member function _spawnParticles()
		creates a particle effect before spawning in the world, to warn the player
		where the enemy will spawn
	*/
	_spawnParticles(){
		if(Math.random() > dt)
			return;
		var p = new seekerParticle(this.pos.x, this.pos.y, "#c00", this);
		p.setRandVel(Math.random() * 3 + 3);
		p.pos = p.pos.plus(p.vel.multiply(Math.random() + 1));
		particles.push(p);
	}

	/* member function update()
		main logic step for enemy
	*/
	update(){
		//if it hasn't "spawned" yet
		if(!this.active){
			this._thinktimer -= dt;
			this._spawnParticles();

			//"spawns" the enemy
			if(this._thinktimer <= 0){
				this.active = true;
				this._thinktimer = 0;
			}
			return;
		}
		
		if(this.seeking)
			this.seek();
		else
			this.wander();
		
		//applies friction
		this.vel.x = this.vel.x * this.airFrictionX;
		this.vel.y = this.vel.y * this.airFrictionY;
		
		this.pos = this.pos.plus(this.vel.multiply(dt));
		this.checkCols();
		
		if(!lostgame)
			if(this.pos.distance(p1.pos) < tilesize){
				p1.particleBurst(this);
				losegame();
				this.search();
			}
		
		this._thinktimer -= dt;
		if(this._thinktimer <= 0)
			this.search();
	}
	/* member function draw()
		renders the enemy on screen
	*/
	draw(){
		if(!this.active)
			return;
		context.fillStyle = "#faa"
		context.strokeStyle = "#d33";
		context.lineWidth = 2;
		context.beginPath();
		context.arc(this.pos.x, this.pos.y, tilesize / 2, 0, Math.PI * 2);
		context.fill();
		context.stroke();
	}
}

function updateEnemies(){
	/* function updateEnemies()
		updates all the enemies in the dynamic enemy query
	*/
	for(var i = 0; i < enemies.length; i++)
		enemies[i].update();
}
function drawEnemies(){
	/* function drawEnemies()
		draws all the enemies in the dynamic enemy query
	*/
	for(var i = 0; i < enemies.length; i++)
		enemies[i].draw();
}