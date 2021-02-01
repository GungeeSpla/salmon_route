/** GraphNode(obj)
 */
function GraphNode(obj) {
	this.id = obj['Id'];
	this.x = obj['Translate']['X'] + 1200;
	this.y = obj['Translate']['Z'] + 1200;
	this.z = obj['Translate']['Y'];
	this.is_link_spawner = false;
	this.is_spawner = false;
	this.is_sea_node = false;
	this.is_boundary_node = false;
	this.links = [];
	this.back_links = [];
	this.spawner_links = [];
	this.parent_area = null;
	return this;
}

/** GraphArea(obj)
 */
function GraphArea(obj) {
	this.id = obj['Id'];
	this.x = obj['Translate']['X'] + 1200;
	this.y = obj['Translate']['Z'] + 1200;
	this.z = obj['Translate']['Y'];
	this.width = 10 * obj['Scale']['X'];
	this.height = 10 * obj['Scale']['Z'];
	this.depth =  10 * obj['Scale']['Y'];
	this.top = this.y - this.height / 2;
	this.bottom = this.y + this.height / 2;
	this.left = this.x - this.width / 2;
	this.right = this.x + this.width / 2;
	this.back = this.z - this.depth / 2;
	this.front = this.z + this.depth / 2;
	this.penalty = 0;
	this.nodes = [];
	this.vertices = [
		{ x: this.left, y: this.top },
		{ x: this.right, y: this.top },
		{ x: this.right, y: this.bottom },
		{ x: this.left, y: this.bottom }
	];
	this.edges = [
		[ this.vertices[0], this.vertices[1] ],
		[ this.vertices[1], this.vertices[2] ],
		[ this.vertices[2], this.vertices[3] ],
		[ this.vertices[3], this.vertices[0] ]
	];
	return this;
}

/** GraphArea.includesNode(node)
 */
GraphArea.prototype.includesNode = function(node) {
	return (this.left <= node.x && node.x <= this.right && this.top <= node.y && node.y <= this.bottom);
}

/** GraphArea.includesNodeStrict(node)
 */
GraphArea.prototype.includesNodeStrict = function(node) {
	return (this.left <= node.x && node.x <= this.right && this.top <= node.y && node.y <= this.bottom && this.back <= node.z && node.z <= this.front);
}

/** NodeList.forEach(elm, i, arr)
 */
NodeList.prototype.forEach = Array.prototype.forEach;

/** NodeList.on()
 */
NodeList.prototype.on = function() {
	Array.prototype.forEach.call(this, (elm) => {
		HTMLElement.prototype.on.apply(elm, arguments);
	});
}

/** NodeList.each()
 */
NodeList.prototype.each = function(callback) {
	Array.prototype.forEach.call(this, (elm, i, arr) => {
		callback(elm, i, arr);
	});
}

/** HTMLElement.left(arg)
 */
HTMLElement.prototype.left = function(arg) {
	if (arg !== undefined) {
		this.style.setProperty('left', (typeof arg === 'number') ? arg + 'px' : arg);
	} else {
		return parseFloat(this.style.getPropertyValue('left'));
	}
	return this;
}

/** HTMLElement.top(arg)
 */
HTMLElement.prototype.top = function(arg) {
	if (arg !== undefined) {
		this.style.setProperty('top', (typeof arg === 'number') ? arg + 'px' : arg);
	} else {
		return parseFloat(this.style.getPropertyValue('top'));
	}
	return this;
}

/** HTMLElement.bottom(arg)
 */
HTMLElement.prototype.bottom = function(arg) {
	if (arg !== undefined) {
		this.style.setProperty('bottom', (typeof arg === 'number') ? arg + 'px' : arg);
	} else {
		return parseFloat(this.style.getPropertyValue('bottom'));
	}
	return this;
}

/** HTMLElement.right(arg)
 */
HTMLElement.prototype.right = function(arg) {
	if (arg !== undefined) {
		this.style.setProperty('right', (typeof arg === 'number') ? arg + 'px' : arg);
	} else {
		return parseFloat(this.style.getPropertyValue('right'));
	}
	return this;
}

/** HTMLElement.width(arg)
 */
