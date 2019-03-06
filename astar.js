var index = 0;
var objects = {
	0: 'white',
	1: 'red',
	2: 'blue',
	3: 'pink',
}
 
class Tile {
	constructor(x, y) {
		this._x = x;
		this._y = y;
		this._tileId = 0;
		this._index = 0;
		this._walkable = false;
	}
	addIndex() { this._index = index++; }

	set walkable(v) { this._walkable = v; }

	set tileId(v) { this._tileId = v; }
	get tileId() { return this._tileId; }

	get x() { return this._x; }
	get y() { return this._y; }

	get id() { return this._index; }
}
 
class Draw {
	constructor(map) {
		this._canvas = document.getElementsByTagName('canvas')[0];
		this._ctx = this._canvas.getContext('2d');
		this.loadMap(map)
	}

	loadMap(map) {
		grid = [];
		for(var y = 0; y < map.length; y++) {
			for(var x = 0; x < map[y].length; x++) {
				if(grid[y] === undefined)
					grid[y] = [];

				grid[y][x] = new Tile(x, y);
				grid[y][x].walkable = (map[y][x] == 0);
				grid[y][x].tileId = map[y][x];
				grid[y][x].addIndex();
			}
		}
	}

	get canvas() { return this._canvas; }

	erasePath() {
		for(var y = 0; y < grid.length; y++) {
			for(var x = 0; x < grid[y].length; x++) {
				if(grid[y][x].tileId == 3)
					grid[y][x].tileId = 0;
			}
		}
	}

	loadPath(path) {
		if(path && path.walkable) {
			grid[path.y][path.x].tileId = 3;  
			this.loadPath(path.parent);
		}
	}

	loop() {
		this._ctx.clearRect(0,0,600,600);
		for(var y = 0; y < grid.length; y++) {
			for(var x = 0; x < grid[y].length; x++) {
				this._ctx.beginPath();
				this._ctx.rect(x * 32, y * 32, 32, 32);
				this._ctx.fillStyle = objects[grid[y][x].tileId];
				this._ctx.fill();          
				this._ctx.stroke();
			}
		}
		setTimeout(function(e) {
			e.loop();
		}, 100, this);
	}
}
 
class Node extends Tile {
	constructor(tile) {
		super();
		Object.assign(this, tile);
		this._parent = null;
		this._f = this._g = this._h = 0;
	}
 
 	get lastNode() {
 		let parent = this;
 		while(true) {
 			if(!parent.parent) break;
 			parent = parent.parent;
 		}
 		return parent;
 	}

	set walkable(v) { this._walkable = v; }
	get walkable() { return this._walkable; }

	get parent() { return this._parent; }
	set parent(v) { this._parent = v; }

	set f(v) { this._f = v; }
	get f() { return this._f; }

	set h(v) { this._h = v; }
	get h() { return this._h; }

	set g(v) { this._g = v; }
	get g() { return this._g; }
}

class AStar {
	constructor() {
		this.grid = [];
		for(var y = 0; y < map.length; y++) {
			for(var x = 0; x < map[y].length; x++) {
				if(this.grid[y] === undefined)
				this.grid[y] = [];

				this.grid[y][x] = new Node(grid[y][x]);
			}
		}
	}

	calculateHCost(startNode, endNode) {
		var diffX = Math.abs(startNode.x - endNode.x);
		var diffY = Math.abs(startNode.y - endNode.y);
		return (diffX + diffY) * 10;
	}
 
	getNeighbours(node) {
		var n = [];
		for(var y = -1; y <= 1; y++) {
			for(var x = -1; x <= 1; x++) {
				if(x == 0 && y == 0)
					continue;
				else if(this.grid[(node.y + y)] === undefined)
					continue;

				n.push(this.grid[(node.y + y)][(node.x + x)]);
			}
		}
		return n;
	}
 
	isOnList(list, id) {
		for(let [k, v] of Object.entries(list)) {
			if(v.id == id) return k;
		}
		return false;
	}
 
	getNodeByPos(x, y) {
		return this.grid[y][x];
	}
 
	getPathTo(startNode, endNode) {
		var currentNode;

		//Configuração dos nós.
		startNode.f = startNode.g = 0;
		startNode.h = this.calculateHCost(startNode, endNode);

		//Listas
		var openedList = [startNode];
		var closedList = [];

		while(openedList.length > 0) {
			//Escolher o menor F;
			var lowIndex = 0;
			for(var o = 0; o < openedList.length; o++) {
				if(openedList[o].f < openedList[lowIndex].f) {
					lowIndex = o;
				}
			}

			//Selecionar o menor nó como o nó atual;
			currentNode = openedList[lowIndex];
			if(currentNode.x == endNode.x && currentNode.y == endNode.y)
				break;

			//Adicionar a lista fechada o menor F;
			openedList.splice(lowIndex, 1);
			closedList.push(currentNode);

			var neighbours = this.getNeighbours(currentNode);
			for(var n = 0; n < neighbours.length; n++) {
				//Se não for andavel, ignorar.
				if(!neighbours[n] || !neighbours[n].walkable)
					continue;

				//Se estiver na lista fechada, ignorar.
				if(this.isOnList(closedList, neighbours[n].id))
					continue;

				//Andar na diagonal custar mais do que em linha reta.
				var movementCost = 10;
				if(Math.abs(neighbours[n].x - currentNode.x) >= 1 && Math.abs(neighbours[n].y - currentNode.y) >= 1)
					movementCost = 14;

				//Se estiver na lista aberta, então procurar.
				var listIterator = this.isOnList(openedList, neighbours[n].id);
				if(listIterator) {
					var bestGCost = currentNode.g + movementCost;
					if(bestGCost < neighbours[n].g) {
						neighbours[n].parent = currentNode;
						neighbours[n].g = bestGCost;
						neighbours[n].f = neighbours[n].g + neighbours[n].h;

						openedList[listIterator] = neighbours[n];
					}
				} else {
					neighbours[n].parent = currentNode;
					neighbours[n].g = currentNode.g + movementCost;
					neighbours[n].h = this.calculateHCost(neighbours[n], endNode);
					neighbours[n].f = neighbours[n].g + neighbours[n].h;

					openedList.push(neighbours[n]);
				}
			}
		}
		return currentNode;
	}
}