///
///	code by Isaiah Smith
///		
///	https://technostalgic.itch.io  
///	twitter @technostalgicGM
///

var enemies = [];
var p1;

class player{
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

  getCol(){
    return this._col.centerAt(this.pos);
  }
  tilePos(){
    return snapPoint(this.pos);
  }

  particleBurst(killer){
    for(var i = 35; i > 0; i--){
      var p = new seekerParticle(this.pos.x, this.pos.y, "#55d", killer);
      p.setRandVel(Math.random() * 35);
      particles.push(p);
    }
  }
  applyGravity(){
    var maxfall = 10;

    this.vel.y += gravity * dt;
    if(this.vel.y > maxfall)
      this.vel.y = 10;
  }
  applyFriction(){
    this.vel.x *= ((0.8 - 1) * dt) + 1;
  }
  checkCols(){
    this.canJump = false;
    this.onCeil = false;
    this.checkBounds();
    this.checkBlocks();
  }
  checkBounds(){
    var c = this.getCol();
    if(c.bottom() >= playbottom)
      this.hitGround(playbottom);
    if(c.top() < playtop)
      this.hitCeiling(playtop);
    if(c.left() < playleft)
      this.hitLWall(playleft);
    if(c.right() > playright)
      this  .hitRWall(playright);
  }
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

      if(overlaps[i].size.x > overlaps[i].size.y){ //vcol
        if(c.top() == overlaps[i].top()){ // cieling
          this.hitCeiling(overlaps[i].bottom());
        }
        else{
          this.hitGround(overlaps[i].top());
        }
      }
      else{ //hcol
        if(c.left() == overlaps[i].left()){ //rw
          this.hitLWall(overlaps[i].right());
        }
        else{
          this.hitRWall(overlaps[i].left());
        }
      }
    }
  }
  hitBox(collision){
    switch(collision.closestEdge(this.pos.minus(new vec2(this.vel.x, 0)))){
      case 't': this.hitGround(collision.top()); break;
      case 'l': this.hitRWall(collision.left()); break;
      case 'r': this.hitLWall(collision.right()); break;
      case 'b': this.hitCeiling(collision.bottom()); break;
    }
  }
  hitGround(ypos){
    //console.log(this.vel);
    //console.log(this.pos.x);
    this.pos.y = ypos - this.getCol().size.y / 2;
    if(Math.abs(this.vel.y) > 5)
      sfx_bump.play();
    this.vel.y = 0;
    this.canJump = true;
  }
  hitCeiling(ypos){
    if(this.vel.y > 0)
      return;
    this.pos.y = ypos + this.getCol().size.y / 2 + .01;
    this.vel.y = 0;
    this.onCeil = true;
  }
  hitLWall(xpos){
    this.pos.x = xpos + this.getCol().size.x / 2;
    this.vel.x = 0;
  }
  hitRWall(xpos){
    this.pos.x = xpos - this.getCol().size.x / 2;
    this.vel.x = 0;
  }

  control(){
    if(this.isbuilding){
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
        else
          this.isbuilding = false;
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
  moveLeft(){
    if(!pointCollision(new vec2(this.pos.x - tilesize / 2, this.pos.y)))
      this.vel.x = this.speed * -1;
    this.aimDir = vec2.left();
  }
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
  moveRight(){
    if(!pointCollision(new vec2(this.pos.x + tilesize / 2, this.pos.y)))
      this.vel.x = this.speed;
    this.aimDir = vec2.right();
  }
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
  moveUp(){
    this.aimDir = vec2.up();
  }
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
  moveDown(){
    this.aimDir = vec2.down();
  }
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
  _jumpParticles(){
    var c = this.getCol();
    for(var i = 10; i > 0; i -= 1){
      var p = new particle(c.position.x + Math.random() * c.size.x, c.bottom());
      p.setRandVel(Math.random() * 10, -Math.PI, 0);
      p.vel = p.vel.minus(this.vel);
      p.add();
    }
  }
  build(){
    if(!this.canJump)
      return;
    if(!this.isbuilding)
      this.vel.x = 0;
    if(Math.abs(this.vel.x) < 0.1)
      this.pos = snapPoint(this.pos).plus(this.pos).multiply(.5);
    this.isbuilding = true;
  }
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
        this.vel = this.aimDir.multiply(-this.speed);
        if(this.aimDir.y == 1)
          this.vel.y -= 2;
      } 
    }
  }
  _getBreakBox(){
    var c = new box(0, 0, tilesize / 2, tilesize / 2);
    c.centerAt(this.pos.plus(this.aimDir.multiply(tilesize)));
    return c;
  }
  _getSpitBox(){
    var c = new box(0, 0, tilesize, tilesize);
    if(this.aimDir.x != 0)
      c.size.x = tilesize * 2;
    if(this.aimDir.y != 0)
      c.size.y = tilesize * 2;
    c.centerAt(this.pos.plus(this.aimDir.multiply(tilesize * 1.5)));
    return c;
  }
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
  placeBlock(pos){
    if(this.ammo <= 0)
      return;
    placeBlock(pos);
  }

  update(){
    this.applyGravity();
    this.applyFriction();
    this.pos = this.pos.plus(this.vel.multiply(dt));
    this.checkCols();
    this.control();
    this.attackdelay -= dt;
  }
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
class enemy{
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
      this.airFrictionY = .98;
    if(this.airFrictionY + this.airFrictionX > 1.85)
      this.speed *= 0.75 - Math.random() / 2;