HTMLElement.prototype.width = function(arg) {
	if (arg !== undefined) {
		this.style.setProperty('width', arg + 'px');
	} else {
		return parseFloat(this.style.getPropertyValue('width'));
	}
	return this;
}

/** HTMLElement.height(arg)
 */
HTMLElement.prototype.height = function(arg) {
	if (arg !== undefined) {
		this.style.setProperty('height', arg + 'px');
	} else {
		return parseFloat(this.style.getPropertyValue('height'));
	}
	return this;
}

/** HTMLElement.text(arg)
 */
HTMLElement.prototype.text = function(arg) {
	if (arg !== undefined) {
		this.textContent = arg;
	} else {
		return this.textContent;
	}
	return this;
}

/** HTMLElement.setVisible(bool)
 */
HTMLElement.prototype.setVisible = function(bool) {
	this.style.setProperty('display', (bool) ? 'block' : 'none');
	return this;
}

/** HTMLElement.show()
 */
HTMLElement.prototype.show = function() {
	this.style.setProperty('display', 'block');
	return this;
}

/** HTMLElement.hide()
 */
HTMLElement.prototype.hide = function() {
	this.style.setProperty('display', 'none');
	return this;
}

/** HTMLElement.on(arg1, arg2, arg3)
 */
HTMLElement.prototype.on = function(types, listener, passive = true, capture = false) {
	const type_arr = types.split(' ');
	type_arr.forEach((type) => {
		this.addEventListener(type, listener, { passive, capture });
	});
	return this;
}

/** HTMLElement.css(arg1, arg2)
 */
HTMLElement.prototype.css = function(arg1, arg2) {
	if (typeof arg1 === 'object') {
		for (let key in arg1) {
			this.style.setProperty(key, arg1[key]);
		}
	} else {
		if (arg2 !== undefined) {
			this.style.setProperty(arg1, arg2);
		} else {
			return this.style.getPropertyValue(arg1);
		}
	}
	return this;
}

/** HTMLElement.attr(arg1, arg2)
 */
HTMLElement.prototype.attr = function(arg1, arg2) {
	if (typeof arg1 === 'object') {
		for (let key in arg1) {
			this.setAttribute(key, arg1[key]);
		}
	} else {
		if (arg2 !== undefined) {
			this.setAttribute(arg1, arg2);
		} else {
			return this.getAttribute(arg1);
		}
	}
	return this;
}

/** HTMLElement.appendTo(elm)
 */
HTMLElement.prototype.appendTo = function(elm) {
	elm.appendChild(this);
	return this;
}

/** HTMLElement.makeDraggable(options)
 */
HTMLElement.prototype.makeDraggable = function(options = {}) {
	const body = document.body;
	const d = body.draggable_data;
	this.on('mousedown', (e) => {
		if (e.button === 0) {
			log_event_type(e, this);
			set_canvasxy(e);
			d.elm = this;
			d.start_mouse_x = e.canvasX;
			d.start_mouse_y = e.canvasY;
			d.start_elm_x = this.left();
			d.start_elm_y = this.top();
			d.options = options;
			this.snap_target_node = null;
			if (d.options.drag_start) {
				const ret = d.options.drag_start(e);
				if (ret === false) {
					d.elm = null;
				}
			}
			e.stopPropagation();
		}
	});
	return this;
}

/** HTMLElement.makeContextmenu(options)
 */
HTMLElement.prototype.makeContextmenu = function(options = {}) {
	const body = document.body;
	const show = (e) => {
		set_canvasxy(e);
		options.ready(e);
		contextmenu.left(-1000);
		contextmenu.top(-1000);
		contextmenu.show();
		contextmenu.attr('class', '');
		const rect = contextmenu.getBoundingClientRect();
		if (e.pageX + rect.width > window.innerWidth) {
			contextmenu.classList.add('left');
		}
		if (e.pageY + rect.height > window.innerHeight) {
			contextmenu.classList.add('top');
		}
		contextmenu.left(e.pageX);
		contextmenu.top(e.pageY);
		e.stopPropagation();
		return false;
	};
	let timer;
	this.on('mousedown', (e) => {
		timer = setTimeout(() => {
			if (!this.is_removed) {
				show(e);
			}
		}, 800);
	});
	this.on('mousemove', () => {
		clearTimeout(timer);
	});
	this.on('mouseup', () => {
		clearTimeout(timer);
	});
	this.oncontextmenu = show;
	return this;
}

