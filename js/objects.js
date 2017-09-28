///
///	code by Isaiah Smith
///		
///	https://technostalgic.itch.io  
///	twitter @technostalgicGM
///

var blocks = [];
var coins = [];

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

function updateCoins(){
  for(var i = 0; i < coins.length; i++)
    coins[i].update();
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