    this._thinktimer = 80;
    this.active = false;
    this.seeking = false;
  }
  static firstEnemy(){
    var c = new enemy();
    c.pos = new vec2(width / 2, height / 2 + 200);
    c.speed = 0.15;
    c.bounceFriction = 0.5;
    c.airFrictionX = 0.93;
    c.airFrictionY = c.airFrictionX;
    return c;
  }

  canSeePlayer(){
    if(lostgame)
      return false;
    var rc = ray.fromPoints(this.pos, p1.pos);
    var rcbb = box.fromPoints(this.pos, p1.pos);
    var poscols = [];
    for(var i = 0; i < blocks.length; i++){
      if(box.testOverlap(blocks[i].col, rcbb))
        poscols.push(blocks[i]);
    }
    for(var i = 0; i < poscols.length; i++){
      if(poscols[i].col.testIntersect(rc))
        return false;
    }
    return true;
  }
  search(){
    this._thinktimer = Math.random() * 20 + 30;
    if(this.canSeePlayer()){
      this.seeking = true;
      this._thinktimer *= 4;
    }
    else{
      this.seeking = false;
      this.mov += Math.random(Math.PI / 2);
    }
  }
  seek(){
    var dif = p1.pos.minus(this.pos);
    dif = dif.normalized(this.speed);
    this.vel = this.vel.plus(dif.multiply(dt));
  }
  wander(){
    this.vel = this.vel.plus(vec2.fromAng(this.mov, this.speed * dt));
  }

  getCol(){
    return new box(this.pos.x - tilesize / 2, this.pos.y - tilesize / 2, tilesize, tilesize);
  }
  checkCols(){
    this.checkBounds();
    this.checkBlocks();
  }
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

      if(overlaps[i].size.x > overlaps[i].size.y){ //vcol
        if(c.top() == overlaps[i].top()){ // cieling
          this.hitCeiling(overlaps[i].bottom());
        }
        else{
          this.hitGround(overlaps[i].top());
        }
      }
      else{ //hcol
        if(c.left() == overlaps[i].left()){ //rw
          this.hitLWall(overlaps[i].right());
        }
        else{
          this.hitRWall(overlaps[i].left());
        }
      }
    }
  }
  hitBox(collision){
    switch(collision.closestEdge(this.pos.minus(new vec2(this.vel.x, 0)))){
      case 't': this.hitGround(collision.top()); break;
      case 'l': this.hitRWall(collision.left()); break;
      case 'r': this.hitLWall(collision.right()); break;
      case 'b': this.hitCeiling(collision.bottom()); break;
    }
  }
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
  hitCeiling(ypos){
    if(Math.abs(this.vel.y) > 2)
      sfx_enemybump.play();
    this.pos.y = ypos + this.getCol().size.y / 2;
    this.vel.y = this.bounceFriction * Math.abs(this.vel.y);
    if(!this.seeking)
      this.mov = Math.PI / 2;
  }
  hitLWall(xpos){
    if(Math.abs(this.vel.x) > 2)
      sfx_enemybump.play();
    this.pos.x = xpos + this.getCol().size.x / 2;
    this.vel.x = this.bounceFriction * Math.abs(this.vel.x);
    if(!this.seeking)
      this.mov = 0;
  }
  hitRWall(xpos){
    if(Math.abs(this.vel.x) > 2)
      sfx_enemybump.play();
    this.pos.x = xpos - this.getCol().size.x / 2;
    this.vel.x = -this.bounceFriction * Math.abs(this.vel.x);
    if(!this.seeking)
      this.mov = Math.PI;
  }
  _spawnParticles(){
    if(Math.random() > dt)
      return;
    var p = new seekerParticle(this.pos.x, this.pos.y, "#c00", this);
    p.setRandVel(Math.random() * 3 + 3);
    p.pos = p.pos.plus(p.vel.multiply(Math.random() + 1));
    particles.push(p);
  }

  update(){
    if(!this.active){
      this._thinktimer -= dt;
      this._spawnParticles();
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
    this.vel.x = this.vel.x * this.airFrictionX;
    this.vel.y = this.vel.y * this.airFrictionY;
    this.pos = this.pos.plus(this.vel.multiply(dt));
    this.checkCols();
    if(!lostgame)
      if(this.pos.distance(p1.pos) < tilesize){
        p1.particleBurst(this);
        losegame();
      }
    this._thinktimer -= dt;
    if(this._thinktimer <= 0)
      this.search();
  }
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
  for(var i = 0; i < enemies.length; i++){
    enemies[i].update();
  }
}
function drawEnemies(){
  for(var i = 0; i < enemies.length; i++){
    enemies[i].draw();
  }
}