/** HTMLElement.toSelectorStr()
 */
HTMLElement.prototype.toSelectorStr = function() {
	let tag_name = this.tagName.toLowerCase();
	const id = this.attr('id');
	const classnames = this.attr('class');
	if (id) {
		tag_name += '#' + id;
	}
	if (classnames) {
		const classname_arr = ('' + classnames).split(' ');
		classname_arr.forEach((classname) => {
			tag_name += `.${classname}`;
		});
	}
	return tag_name;
}

/** CanvasRenderingContext2D.arrowHead(p1, p2)
 */
CanvasRenderingContext2D.prototype.arrowHead = function(p1, p2) {
	const rad = get_vector_angle(p1, p2);
	this.beginPath();
	this.save();
	this.translate(p1.x, p1.y);
	this.rotate(rad);
	this.moveTo(0, 0);
	this.lineTo(-30, -10);
	this.lineTo(-30,  10);
	this.closePath();
	this.restore();
}

/** CanvasRenderingContext2D.clearAll()
 */
CanvasRenderingContext2D.prototype.clearAll = function() {
	this.clearRect(0, 0, 2400, 2400);
}

/** CanvasRenderingContext2D.fillCircle(x, y, r)
 */
CanvasRenderingContext2D.prototype.fillCircle = function(x, y, r) {
	this.beginPath();
	this.arc(x, y, r, 0, 2 * Math.PI, false);
	this.fill();
}

/** create_canvas(width, height)
 */
function create_canvas(width, height) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	ctx.canvas = canvas;
	return [canvas, ctx];
}

/** log_event_type(e)
 */
function log_event_type(e, elm) {
	return;
	const elm_str = (elm) ? ' on ' + elm.toSelectorStr() : '';
	console.log(
		`%c${e.type}${elm_str}`,
		'background: #eee; font-weight: bold; color: blue; padding: 0 6px 2px; font-style: italic; display: inline;',
	);
}

/** get_parent_area(pos) {
 */
function get_parent_area(pos, use_upper_area) {
	const areas = [];
	graph_areas.forEach((area) => {
		if (area.includesNode(pos)) {
			areas.push(area);
		}
	});
	if (!areas.length) {
		return [ null, null ];
	} else {
		areas.sort((a, b) => {
			return (a.z > b.z) ? 1 : -1;
		});
		const uppest_area = areas[areas.length - 1];
		const lowest_area = areas[0];
		const area = use_upper_area ? uppest_area : lowest_area;
		let min_distance = Infinity;
		let nearest_node;
		area.nodes.forEach((node) => {
			const d = get_distance_2d(node, pos);
			if (d < min_distance) {
				min_distance = d;
				nearest_node = node;
			}
		});
		return [ area, nearest_node ];
	}
}

/** ready_contextmenu()
 */
function ready_contextmenu() {
	contextmenu.on('mousedown', (e) => {
		e.stopPropagation();
	});
	contextmenu.on('click', (e) => {
		setTimeout(() => {
			contextmenu.hide()
		}, 300);
	});
	document.body.on('mousedown', () => {
		contextmenu.hide();
	});
	document.body.oncontextmenu = () => {
		return false;
	};
}

/** ready_draggable()
 */
