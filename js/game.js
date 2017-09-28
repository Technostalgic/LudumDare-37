///
///	code by Isaiah Smith
///		
///	https://technostalgic.itch.io  
///	twitter @technostalgicGM
///

var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
var width = canvas.width;
var height = canvas.height;
var playtop = 70;
var playleft = 10;
var playright = width - 10;
var playbottom = height - 10;
var _lastTime = 0;
var dt = 0;

// gameplay variables:
var highscorestorage = "technonugget_ld37_highscore"; // the save key for the local storage of the browser
var introgame = true;
var setcontrols = 0;
var lostgame = false;
var lostmessage = "";
var score = 0;
var hiscore = 0;
var assignedcontrols = {};
var pressedControls = {};
var gravity = 0.3;
var tilesize = 20;
var p1;
var enemies = [];
var blocks = [];
var coins = [];
var particles = [];

// load audio:
var sfx_attack = new Audio("audio/attack.wav");
var sfx_breakblock = new Audio("audio/breakblock.wav");
var sfx_bump = new Audio("audio/bump.wav");
var sfx_collect = new Audio("audio/collect.wav");
var sfx_enemybump = new Audio("audio/enemybump.wav");
var sfx_hitenemy = new Audio("audio/hitenemy.wav");
var sfx_jump = new Audio("audio/jump.wav");
var sfx_lose = new Audio("audio/lose.wav");
var sfx_placeblock = new Audio("audio/placeblock.wav");


function clrCanvas(){
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
}
function assignControls(){
  assignedcontrols = {
    up: 38,
    down: 40,
    left: 37,
    right: 39,
    jump: 90,
    build: 88,
    break: 67
  };
  pressedControls = {
    up: false,
    down: false,
    left: false,
    right: false,
    jump: false,
    build: false,
    break: false
  };
  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);
}
function keyDown(args){
  //console.log(args.keyCode);
  if(setcontrols > 0){
    setControl(args.keyCode);
    return;
  }
  if(args.keyCode == 32){
    if(lostgame || introgame){
      if(setcontrols <= 0){
        saveHigh();
        startgame();
      }
    }
  }
  switch(args.keyCode){
    case 13:
      if(lostgame || introgame)
        setControls_begin();
      break;
    case assignedcontrols.left: pressedControls.left = true;
    break;
    case assignedcontrols.right: pressedControls.right = true;
    break;
    case assignedcontrols.up: pressedControls.up = true;
    break;
    case assignedcontrols.down: pressedControls.down = true;
    break;
    case assignedcontrols.jump: pressedControls.jump = true;
    break;
    case assignedcontrols.break: pressedControls.break = true;
    break;
    case assignedcontrols.build: pressedControls.build = true;
    break;
  }
}
function keyUp(args){
  switch(args.keyCode){
    case assignedcontrols.left: pressedControls.left = false;
    break;
    case assignedcontrols.right: pressedControls.right = false;
    break;
    case assignedcontrols.up: pressedControls.up = false;
    break;
    case assignedcontrols.down: pressedControls.down = false;
    break;
    case assignedcontrols.jump: pressedControls.jump = false;
    break;
    case assignedcontrols.break: pressedControls.break = false;
    break;
    case assignedcontrols.build: pressedControls.build = false;
    break;
  }
}
function init(){
  console.clear();
  loadHigh();
  assignControls();
  clrCanvas();
  requestAnimationFrame(step);
  startgame();
  introgame = true;
}
function step(){
  update(dt);
  requestAnimationFrame(step);
  dt = (performance.now() - _lastTime) / 16.666;
  _lastTime = performance.now();
}
function update(timescale){
  //console.log(timescale);
  if(timescale > 2){
    dt = 1;
    timescale = 1;
  }
  if(introgame){
    draw();
    return;
  }
  if(!lostgame)
    p1.update();
  updateEnemies();
  updateCoins();
  updateParticles();
  draw();
}
function draw(){
  clrCanvas();
  drawBlocks();
  if(!lostgame)
    p1.draw();
  drawEnemies();
  drawCoins();
  drawParticles();
  drawBorders();
  drawHUD();
  if(introgame)
    drawIntroScreen();
  if(lostgame)
    drawLoseScreen();
}

function loadHigh(){
  var hi = localStorage.getItem(highscorestorage);
  if(hi)
    hiscore = parseInt(hi);
  else hiscore = 0;
}
function saveHigh(){
  if(score > hiscore)
    hiscore = score;
  localStorage.setItem(highscorestorage, hiscore.toString());
}

