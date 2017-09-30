///
///	code by Isaiah Smith
///		
///	https://technostalgic.itch.io  
///	twitter @technostalgicGM
///

var blocks = [];
var coins = [];

/* class block
	contains information about pieces of the game's dynamic terrain
*/
class block{
	/* constructor(x, y)
		initializes a block at the specified location
		params:
			x:Number - x coordinate
			y:Number - y coordinate
	*/
	constructor(x, y){
		this.col = new box(x - tilesize / 2, y - tilesize / 2, tilesize, tilesize);
		this.col.position = snapPoint(this.col.position, false);
	}
	
	/* function draw()
		renders the block on screen
	*/
	draw(){
		this.col.drawFill(context, "#aaa")
		this.col.drawOutline(context, "#555");
	}
}
/* class coin
	type used to represent a collectible item
*/
class coin{
	/* constructor(pos)
		initializes a new coin
		params:
			pos:vec2 - the position of the coin
	*/
	constructor(pos = new vec2()){
		this.pos = pos;
		this.animOffset = Math.random() * 10;
	}
	
	/* member function collect()
		called when the player collides with the coin
	*/
	collect(){
		sfx_collect.play();
		coins.splice(coins.indexOf(this), 1); //remove the coin from the query
		this._collectParticles(); // particle effect
		score += 1; //gives point
		coin.check();
		
		//gives varying amounts of ammo based on the total amount of blocks in the world
		var totam = getTotalAmmo();
		if(totam < 50)
			p1.ammo += 5;
		else if(totam < 100)
			p1.ammo += 3;
		else if(totam < 125)
			p1.ammo += 1;
	}
	/* member function _collectParticles() - private
		creates particles for emphasis
	*/
	_collectParticles(){
		for(var i = 20; i > 0; i--){
			var p = new seekerParticle(this.pos.x, this.pos.y, "#cc0", p1);
			p.setRandVel(Math.random() * 10);
			particles.push(p);
		}
	}
	
	/* class function check()
		checks to see if another coin should spawn
	*/
	static check(){
		if(coins.length <= 0)
			coin.drop();
	}
	/* class function drop()
		drops a coin in a random location
	*/
	static drop(){
		// finds a random tile position within the world bounds
		var p = snapPoint(new vec2(
			playleft + Math.random() * (playright - playleft), 
			playtop + Math.random() * (playbottom - playtop)));
		
		// makes sure the point is far enough away from the player and 
		// not inside of any blocks
		while(pointCollision(p) || p.distance(p1.pos) <= 100)
			p = snapPoint(new vec2(
				playleft + Math.random() * (playright - playleft), 
				playtop + Math.random() * (playbottom - playtop)));
		
		//adds a new coin at the randomized location
		var c = new coin(p);
		coins.push(c);
		
		//spawns the first enemy
		if(enemies.length <= 0){
			enemies.push(enemy.firstEnemy());
		}
		//spawns an enemy once every 6 coins
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
	
	/* member function update()
		updates the coin
	*/
	update(){
		//checks collision with the player
		if(this.pos.distance(p1.pos) <= tilesize)
			this.collect();
	}
	/* member function draw()
		renders the coin on screen
	*/
	draw(){
		// gets the points of the moving vertices based on the elapsed time
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
	/* function loadBlocks()
		loads the initial layout of the blocks when a round starts
	*/
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
	/* function startcoin()
		puts down the starting coin at the beginning of a round
	*/
	coins = [];
	var c = new coin(snapPoint(new vec2(width / 2, 100)));
	coins.push(c);
}

function updateCoins(){
	/* function updateCoins()
		updates the coins in the dynamic coin query
	*/
	for(var i = 0; i < coins.length; i++)
		coins[i].update();
}
function drawBlocks(){
	/* function drawBlocks
		draws the blocks in the dynamic block query
	*/
	for(var i = 0; i < blocks.length; i += 1)
		blocks[i].draw();
}
function drawCoins(){
	/* function drawCoins()
		renders the coins in the dynamic coin query
	*/
	for(var i = 0; i < coins.length; i++)
		coins[i].draw();
}