function ready_draggable() {
	const body = document.body;
	const d = {};
	body.draggable_data = d;
	body.on('mousemove', (e) => {
		if (d.elm) {
			log_event_type(e, body);
			set_canvasxy(e);
			const elm = d.elm;
			elm.snap_target_node = null;
			elm.parent_area = null;
			const move_x = e.canvasX - d.start_mouse_x;
			const move_y = e.canvasY - d.start_mouse_y;
			let new_x = d.start_elm_x + move_x;
			let new_y = d.start_elm_y + move_y;
			// クリックした点を内包するエリアを取得する
			set_canvasxy(e);
			const pos = { x: new_x, y: new_y };
			if (key_state['Shift']) {
				let min_distance = Infinity;
				let nearest_spawner_node;
				spawners.forEach((spawner) => {
					const d = get_distance_2d(pos, spawner);
					if (d < min_distance) {
						min_distance = d;
						nearest_spawner_node = spawner;
					}
				});
				if (nearest_spawner_node) {
					new_x = nearest_spawner_node.x;
					new_y = nearest_spawner_node.y;
					pos.x = new_x;
					pos.y = new_y;
				}
			}
			const [ parent_area, nearest_node ] = get_parent_area(pos, elm.use_upper_area);
			if (parent_area) {
				if (key_state['Control']) {
					new_x = nearest_node.x;
					new_y = nearest_node.y;
					elm.snap_target_node = nearest_node;
				}
				elm.z = nearest_node.z;
				elm.parent_area = parent_area;
			}
			elm.x = new_x;
			elm.y = new_y;
			elm.left(new_x);
			elm.top(new_y);
			if (d.options.drag) {
				d.options.drag();
			}
		}
	});
	body.on('mouseup', (e) => {
		log_event_type(e, body);
		if (d.elm) {
			d.elm = null;
			if (d.options.drag_end) {
				d.options.drag_end();
			}
		}
	});
}

/** get_distance_2d(p1, p2)
 */
function get_distance_2d(p1, p2 = { x: 0, y: 0 }) {
	return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

/** get_distance_3d(p1, p2)
 */
function get_distance_3d(p1, p2 = { x: 0, y: 0 }) {
	return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2);
}

/** get_vector_angle(vec)
 */
function get_vector_angle(arg1, arg2) {
	let vec;
	if (arg2) {
		vec = {
			x:  arg1.x - arg2.x,
			y:  arg1.y - arg2.y
		};
	} else {
		vec = arg1;
	}
	const asin = Math.asin(vec.y / get_distance_2d(vec));
	if (vec.y >= 0) {
		if (vec.x > 0) {
			return asin;
		} else {
			return Math.PI - asin;
		}
	} else {
		if (vec.x > 0) {
			return Math.PI*2 - Math.abs(asin);
		} else {
			return Math.PI + Math.abs(asin);
		}
	}
}

/** get_rotated_vector(vec, rad)
 */
function get_rotated_vector(vec, rad) {
	const sin = Math.sin(rad);
	const cos = Math.cos(rad);
	return {
		x: - sin * vec.y + cos * vec.x,
		y: sin * vec.x + cos * vec.y
	};
}

/** get_added_vector(vec, add_len)
 */
function get_added_vector(vec, add_len) {
	const rad = get_vector_angle(vec);
	const sub_vec = get_rotated_vector(create_vec(add_len), rad);
	return {
		x: vec.x - sub_vec.x,
		y: vec.y - sub_vec.y	
	};
}

/** copy_vector(p)
 */
function copy_vector(p) {
	return {
		x: p.x,
		y: p.y
	};
}

/** add_vector(p1, p2)
 */
function add_vector(p1, p2) {
	return {
		x: p1.x + p2.x,
		y: p1.y + p2.y
	};
}

/** create_vec(p1, p2)
 */
function create_vec(p1, p2) {
	if (p2) {
		return {
			x:  p1.x - p2.x,
			y:  p1.y - p2.y
		};
	} else {
		return {
			x:  p1, y: 0
		};
	}
}


/** set_canvasxy(e)
 */
function set_canvasxy(e) {
	let x = e.pageX;
	let y = e.pageY;
	const rect = canvas_container.getBoundingClientRect();
	x = parseInt((x - rect.left) / canvas_scale);
	y = parseInt((y - rect.top) / canvas_scale);
	e.canvasX = x;
	e.canvasY = y;
}

/** create_route_node_to_node()
 */
function create_route_node_to_node() {
	if (!(start_node && goal_node)) {
		return;
	}
	graph_nodes.forEach((node) => {
		node.distance = Infinity;
		node.score = Infinity;
		node.from_node = null;
	});
	graph_areas.forEach((area) => {
		area.score = Infinity;
		area.near_node = null;
	});
	start_node.distance = 0;
	start_node.score = 0;
	const can_drop = false;
	explore_loop(start_node, null, can_drop, 0);

	let node_1 = goal_node;
	ctx.lineWidth = 10;
	ctx.strokeStyle = 'orange';
	ctx.beginPath();
	ctx.moveTo(node_1.x, node_1.y);
	for (let i = 0; i < graph_nodes.length; i++) {
		const node_2 = node_1.from_node;
		if (node_1 && node_2) {
			ctx.lineTo(node_2.x, node_2.y);
			if (node_2 === start_node) {
				break;
			}
		} else {
			break;
		}
		node_1 = node_2;
	}
	ctx.stroke();
}