function updateParticles(){
  for(var i = 0; i < particles.length; i += 1)
    particles[i].update(i);
}
function updateCoins(){
  for(var i = 0; i < coins.length; i++)
    coins[i].update();
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
function drawBlocks(){
  for(var i = 0; i < blocks.length; i += 1)
    blocks[i].draw();
}
function drawCoins(){
  for(var i = 0; i < coins.length; i++){
    coins[i].draw();
  }
}
function drawParticles(){
  for(var i = 0; i < particles.length; i += 1)
    particles[i].draw();
}
function drawBorders(){
  context.fillStyle = "#aaa";
  context.strokeStyle = "#555";
  context.lineWidth = 2;
  context.fillRect(0,0,width, playtop); //top
  context.fillRect(0,0,playleft, height); //left
  context.fillRect(playright, 0, width - playleft, height); //right
  context.fillRect(0, playbottom, width, height - playbottom) //bottom
  context.strokeRect(playleft, playtop, playright - playleft, playbottom - playtop); //inner
}
function drawHUD(){
  context.fillStyle = "#000";
  //score:
  context.font = "28px sans-serif";
  context.textAlign = "center";
  context.fillText("SCORE: " + score.toString(), width / 2, 40);

  //high:
  context.font = "12px sans-serif";
  context.textAlign = "center";
  context.fillText("HI: " + hiscore.toString(), width / 2, 60);

  //ammo:
  context.fillStyle = "#888";
  context.strokeStyle = "#222";
  context.lineWidth = 4;
  context.fillRect(20, 25, 30, 30);
  context.strokeRect(20, 25, 30, 30);
  context.font = "28px sans-serif";
  context.fillStyle = "#000";
  context.textAlign = "left";
  context.fillText("×" + p1.ammo.toString(), 60, 50);
}
function drawLoseScreen(){
  context.fillStyle = "rgba(0,0,0,0.7)";
  context.fillRect(playleft, playtop, playright - playleft, playbottom - playtop);
  
  if(setcontrols > 0){
    drawControlScreen("#fff");
    return;
  }

  context.fillStyle = "#fff";
  context.textAlign = "center";
  context.font = "48px sans-serif";
  context.fillText("GAME OVER", width / 2, 200);
  context.font = "12px sans-serif";
  context.fillText("press the spacebar to lose again", width / 2, 220);
  context.font = "24px sans-serif";
  context.fillText(lostmessage, width / 2, 320);
  context.font = "12px sans-serif";
  context.fillText("press ENTER to set controls", width / 2, height - 12);
}
function drawIntroScreen(){
  context.fillStyle = "rgba(255,255,255,0.7)";
  context.fillRect(0, 0, width, height);
  
  if(setcontrols > 0){
    drawControlScreen();
    return;
  }

  context.fillStyle = "#000";
  context.textAlign = "center";
  context.font = "bold 48px sans-serif";
  context.fillText("THE PIT", width / 2, 200);
  context.font = "18px sans-serif";
  context.fillText("press space to begin", width / 2, 230);
  context.font = "12px sans-serif";
  context.fillText("press ENTER to set controls", width / 2, height - 12);
}
function drawControlScreen(color = "#000"){
  context.fillStyle = color;
  context.textAlign = "center";
  context.font = "bold 48px sans-serif";
  context.fillText("Press key for " + getControlName(), width / 2, 200);
}

function placeBlock(pos){
  pos = snapPoint(pos);
  for(var i = 0; i < enemies.length; i++){
    if(enemies[i].pos.distance(pos) <= tilesize / 2)
      return;
  }
  if(!pointCollision(pos)){
    sfx_placeblock.currentTime = 0;
    sfx_placeblock.play();
    var blok = new block(pos.x, pos.y);
    blocks.push(blok);
    p1.ammo -= 1;
  }
}
function breakBlock(blok){
  p1._blockBreakParticles(blok);
  blocks.splice(blocks.indexOf(blok), 1);
  sfx_breakblock.currentTime = 0;
  sfx_breakblock.play();
  p1.ammo += 1;
  p1.vel = p1.vel.minus(p1.aimDir.multiply(p1.speed / 2));
}
function pointCollision(point){
  if(point.x <= playleft) return true;
  if(point.x >= playright) return true;
  if(point.y <= playtop) return true;
  if(point.y >= playbottom) return true;
  for(var i = 0; i < blocks.length; i += 1)
    if(blocks[i].col.containsPoint(point))
      return true;
  return false;
}
function boxCollision(bx){
  if(bx.left() < playleft) return true;
  if(bx.right() > playright) return true;
  if(bx.top() <= playtop) return true;
  if(bx.bottom() >= playbottom) return true;
  for(var i = 0; i < blocks.length; i += 1)
    if(box.testOverlap(blocks[i].col, bx))
      return true;
  return false;
}
function snapPoint(vect, centered = true){
  var a = new vec2(playleft, playtop);
  var v = vect.minus(a).multiply(1 / tilesize);
  v = new vec2(Math.floor(v.x), Math.floor(v.y));
  v = v.multiply(tilesize);
  if(centered)
    return v.plus(a).plus(new vec2(tilesize / 2));
  return v.plus(a);
}
function getTotalAmmo(){
  return p1.ammo + blocks.length;
}
function generateLoseMessage(){
  var m = [
  "Sucks to suck.",
  "Well then. That's that.",
  "lol",
  "Your family will miss you dearly",
  "¯\\_(ツ)_/¯",
  "You did good ( ͡° ͜ʖ ͡°)",
  "ಠ╭╮ಠ",
  "(╯°□°）╯︵ ┻━┻"
  ];
  return m[Math.floor(Math.random() * m.length)];
}

function loadBlocks(){
  blocks = [];
  for(var i = 0; i < 5; i++){
    blocks.push(new block(30 + i * tilesize, 400));
  }
  for(var i = 0; i < 5; i++){
    blocks.push(new block(540 + i * tilesize, 400));
  }
  for(var i = 0; i < 7; i++){
    blocks.push(new block(260 + i * tilesize, 200));
  }
}
function startcoin(){
  coins = [];
  var c = new coin(snapPoint(new vec2(width / 2, 100)));
  coins.push(c);
}
function setControls_begin(){
  setcontrols = 7;
}
function setControl(keycode){
  switch(setcontrols){
    case 7: assignedcontrols.right = keycode;
    break;
    case 6: assignedcontrols.left = keycode;
    break;
    case 5: assignedcontrols.up = keycode;
    break;
    case 4: assignedcontrols.down = keycode;
    break;
    case 3: assignedcontrols.break = keycode;
    break;
    case 2: assignedcontrols.build = keycode;
    break;
    case 1: assignedcontrols.jump = keycode;
    break;
  }
  setcontrols--;
}
function getControlName(){
  switch(setcontrols){
    case 7:
    return "'RIGHT'";
    case 6:
    return "'LEFT'";
    case 5: 
    return "'UP'";
    case 4: 
    return "'DOWN'";
    case 3: 
    return "'ATTACK'";
    case 2: 
    return "'BUILD'";
    case 1: 
    return "'JUMP'";
  }
}
function startgame(){
  score = 0;
  introgame = false;
  lostgame = false;
  p1 = new player();
  enemies = [];
  startcoin();
  particles = [];
  loadBlocks();
}
function losegame(reason = generateLoseMessage()){
  lostgame = true;
  lostmessage = reason;
  sfx_lose.play();
}

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
class block{
  constructor(x, y){
    this.col = new box(x - tilesize / 2, y - tilesize / 2, tilesize, tilesize);
    this.col.position = snapPoint(this.col.position, false);
  }

  draw(){
    this.col.drawFill(context, "#aaa")
    this.col.drawOutline(context, "#555");
  }
}
class coin{
  constructor(pos = new vec2()){
    this.pos = pos;
    this.animOffset = Math.random() * 10;
  }

  collect(){
    sfx_collect.play();
    coins.splice(coins.indexOf(this), 1);
    this._collectParticles();
    score += 1;
    coin.check();
    var totam = getTotalAmmo();
    if(totam < 50)
      p1.ammo += 5;
    else if(totam < 100)
      p1.ammo += 3;
    else if(totam < 125)
      p1.ammo += 1;
  }
  _collectParticles(){
    for(var i = 20; i > 0; i--){
      var p = new seekerParticle(this.pos.x, this.pos.y, "#cc0", p1);
      p.setRandVel(Math.random() * 10);
      particles.push(p);
    }
  }

  static check(){
    if(coins.length <= 0)
      this.drop();
  }
  static drop(){
    var p = snapPoint(new vec2(
      playleft + Math.random() * (playright - playleft), 
      playtop + Math.random() * (playbottom - playtop)));

    while(pointCollision(p) || p.distance(p1.pos) <= 100)
      p = snapPoint(new vec2(
        playleft + Math.random() * (playright - playleft), 
        playtop + Math.random() * (playbottom - playtop)));

    var c = new coin(p);
    coins.push(c);

    if(enemies.length <= 0){
      enemies.push(enemy.firstEnemy());
    }
    if(score % 6 == 0){
      var ep = snapPoint(new vec2(
        playleft + Math.random() * (playright - playleft), 
        playtop + Math.random() * (playbottom - playtop)));
        
      while(pointCollision(ep) || ep.distance(p1.pos) <= 100)
        ep = snapPoint(new vec2(
          playleft + Math.random() * (playright - playleft), 
          playtop + Math.random() * (playbottom - playtop)));

      var e = new enemy();
      e.pos = ep;
      enemies.push(e);
    }
  }

  update(){
    if(this.pos.distance(p1.pos) <= tilesize)
      this.collect();
  }
  draw(){
    var hs = ((performance.now() / 40 + this.animOffset) % 20) - 10;
    var vs = ((performance.now() / 40 + 10 + this.animOffset) % 20) - 10;
    hs /= 15;
    vs /= 15;
    var h1 = tilesize * -1 * hs + this.pos.x;
    var h2 = tilesize * hs + this.pos.x;
    var v1 = tilesize * -1 * vs + this.pos.y;
    var v2 = tilesize * vs + this.pos.y;

    context.fillStyle = "#ee0";
    context.strokeStyle = "#550";
    context.beginPath();
    context.arc(this.pos.x, this.pos.y, 7, 0, 2 * Math.PI);
    context.fill();
    context.stroke();
    context.fillStyle = "#dd0";
    context.strokeStyle = "#ff6";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(h1, this.pos.y);
    context.lineTo(this.pos.x, v1);
    context.lineTo(h2, this.pos.y);
    context.lineTo(this.pos.x, v2);
    context.fill();
    context.stroke();
  }
}
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


init();