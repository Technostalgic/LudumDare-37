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


init();