/** check_cross_line_vs_area(line, area)
 */
function check_cross_line_vs_area(line, area) {
	let cross_ret;
	area.edges.forEach((edge) => {
		if (!cross_ret) {
			cross_ret = check_cross_line_vs_line(line[0], line[1], edge[0], edge[1]);
		}
	});
	return cross_ret;
}

/** check_cross_line_vs_line(L1, L2, L3, L4)
 */
function check_cross_line_vs_line(L1, L2, L3, L4) {
	const CrossP = {};
	const ksi = (L4.y - L3.y) * (L4.x - L1.x) - (L4.x - L3.x) * (L4.y - L1.y);
	const eta = (L2.x - L1.x) * (L4.y - L1.y) - (L2.y - L1.y) * (L4.x - L1.x);
	const delta = (L2.x - L1.x) * (L4.y - L3.y) - (L2.y - L1.y) * (L4.x - L3.x);
	const ramda = ksi / delta;
	const mu = eta / delta;
	if ((ramda >= 0 && ramda <= 1) && (mu >= 0 && mu <= 1)) {
		CrossP.x = L1.x + ramda * (L2.x - L1.x);
		CrossP.y = L1.y + ramda * (L2.y - L1.y);
		return CrossP;
	}
	return false;
}

/** create_route_snatcher_go(egg)
 */
function create_route_snatcher_go(egg) {
	graph_nodes.forEach((node) => {
		node.distance = Infinity;
		node.score = Infinity;
		node.from_node = null;
	});
	let start_node;
	if (egg.snap_target_node) {
		start_node = egg.snap_target_node;
		start_node.distance = 0;
		start_node.score = 0;
	} else {
		start_node = {
			is_temp: true,
			x: egg.x,
			y: egg.y,
			z: egg.z,
			distance: 0,
			score: 0,
			back_links: [],
			area: egg.parent_area
		};
		let nearest_node;
		let min_distance = Infinity;
		egg.parent_area.nodes.forEach((node) => {
			const d = get_distance_2d(egg, node);
			if (d < min_distance) {
				min_distance = d;
				nearest_node = node;
			}
		});
		nearest_node.back_links.forEach((target_node) => {
			if (target_node.parent_area === egg.parent_area) {
				start_node.back_links.push(target_node);
			} else {
				const line = [ nearest_node, target_node ];
				const cross_ret = check_cross_line_vs_area(line, egg.parent_area);
				if (cross_ret) {
					const cross_node = {
						is_temp: true,
						x: cross_ret.x,
						y: cross_ret.y,
						z: nearest_node.z,
						distance: Infinity,
						score: Infinity,
						from_node: null,
						back_links: [],
						area: egg.parent_area
					};
					start_node.back_links.push(cross_node);
					cross_node.back_links.push(start_node);
					cross_node.back_links.push(target_node);
				}
			}
		});
		if (!start_node.back_links.length) {
			return;
		}
	}
	explore_loop_snatcher_go.min_score = Infinity;
	explore_loop_snatcher_go.nearest_node = null;
	explore_loop_snatcher_go(start_node, null, 0);
	const near_node = explore_loop_snatcher_go.nearest_node;
	if (!near_node) {
		return;
	}
	const path = [ near_node ];
	let node_1 = near_node;
	for (let i = 0; i < graph_nodes.length; i++) {
		const node_2 = node_1.from_node;
		if (node_1 && node_2) {
			path.push(node_2);
			if (node_2 === start_node) {
				break;
			}
		} else {
			break;
		}
		node_1 = node_2;
	}
	let distance_2d = 0;
	let distance_3d = 0;
	for (let i = 1; i < path.length; i++) {
		const a = path[i - 1];
		const b = path[i - 0];
		const d = get_distance_2d(a, b);
		const e = get_distance_3d(a, b);
		distance_2d += d;
		distance_3d += e;
	}
	return { path, distance_2d, distance_3d };
}

