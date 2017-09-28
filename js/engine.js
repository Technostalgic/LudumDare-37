///
///	code by Isaiah Smith
///		
///	https://technostalgic.itch.io  
///	twitter @technostalgicGM
///

// prevents arrow key / space scrolling
window.addEventListener("keydown", function(e) {
    // space and arrow keys
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);

/* class vec2
	type used for storing and doing math with 2-dimensional vectors
*/
class vec2{
	/* constructor(x,y)
		initializes a vector at the specified location
		params:
			x:Number - the x coordinate of the vector
			y:Number - the y coordinate of the vector
	*/
	constructor(x = 0, y = x){
		this.x = x;
		this.y = y;
	}
	
	normalized(magnitude = 1){
		//returns a vector 2 with the same direction as this but
		//with a specified magnitude
		return this.multiply(magnitude / this.distance());
	}
	inverted(){
		//returns the opposite of this vector
		return this.multiply(-1);
	}
	multiply(factor){
		//returns this multiplied by a specified factor    
		return new vec2(this.x * factor, this.y * factor);
	}
	plus(vect2){
		//returns the result of this added to another specified vector2
		return new vec2(this.x + vect2.x, this.y + vect2.y);
	}
	minus(vect2){
		//returns the result of this subtracted to another specified vector2
		return this.plus(vect2.inverted());
	}
	equals(vect2, leniency = 0){
		//returns true if the difference between the two vectors is less than the specified leniency
		return (
			Math.abs(this.x - vect2.x) <= leniency) && (
			Math.abs(this.y - vect2.y) <= leniency);
	}
	
	direction(){
	//returns the angle this vector is pointing in radians
		return Math.atan2(this.y, this.x);
	}
	distance(vect2 = null){
	//returns the distance between this and a specified vec2
		if(vect2 === null)
			vect2 = new vec2();
		var d = Math.sqrt(
			Math.pow(this.x - vect2.x, 2) + 
			Math.pow(this.y - vect2.y, 2));
		return d;
	}
	
	static fromAng(angle, magnitude = 1){
		//returns a vector which points in the specified angle
		//and has the specified magnitude
		return new vec2(
			Math.cos(angle) * magnitude, 
			Math.sin(angle) * magnitude);
	}
	static up(){
		// vector that points up
		return new vec2(0, -1);
	}
	static down(){
		// vector that points down
		return new vec2(0, 1);
	}
	static left(){
		// vector that points left
		return new vec2(-1, 0);
	}
	static right(){
		// vector that points right
		return new vec2(1, 0);
	}
	
	toString(){
		// returns a readable string that represents the data in this vector
		return "vec2<" + this.x + "," + this.y + ">";
	}
	copy(){
		// returns a new instance clone of this vector
		return new vec2(this.x, this.y);
	}
}

/* class polygon
	type used for drawing shapes and doing 2d geometric math
*/
class polygon{
  constructor(){
    this.parent = null; //for user data reference
    this._points = [];
    this._position = new vec2();
    this._scale = 1;
    this._rotation = 0;
    this._absVerts = [];
    this._boundingbox = new box();
    this._rays = null;  //see 'ray.addPolygonRays(poly)'
    this._hflip = false;
  }
  
  getBoundingBox(){
    return this._boundingbox;
  }
  updateBoundingBox(){
    if(this._absVerts.length < 1)
      return new box(this._position.x, this._position.y);
    var l = this._absVerts[0].x;
    var r = this._absVerts[0].x;
    var t = this._absVerts[0].y;
    var b = this._absVerts[0].y;
    for(var i = 1; i < this._absVerts.length; i += 1){
      l = Math.min(l, this._absVerts[i].x);
      r = Math.max(r, this._absVerts[i].x);
      t = Math.min(t, this._absVerts[i].y);
      b = Math.max(b, this._absVerts[i].y);
    }
    this._boundingbox = new box(l, t, r-l, b-t);
  }
  getAbsoluteVertices(){
    return this._absVerts;
  }
  updateAbsVerts(){
    this._absVerts = [];
    for(var i = 0; i < this._points.length; i += 1){
      var v = this._points[i];

      if(this.getFlipped())
        v.x *= -1;
      
      var ang = v.direction();
      var mag = v.distance();
      v = vec2.fromAng(ang + this._rotation, mag);
      
      v = v.multiply(this._scale);
      v = v.plus(this._position);
      this._absVerts.push(v);
    }
    this._rays = null;  //reset so they have to be recalculated when next called for
    this.updateBoundingBox();
  }
  setVerts(vertices){
    this._points = vertices;
    this.updateAbsVerts();
  }
  getVerts(){
    return this._points;
  }
  
  move(translation){
    this._position = this._position.plus(translation);
    this.updateAbsVerts();
    return this;
  }
  getFlipped(){
    return this._hflip;
  }
  setFlipped(flipped = true){
    this._hflip = flipped;
    this.updateAbsVerts();
    this.updateBoundingBox();
  }
  setPosition(pos){
    this._position = pos;
    this.updateAbsVerts();
    return this;
  }
  getPosition(){
    return this._position;
  }
  setScale(scale){
    this._scale = scale;
    this.updateAbsVerts();
    return this;
  }
  getScale(){
    return this._scale;
  }
  setRotation(angle){
    this._rotation = angle;
    this.updateAbsVerts();
    return this;
  }
  getRotation(){
    return this._rotation;
  }
  getEdgeRays(){
    if(!this._rays)
      ray.addPolygonRays(this);
    return this._rays;
  }
  transform(translate, rotate = 0, scale = 1){
    //transforms the point data of the polygon
    for(var i = 0; i < this._points.length; i += 1){
      var v = this._points[i];
      
      var ang = v.direction();
      var mag = v.distance();
      v = vec2.fromAng(ang + rotate, mag);
      
      v = v.multiply(scale);
      v = v.plus(translate);
      this._points[i] = v;
    }
    this.updateAbsVerts();
  }
  worldPointToLocal(position){
    //transforms an absolute position to the same position in the scope of this polygon
    var v = position;
    
    v = v.minus(this.getPosition());
    v = v.multiply(1 / this.getScale())
    
    var ang = v.direction();
    var mag = v.distance();
    v = vec2.fromAng(ang - this.getRotation(), mag);
    
    return v;
  }
  
  drawOutline(ctx, color = "#888", thickness = 1){
    if(this._absVerts.length < 2)
      return;
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(this._absVerts[0].x, this._absVerts[0].y);
    for(var i = 0; i < this._absVerts.length; i += 1){
      var i2 = i + 1;
      if(i2 >= this._absVerts.length)
        i2 = 0;
      ctx.lineTo(this._absVerts[i2].x, this._absVerts[i2].y);
    }
    ctx.stroke();
  }
  drawFill(ctx, color = "#888"){
    if(this._absVerts.length < 3)
      return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(this._absVerts[0].x, this._absVerts[0].y);
    for(var i = 0; i < this._absVerts.length; i += 1){
      var i2 = i + 1;
      if(i2 >= this._absVerts.length)
        i2 = 0;
      ctx.lineTo(this._absVerts[i2].x, this._absVerts[i2].y);
    }
    ctx.fill();
  }
  
  static Rectangle(width, height = width){
    var p = new polygon();
    var verts = [
      new vec2(width / -2, height / -2),
      new vec2(width / -2, height / 2),
      new vec2(width / 2, height / 2),
      new vec2(width / 2, height / -2)
    ];
    p.setVerts(verts);
    return p;
  }
  static Circle(radius, segments = 12){
    var p = new polygon();
    var verts = [];
    for (var i = 0; i < segments; i += 1){
      var ang = (i / segments) * (Math.PI * 2);
      var vec = vec2.fromAng(ang, radius);
      verts.push(vec);
    }
    p.setVerts(verts);
    return p;
  }
  
  toString(){
    return "polygon: " + this._points.toString();
  }
}

/* class box
	Type used for doing axis aligned bouding box calculations
*/
class box{
  //axis aligned bounding box
  constructor(x = 0, y = 0, w = 0, h = 0){
    this.position = new vec2(x, y);
    this.size = new vec2(w, h);
  }
  
  top(){
    return this.position.y;
  }
  bottom(){
    return this.position.y + this.size.y;
  }
  left(){
    return this.position.x;
  }
  right(){
    return this.position.x + this.size.x;
  }
  
  centerAt(vect){
    this.position = vect.minus(this.size.multiply(.5));
    return this;
  }

  drawOutline(ctx, color = "#888", thickness = 2){
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.strokeRect(this.position.x, this.position.y, this.size.x, this.size.y);
  }
  drawFill(ctx, color = "#888"){
    ctx.fillStyle = color;
    ctx.fillRect(this.position.x, this.position.y, this.size.x, this.size.y);
  }
  
  containsPoint(point){
    return (
      point.x >= this.position.x &&
      point.x <= this.right() &&
      point.y >= this.position.y &&
      point.y <= this.bottom());
  }
  
  testIntersect(testray){
    if(this.containsPoint(testray.getPosition()))
      return true;
    if(testray._isVertical){
      var testy = testray._m > 0 ? this.position.y : this.bottom();
      return (
        testray._origin.x >= this.position.x &&
        testray._origin.x <= this.right() &&
        testy <= testray.length);
    }
    
    //test points on edges
    var x_t = testray.getEndPosition().x;
    var xmin = Math.min(testray._origin.x, x_t);  //for making sure the intersect
    var xmax = Math.max(testray._origin.x, x_t);  //is in range of the ray
    var yal = testray.getY(this.position.x); //y at left
    if(yal >= this.position.y && yal <= this.bottom())
      if(xmin <= this.position.x && this.position.x <= xmax)
        return true;
    var yar = testray.getY(this.right());
    if(yar >= this.position.y && yar <= this.bottom())
      if(xmin <= this.right() && this.right() <= xmax)
        return true;
    var xat = testray.getX(this.position.y); //x at top
    if(xat >= this.position.x && xat <= this.right())
      if(xmin <= xat && xat <= xmax)
        return true;
    var xab = testray.getX(this.bottom());
    if(xab >= this.position.x && xab <= this.right())
      return xmin <= xab && xab <= xmax;
    return false;
  }
  largestSideLength(){
    return Math.max(Math.abs(this.size.x), Math.abs(this.size.y));
  }
  closestEdge(point){
    var tl = new vec2(this.left(), this.top());
    var tr = new vec2(this.right(), this.top());
    var bl = new vec2(this.left(), this.bottom());
    var br = new vec2(this.right(), this.bottom());
    var tld = {d: point.distance(tl), id:"tl"};
    var trd = {d: point.distance(tr), id:"tr"};
    var bld = {d: point.distance(bl), id:"bl"};
    var brd = {d: point.distance(br), id:"br"};
    var vals = [tld, trd, bld, brd];
    vals.sort(function(a,b){return a.d - b.d});
    vals = [vals[0].id, vals[1].id];
    if(vals.includes('tl') && vals.includes('tr'))
      return 't';
    if(vals.includes('tl') && vals.includes('bl'))
      return 'l';
    if(vals.includes('tr') && vals.includes('br'))
      return 'r';
    if(vals.includes('br') && vals.includes('bl'))
      return 'b';
    return 'n';
  }
  static testOverlap(boxA, boxB){
    return !(
        boxB.left() >= boxA.right() ||
        boxB.right() <= boxA.left() ||
        boxB.top() > boxA.bottom() ||
        boxB.bottom() < boxA.top());
  }
  static intersection(boxA, boxB){
    var l = Math.max(boxA.left(), boxB.left());
    var r = Math.min(boxA.right(), boxB.right());
    var t = Math.max(boxA.top(), boxB.top());
    var b = Math.min(boxA.bottom(), boxB.bottom());
    return new box(l, t, r - l, b - t);
  }
  static fromPoints(pointA, pointB){
    var l = Math.min(pointA.x, pointB.x);
    var r = Math.max(pointA.x, pointB.x);
    var t = Math.min(pointA.y, pointB.y);
    var b = Math.max(pointA.y, pointB.y);
    return new box(l, t, r - l, b - t);
  }
  
  toString(){
    return "box<l:" + this.left() +
      " r:" + this.right() + 
      " t:" + this.top() + 
      " b:"  + this.bottom() + 
      ">";
  }
}

/* class ray
	type used for doing raycasting calculations
*/
class ray{
  constructor(pos = new vec2(), angle = 0, length = Infinity){
    this.length = length;
    //do not directly access _private _variables:
    this._parentPoly = null;
    this._origin = pos;
    this._m = 0;
    this._b = 0;
    this._isVertical = false;
    this._angle = 0;
    
    this.setAngle(angle);
    //would normally need to call this.recalculate but since it is
    //already called inside of this.setAngle, it would be redundant
  }
  
  getPosition(){
    return this._origin;
  }
  setPosition(pos){
    this._origin = pos;
    this.recalculate();
  }
  getEndPosition(){
    var mag = this.length;
    if(mag == Infinity)
      mag = 999999;
    return this._origin.plus(vec2.fromAng(this._angle).multiply(mag));
  }
  setEndPosition(pos){
    var mag = this._origin.distance(pos);
    var dir = pos.minus(this._origin).direction();
    this.length = mag;
    this._angle = dir;
    this.recalculate();
  }
  getAngle(){
    return this.angle;
  }
  setAngle(angle){
    //sets the angle that the ray points in
    //ensures that any given angle is wrapped between (-pi, pi]
    if(Math.abs(angle) > Math.PI)
      angle = angle % Math.PI * -1;
    if(angle == -Math.PI)
      angle = Math.PI;
    
    this._angle = angle;
    this.recalculate();
  }
  getSlope(){
    if(this._isVertical)
      return this._m * Infinity;
    return this._m;
  }
  getOffsetY(){
    if(this.isVertical)
      return this._m * -1 * Infinity;
    return this._b;
  }
  getY(x){
    //returns the y value that lies on the ray, given x
    if(this._isVertical){
      return x >= this.origin.x ? 
        this._m * Infinity : 
        this._m * -Infinity;
    }
    //the ray is stored as a simple formula in slope intercept form: 
    //y = m * x + b
    return this._m * x + this._b;
  }
  getX(y){
    //returns x of ray, given y
    if(this._m === 0)
      return this._origin.y;
    //x = (y-b)/m
    return (y - this._b) / this._m;
  }
  recalculate(){
    //recalculate the ray's slope intercept formula variables
    if(Math.abs(Math.abs(this._angle) - Math.PI / 2)
        <= 0.0000001){                    //if the angle is vertical,
      this._m = Math.sign(this._angle);   //_m stores the direcction that
      this._b = 0;                        //the ray is pointing in, while
      this._isVertical = true;            //_b is truncated
    }
    else{                                 //if the angle is not vertical
      this._m = Math.tan(this._angle);//convert the angle to a slope
      this._b = this._origin.y - (this._m * this._origin.x);  //and find 
      this._isVertical = false;           //the line's vertical offset
    }
  }
  
  intersection(otherRay){
    //returns the intesection point between this and specified
    //ray if there is one, otherwise returns null
    if(this._angle === otherRay._angle ||   //impossible collisions
        this.getPosition().distance(otherRay.getPosition()) > this.length + otherRay.length)
      return null;
    
    var intersect = new vec2();
    if(this._isVertical){
      if(otherRay._isVertical)
        return null;
      //calculate vertical intersection
      intersect.x = this._origin.x;
      intersect.y = otherRay.getY(intersect.x);
      
      //ugly conditional bullshit below to assure that the collision point lies on the ray:
      if(Math.sign(this._m) != Math.sign(intersect.y - this._origin.y))
        return null;
      if(!otherRay._isVertical){
        if(Math.sign(intersect.x - otherRay._origin.x) != (Math.abs(otherRay._angle) < Math.PI / 2 ? 1 : -1))
          return null;
      }
      else if(Math.sign(otherRay._m) != Math.sign(intersect.y - otherRay._origin.y))
          return null;
      if(intersect.distance(this._origin) > this.length)
        return null;
      if(intersect.distance(otherRay._origin) > otherRay.length)
        return null;
      
      //if it passes the tests, we have a collision! :D
      return intersect;
    }
    if(otherRay._isVertical)
      return otherRay.intersection(this);
    //calculate intersection
    intersect.x = (otherRay._b - this._b) / (this._m - otherRay._m);
    intersect.y = this._m * intersect.x + this._b;
    
    if(intersect.distance(this._origin) > this.length)
      return null;
    if(intersect.distance(otherRay._origin) > otherRay.length)
      return null;
    //just don't even ask. It's ugly. Basically this makes sure the intersection 
    //is in front of the ray instead of behind it: 
    if(Math.sign(intersect.x - this._origin.x) != (Math.abs(this._angle) < Math.PI / 2 ? 1 : -1))
      return null;
    if(Math.sign(intersect.x - otherRay._origin.x) != (Math.abs(otherRay._angle) < Math.PI / 2 ? 1 : -1))
      return null;
    
    //if it passes the tests, we have a collision! :D
    return intersect;
  }
  draw(ctx, color = "#f00", width = 1){
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(this.getPosition().x, this.getPosition().y);
    var end = this.getEndPosition();
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
  
  static rayData(m, b, length = Infinity){
    var r  = new ray();
    r._angle = null;
    r._m = m;
    r._b = b;
    r.length = length;
    r._origin = new vec2();
    return r;
  }
  static fromPoints(start, end){
    var ang = end.minus(start).direction();
    var length = end.distance(start);
    var r = new ray(start, ang, length);
    return r;
  }
}