/** create_route_snatcher_return(egg)
 */
function create_route_snatcher_return(egg) {
	graph_nodes.forEach((node) => {
		node.distance = Infinity;
		node.score = Infinity;
		node.from_node = null;
	});
	let start_node;
	let nearest_node;
	if (egg.snap_target_node) {
		start_node = egg.snap_target_node;
		start_node.distance = 0;
		start_node.score = 0;
	} else {
		let min_distance = Infinity;
		egg.parent_area.nodes.forEach((node) => {
			const d = get_distance_2d(egg, node);
			if (d < min_distance) {
				min_distance = d;
				nearest_node = node;
			}
		});
		start_node = nearest_node;
		start_node.distance = 0;
		start_node.score = 0;
	}
	explore_loop_snatcher_return.min_score = Infinity;
	explore_loop_snatcher_return.nearest_node = null;
	explore_loop_snatcher_return(start_node, null, 0);
	const near_node = explore_loop_snatcher_return.nearest_node;
	if (!near_node) {
		return;
	}
	const path = [ near_node ];
	let node_1 = near_node;
	for (let i = 0; i < graph_nodes.length; i++) {
		const node_2 = node_1.from_node;
		if (node_1 && node_2) {
			path.push(node_2);
			if (node_2 === start_node) {
				break;
			}
		} else {
			break;
		}
		node_1 = node_2;
	}
	path.reverse();
	if (!egg.snap_target_node) {
		nearest_node.links.forEach((target_node) => {
			if (target_node === path[1]) {
				const line = [ nearest_node, target_node ];
				const cross_ret = check_cross_line_vs_area(line, egg.parent_area);
				if (cross_ret) {
					const cross_node = {
						x: cross_ret.x,
						y: cross_ret.y,
						z: nearest_node.z
					};
					path[0] = cross_node;
				}
			}
		});
		path.unshift(egg);
	}
	let distance_2d = 0;
	let distance_3d = 0;
	for (let i = 1; i < path.length; i++) {
		const a = path[i - 1];
		const b = path[i - 0];
		const d = get_distance_2d(a, b);
		const e = get_distance_3d(a, b);
		distance_2d += d;
		distance_3d += e;
	}
	return { path, distance_2d, distance_3d };
}

/** create_route(start_pos, goal_pos)
 */
function create_route(start_pos, goal_pos) {
	const start_area = start_pos.parent_area;
	const goal_area = goal_pos.parent_area;
	if (!(start_area && goal_area && start_pos && goal_pos)) {
		return;
	}
	if (start_area === goal_area) {
		return {
			path: [ start_pos, goal_pos ],
			distance: get_distance_2d(start_pos, goal_pos)
		}
	}
	graph_nodes.forEach((node) => {
		node.distance = Infinity;
		node.score = Infinity;
		node.from_node = null;
	});
	graph_areas.forEach((area) => {
		area.score = Infinity;
		area.near_node = null;
	});
	// 仮想的なスタートノード
	let start_node;
	if (start_pos.snap_target_node) {
		start_node = start_pos.snap_target_node;
		start_node.distance = 0;
		start_node.score = 0;
	} else {
		start_node = {
			is_temp: true,
			x: start_pos.x,
			y: start_pos.y,
			z: start_pos.z,
			distance: 0,
			score: 0,
			links: [],
			area: start_pos.parent_area
		};
		let nearest_node;
		let min_distance = Infinity;
		start_area.nodes.forEach((node) => {
			const d = get_distance_2d(start_pos, node);
			if (d < min_distance) {
				min_distance = d;
				nearest_node = node;
			}
		});
		start_node.links.push(nearest_node);
		nearest_node.links.forEach((target_node) => {
			if (target_node.parent_area === start_area) {
				if (start_pos.can_drop || target_node.links.includes(nearest_node)) {
					start_node.links.push(target_node);
				}
			} else {
				const line = [ nearest_node, target_node ];
				const cross_ret = check_cross_line_vs_area(line, start_area);
				if (cross_ret) {
					const cross_node = {
						is_temp: true,
						x: cross_ret.x,
						y: cross_ret.y,
						z: nearest_node.z,
						distance: Infinity,
						score: Infinity,
						from_node: null,
						links: [],
						area: start_pos.parent_area
					};
					start_node.links.push(cross_node);
					cross_node.links.push(start_node);
					if (start_pos.can_drop || target_node.links.includes(nearest_node)) {
						cross_node.links.push(target_node);
					}
				}
			}
		});
		if (!start_node.links.length) {
			return;
		}
	}
	explore_loop(start_node, null, start_pos.can_drop, 0);
	const near_node = goal_area.near_node;
	if (!near_node) {
		return;
	}
	const path = [ near_node ];
	let node_1 = near_node;
	for (let i = 0; i < graph_nodes.length; i++) {
		const node_2 = node_1.from_node;
		if (node_1 && node_2) {
			path.push(node_2);
			if (node_2 === start_node) {
				break;
			}
		} else {
			break;
		}
		node_1 = node_2;
	}
	path.reverse();
	if (goal_pos.snap_target_node) {
		if (path[path.length - 1] !== goal_pos.snap_target_node) {
			path.push(goal_pos.snap_target_node);
		}
	} else {
		const last_line = [ path[path.length - 2], path[path.length - 1] ];
		if (path[path.length - 2].parent_area) {
			const cross_ret = check_cross_line_vs_area(last_line, path[path.length - 2].parent_area);
			if (!cross_ret) {
				return;
			}
			cross_ret.z = path[path.length - 1].z;
			path[path.length - 1] = cross_ret;
		}
		path.push(goal_pos);
	}
	let distance_2d = 0;
	let distance_3d = 0;
	for (let i = 1; i < path.length; i++) {
		const a = path[i - 1];
		const b = path[i - 0];
		const d = get_distance_2d(a, b);
		const e = get_distance_3d(a, b);
		distance_2d += d;
		distance_3d += e;
	}
	return { path, distance_2d, distance_3d };
}

/** explore_loop(node_a, node_z, can_drop, depth)
 */
function explore_loop(node_a, node_z, can_drop, depth) {
	// node_aとつながっているすべてのノード(node_b)について
	node_a.links.forEach((node_b) => {
		// そもそもnode_bからこのnode_aに来たのならば、node_bは無視
		if (node_b === node_z) {
			return;
		}
		// 段差を降りられない制限がある場合、node_bからnode_aに来れないなら、node_bは無視
		if (!node_a.is_temp && !can_drop && !node_b.links.includes(node_a)) {
			return;
		}
		// node_b到着時のスコアを計算
		const penalty = node_b.penalty || 0;
		const distance_ab = get_distance_3d(node_a, node_b) + penalty;
		const distance = node_a.distance + distance_ab;
		const score = node_a.score + distance_ab;
		const area = node_b.parent_area;
		if (area && score < area.score) {
			area.score = score;
			area.near_node = node_b;

		}
		// node_bのスコアを更新しているときに限り
		if (score < node_b.score) {
			// いまのところnode_bにはnode_aから来るのがもっとも近いらしい
			// 現在のスコアとnode_aから来たという印を付ける
			node_b.distance = distance;
			node_b.score = score;
			node_b.from_node = node_a;
			explore_loop(node_b, node_a, can_drop, depth + 1);
		}
	});
}

/** explore_loop_snatcher_go(node_a, node_z, depth)
 */
function explore_loop_snatcher_go(node_a, node_z, depth) {
	// node_aとつながっているすべてのノード(node_b)について
	if (node_a.spawner_links) {
		node_a.spawner_links.forEach((node_b) => {
			// node_b到着時のスコアを計算
			const penalty = node_b.penalty || 0;
			const distance_ab = get_distance_3d(node_a, node_b) + penalty;
			const distance = node_a.distance + distance_ab;
			const score = node_a.score + distance_ab;
			if (score < explore_loop_snatcher_go.min_score) {
				node_b.from_node = node_a;
				explore_loop_snatcher_go.min_score = score;
				explore_loop_snatcher_go.nearest_node = node_b;
			}
		});
	}
	node_a.back_links.forEach((node_b) => {
		// そもそもnode_bからこのnode_aに来たのならば、node_bは無視
		if (node_b === node_z) {
			return;
		}
		// 段差を降りられない制限がある場合、node_bからnode_aに来れないなら、node_bは無視
		if (!node_a.is_temp && !node_b.back_links.includes(node_a)) {
			return;
		}
		// node_b到着時のスコアを計算
		const penalty = node_b.penalty || 0;
		const distance_ab = get_distance_3d(node_a, node_b) + penalty;
		const distance = node_a.distance + distance_ab;
		const score = node_a.score + distance_ab;
		// node_bのスコアを更新しているときに限り
		if (score < node_b.score) {
			// いまのところnode_bにはnode_aから来るのがもっとも近いらしい
			// 現在のスコアとnode_aから来たという印を付ける
			node_b.distance = distance;
			node_b.score = score;
			node_b.from_node = node_a;
			if (score < explore_loop_snatcher_go.min_score) {
				explore_loop_snatcher_go(node_b, node_a, depth + 1);
			}
		}
	});
}

/** explore_loop_snatcher_return(node_a, node_z, depth)
 */
function explore_loop_snatcher_return(node_a, node_z, depth) {
	// node_aとつながっているすべてのノード(node_b)について
	node_a.links.forEach((node_b) => {
		// そもそもnode_bからこのnode_aに来たのならば、node_bは無視
		if (node_b === node_z) {
			return;
		}
		// node_b到着時のスコアを計算
		const penalty = (node_b.is_boundary_node && node_b.snatcher_penalty) || 0;
		const distance_ab = get_distance_3d(node_a, node_b) + penalty;
		const distance = node_a.distance + distance_ab;
		const score = node_a.score + distance_ab;
		// node_bのスコアを更新しているときに限り
		if (score < node_b.score) {
			// いまのところnode_bにはnode_aから来るのがもっとも近いらしい
			// 現在のスコアとnode_aから来たという印を付ける
			node_b.distance = distance;
			node_b.score = score;
			node_b.from_node = node_a;
			if (score < explore_loop_snatcher_return.min_score) {
				if (node_b.is_boundary_node) {
					explore_loop_snatcher_return.min_score = score;
					explore_loop_snatcher_return.nearest_node = node_b;
				} else if (!node_b.is_sea_node) {
					explore_loop_snatcher_return(node_b, node_a, depth + 1);
				}
			} else if (score - 240 < explore_loop_snatcher_return.min_score) {
				if (!node_b.is_sea_node) {
					explore_loop_snatcher_return(node_b, node_a, depth + 1);
				}
			}
		}
	});
}



/** get_date_str()
 */
function get_date_str() {
	const date = new Date();
	let Y = date.getFullYear();
	let M = date.getMonth() + 1;
	let D = date.getDate();
	let h = date.getHours();
	let m = date.getMinutes();
	let s = date.getSeconds();
	Y = '' + Y;
	M = ('00' + M).slice(-2);
	D = ('00' + D).slice(-2);
	h = ('00' + h).slice(-2);
	m = ('00' + m).slice(-2);
	s = ('00' + s).slice(-2);
	return `${Y}_${M}_${D}_${h}_${m}_${s}`;
}

/** HTMLCanvasElement.download(filename, type)
 * @see https://blog.katsubemakito.net/html5/canvas-download
 */
HTMLCanvasElement.prototype.download = function (filename = 'canvas', type = 'image/png') {
	const blob = this.getBlob(type);
	const data_uri = window.URL.createObjectURL(blob);
	const a = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
	a.href = data_uri;
	a.download = filename;
	const event = document.createEvent('MouseEvents');
	event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
	a.dispatchEvent(event);
}

/** HTMLCanvasElement.getBlob(type)
 */
HTMLCanvasElement.prototype.getBlob = function (type = 'image/png') {
	const base64 = this.toDataURL(type);
	const tmp = base64.split(',');
	const data = atob(tmp[1]);
	const mime = tmp[0].split(':')[1].split(';')[0];
	let buff = new Uint8Array(data.length);
	for (let i = 0; i < data.length; i++) {
		buff[i] = data.charCodeAt(i);
	}
	return new Blob([buff], { type: mime });
}
