let canvas;
let canvas_wrapper;
let canvas_container;
let contextmenu;
let right_column;
let ctx;
let stageImage;
let objs;
let unit_names;
let layer_names;
let canvas_scale = 1;
let check_state = {
	'left-scroll': 0,
	'stage': 'shakeup',
	'tide': 'normal',
	'type': 'photo',
	'scale': '0.7',
	'help': false,
	'input-graph-area': false,
	'input-graph-node': false,
	'input-time': true
};
let spawners;
let spawner_dic;
let obj_dic;
let graph_node_dic;
let graph_area_dic;
let graph_nodes;
let graph_areas;
let start_node;
let goal_node;
let start_area;
let goal_area;
let start_pos;
let goal_pos;
let piece_count = 0;
let change_stage_count = 0;
const player_dic = {};
const canvas_dic = {};
const ctx_dic = {};
const layer_dic = {};
const key_state = {};

/** update_check_state()
 */
function update_check_state() {
	const elms = document.querySelectorAll('input[type=checkbox]');
	Array.prototype.forEach.call(elms, (elm) => {
		const id = elm.getAttribute('id');
		const checked = !!elm.checked;
		check_state[id] = checked;
	});
}

/** get_data(element)
 */
function get_data(element) {
	const data = {};
	const children = element.children;
	Array.prototype.forEach.call(children, (child, i) => {
		let name = child.getAttribute('Name');
		if (!name) {
			name = i;
			data.length = i + 1;
		}
		let value = child.getAttribute('StringValue');
		if (value) {
			const float = parseFloat(value);
			if (!isNaN(float)) {
				value = float;
			}
			data[name] = value;
		} else {
			data[name] = get_data(child);
		}
	});
	return data;
}

/** load_xml(stage, callback)
 */
function load_xml(stage, callback) {
	const req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if (req.readyState === 4) {
			if (req.status === 200) {
				const tide = check_state['tide'];
				const doc = req.responseXML.documentElement;
				const elms = doc.querySelectorAll('Root>C1>C0>C1');
				objs = [];
				graph_nodes = [];
				graph_areas = [];
				spawners = [];
				spawner_dic = {};
				obj_dic = {};
				graph_node_dic = {};
				graph_area_dic = {};
				unit_names = [];
				layer_names = [];
				Array.prototype.forEach.call(elms, (elm, i) => {
					const obj = get_data(elm);
					const unit = obj['UnitConfigName'];
					const layer = obj['LayerConfigName'];
					if (!unit_names.includes(unit)) {
						unit_names.push(unit);
					}
					if (!layer_names.includes(layer)) {
						layer_names.push(layer);
					}
					objs.push(obj);
					obj_dic[obj['Id']] = obj;
				});
				layer_names.sort();
				unit_names.sort();

				// ノードとエリア
				objs.forEach((obj) => {
					if (obj['UnitConfigName'].includes('CoopGraphNode')) {
						const graph_node = new GraphNode(obj);
						graph_node.is_sea_node = (graph_node.z < sea_z);
						graph_nodes.push(graph_node);
						obj.graph_node = graph_node;
						graph_node_dic[graph_node.id] = graph_node;
					} else if (obj['UnitConfigName'].includes('Obj_CoopGraphArea')) {
						const graph_area = new GraphArea(obj);
						graph_areas.push(graph_area);
						graph_area_dic[graph_area.id] = graph_area;
					} else if (obj['UnitConfigName'].includes('Obj_CoopSpawnPointZako')) {
						const a = obj['LayerConfigName'] === 'CoopWater_0' && tide === 'low';
						const b = obj['LayerConfigName'] === 'CoopWater_1' && tide === 'normal';
						const c = obj['LayerConfigName'] === 'CoopWater_2' && tide === 'high';
						if ((obj['LayerConfigName'] === 'CoopWater_0' && tide === 'low') ||
						    (obj['LayerConfigName'] === 'CoopWater_1' && tide === 'normal') ||
						    (obj['LayerConfigName'] === 'CoopWater_2' && tide === 'high')) {
							const spawner = new GraphNode(obj);
							spawner.is_spawner = true;
							spawners.push(spawner);
							spawner_dic[spawner.id] = spawners;
						}
					}
				});

				// ノードリンク
				objs.forEach((obj) => {
					if (obj['UnitConfigName'].includes('CoopGraphNode')) {
						const links = obj['Links'];
						if (links && Object.keys(links).length) {
							for (let key in links) {
								const len = links[key].length;
								for (let i = 0; i < len; i++) {
									const link = links[key][i];
									let target_node = null;
									const target_type = link['DefinitionName'];
									const target_id = link['DestUnitId'];
									for (let j = 0; j < graph_nodes.length; j++) {
										if (target_id === graph_nodes[j].id) {
											target_node = graph_nodes[j];
											break;
										}
									}
									if (target_node) {
										if (target_type === 'ToGraphNodeUnidirectionalDrop') {
											obj.graph_node.links.push(target_node);
											target_node.back_links.push(obj.graph_node);
										} else {
											obj.graph_node.links.push(target_node);
											target_node.links.push(obj.graph_node);
											obj.graph_node.back_links.push(target_node);
											target_node.back_links.push(obj.graph_node);
										}
									}
								}
							}
						}
					}
				});

				graph_nodes.forEach((node) => {
					if (!node.is_sea_node) {
						for (let i = 0; i < node.links.length; i++) {
							if (node.links[i].is_sea_node) {
								node.links[i].is_boundary_node = true;
							}
						}
					}
				});

				// 各ノードについて親エリアを特定する
				graph_nodes.forEach((node) => {
					const areas = [];
					graph_areas.forEach((area) => {
						if (area.includesNodeStrict(node)) {
							areas.push(area);
						}
					});
					if (areas.length) {
						areas.sort((a, b) => {
							return (a.front > b.front) ? 1 : -1;
						});
						const area = areas[0];
						//const area = areas[areas.length - 1];
						area.nodes.push(node);
						node.parent_area = area;
					}
				});

				const delete_targets = [];
				graph_areas.forEach((area) => {
					const len = area.nodes.length;
					if (len < 1) {
						delete_targets.push(area);
					}
				});
				delete_targets.forEach((area) => {
					const idx = graph_areas.indexOf(area);
					graph_areas.splice(idx, 1);
				});

				// 各ノードについて親エリアを特定する
				spawners.forEach((spawner) => {
					const areas = [];
					graph_areas.forEach((area) => {
						if (area.includesNode(spawner)) {
							areas.push(area);
						}
					});
					if (areas.length) {
						areas.sort((a, b) => {
							return (a.front > b.front) ? 1 : -1;
						});
						const area = areas[0];
						spawner.parent_area = area;
						let nearest_node;
						let min_distance = Infinity;
						area.nodes.forEach((node) => {
							const d = get_distance_2d(spawner, node);
							if (d < min_distance) {
								min_distance = d;
								nearest_node = node;
							}
						});
						spawner.links = [ nearest_node ];
						nearest_node.links.forEach((node) => {
							spawner.links.push(node);
						});
						spawner.links.forEach((node) => {
							node.spawner_links.push(spawner);
						});
					}
				});

				// ペナルティ
				if (stage === 'shakehouse') {
					if (graph_node_dic['obj6516']) graph_node_dic['obj6516'].penalty = 45;
				}
				if (stage === 'shakeride') {
					if (graph_node_dic['obj10501']) graph_node_dic['obj10501'].penalty = 1;
				}
				if (stage === 'shakelift') {
					if (graph_node_dic['obj8580']) graph_node_dic['obj8580'].snatcher_penalty = -240;
					if (graph_node_dic['obj9264']) graph_node_dic['obj9264'].snatcher_penalty = -10;
				}

				update_canvas();

				if (callback) callback();

				if (change_stage_count === 0) change_scale();

				change_stage_count++;
			}
		}
	};
	req.open('GET', './assets/xml/' + stage + '.xml');
	req.send(null);
}

/** get_obj(id)
 */
function get_obj(id) {
	for (let i = 0; i < objs.length; i++) {
		if (objs[i]['Id'] === id) {
			return objs[i];
		}
	}
	return null;
}

/** clear_canvas()
 */
function clear_canvas() {
	layer_dic.graph_node.innerHTML = '';
	layer_dic.graph_area.innerHTML = '';
	ctx_dic['stage'].clearAll();
	ctx_dic['node_link'].clearAll();
	ctx_dic['route'].clearAll();
}

/** update_canvas()
 */
function update_canvas() {
	update_check_state();
	clear_canvas();
	remvoe_all_piece();

	ctx_dic['stage'].drawImage(stageImage, 0, 0);

	graph_areas.forEach((area) => {
		const div = document.createElement('div');
		area.div = div;
		div.classList.add('graph-area');
		div.style.setProperty('left', area.x + 'px');
		div.style.setProperty('top', area.y + 'px');
		div.style.setProperty('width', area.width + 'px');
		div.style.setProperty('height', area.height + 'px');
		div.setAttribute('title', area.id);
		layer_dic.graph_area.appendChild(div);
		div.on('click', (e) => {
			console.log(area);
		});
	});

	graph_nodes.forEach((node) => {
		const div = document.createElement('div');
		node.div = div;
		div.classList.add('graph-node');
		div.style.setProperty('left', node.x + 'px');
		div.style.setProperty('top', node.y + 'px');
		div.setAttribute('title', node.id);

		if (node.is_sea_node) {
			div.classList.add('sea-node');
		}
		if (node.is_boundary_node) {
			div.classList.add('boundary-node');
		}
		layer_dic.graph_node.appendChild(div);
		div.on('click', (e) => {
			console.log(node);
		});
	});

	spawners.forEach((node) => {
		const div = document.createElement('div');
		node.div = div;
		div.classList.add('graph-node');
		div.classList.add('spawner');
		div.style.setProperty('left', node.x + 'px');
		div.style.setProperty('top', node.y + 'px');
		div.setAttribute('title', node.id);
		layer_dic.graph_node.appendChild(div);
		div.on('click', (e) => {
			console.log(node);
		});
	});

	ctx_dic['node_link'].clearAll();
	objs.forEach((obj) => {
		const unit = obj['UnitConfigName'];
		if (!unit.includes('CoopGraphNode')) {
			return;
		}
		const layer = obj['LayerConfigName'];
		const x1 = obj['Translate']['X'] + 1200;
		const y1 = obj['Translate']['Z'] + 1200;
		const links = obj['Links'];
		const ctx = ctx_dic['node_link'];
		if (links && Object.keys(links).length) {
			for (let key in links) {
				const len = links[key].length;
				for (let i = 0; i < len; i++) {
					const link = links[key][i];
					const target_type = link['DefinitionName'];
					const target_id = link['DestUnitId'];
					const target_obj = get_obj(target_id);
					if (target_obj) {
						const x2 = target_obj['Translate']['X'] + 1200;
						const y2 = target_obj['Translate']['Z'] + 1200;
						if (obj.graph_node.is_boundary_node || target_obj.graph_node.is_boundary_node) {
							const c1 = obj.graph_node.is_boundary_node ? COLOR_BOUNDARY_NODE :
							           obj.graph_node.is_sea_node ? COLOR_SEA_NDOE : COLOR_GROUND_NDOE;
							const c2 = target_obj.graph_node.is_boundary_node ? COLOR_BOUNDARY_NODE :
							           target_obj.graph_node.is_sea_node ? COLOR_SEA_NDOE : COLOR_GROUND_NDOE;
							const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
							gradient.addColorStop(0 , c1);
							gradient.addColorStop(1 , c2);
							ctx.strokeStyle = gradient;
						} else if (obj.graph_node.is_sea_node && target_obj.graph_node.is_sea_node) {
							ctx.strokeStyle = COLOR_SEA_NDOE;
						} else {
							ctx.strokeStyle = COLOR_GROUND_NDOE;
						}
						if (target_type === 'ToGraphNodeUnidirectionalDrop') {
							ctx.lineWidth = 4;
							ctx.setLineDash([4, 4, 14, 4]);
						} else {
							ctx.lineWidth = 1;
							ctx.setLineDash([]);
						}
						ctx.beginPath();
						ctx.moveTo(x1, y1);
						ctx.lineTo(x2, y2);
						ctx.stroke();
					}
				}
			};
			ctx.setLineDash([]);
		}
	});
	save_storage();
	//add_player();
	//add_egg();
	//add_enemy('steeleel');
	update_route();
}

/** save_storage()
 */
function save_storage() {
	const storage_item = { check_state };
	localStorage.setItem('shakerouter', JSON.stringify(storage_item));
}

/** clear_storage()
 */
function clear_storage() {
	localStorage.removeItem('shakerouter');
}

/** ask_clear_storage()
 */
function ask_clear_storage() {
	if (window.confirm(get_lang('confirm-clear-localstorage'))) {
		localStorage.removeItem('shakerouter');
		location.reload();
	}
}

/** select_stage(stage, tide, type)
 */
function select_stage(stage, tide, type) {
	loading.classList.remove('transparent');
	loading.classList.remove('hidden');
	const img = new Image();
	img.onload = () => {
		stageImage = img;
		ctx_dic['stage'].clearAll();
		ctx_dic['stage'].drawImage(stageImage, 0, 0);
		load_xml(stage, () => {
			loading.classList.add('transparent');
			setTimeout(() => {
				loading.classList.add('hidden');
				loading.classList.remove('transparent');
			}, 500);
		});
		save_storage();
	};
	img.src = `./assets/${type}/${stage}-${tide}.png`;
	sea_z = SEA_Z[`${stage}-${tide}`];
}

/** change_stage()
 */
function change_stage() {
	check_state['stage'] = get_elm('input[type=radio][name=stage]:checked').attr('value');
	check_state['tide'] = get_elm('input[type=radio][name=tide]:checked').attr('value');
	check_state['type'] = get_elm('input[type=radio][name=type]:checked').attr('value');
	select_stage(check_state['stage'], check_state['tide'], check_state['type']);
	save_storage();
}

/** change_type()
 */
function change_type() {
	check_state['type'] = get_elm('input[type=radio][name=type]:checked').attr('value');
	const img = new Image();
	img.onload = () => {
		stageImage = img;
		ctx_dic['stage'].clearAll();
		ctx_dic['stage'].drawImage(stageImage, 0, 0);
	};
	img.src = `./assets/${check_state['type']}/${check_state['stage']}-${check_state['tide']}.png`;
	save_storage();
}

/** change_scale()
 */
function change_scale(val) {
	let is_scroll = false;
	if (typeof val !== 'number') {
		const checked_element = document.querySelector('input[type=radio][name=scale]:checked');
		val = checked_element.attr('value');
		check_state['scale'] = val;
		is_scroll = true;
	}
	let scale = parseFloat(val);
	let w = parseInt(2400 * scale);
	const right = get_elm('#right');
	const rect = right.getBoundingClientRect();
	const wh = window.innerHeight;
	const ww = window.innerWidth - rect.left;
	const ws = Math.min(wh, ww);
	if (val === 'fit') {
		w = ws;
		scale = w / 2400;
	}
	canvas_scale = scale;
	canvas_container.style.setProperty('transform', `scale(${scale})`);
	canvas_wrapper.width(2400 * scale).height(2400 * scale);
	if (is_scroll) {
		right.scrollTop = Math.max(0, (w - wh)/2);
		right.scrollLeft = Math.max(0, (w - ww)/2);
	}
	save_storage();
}

/** onkeydown()
 */
window.onkeydown = (e) => {
	key_state[e.key] = true;
}

/** onkeyup()
 */
window.onkeyup = (e) => {
	key_state[e.key] = false;
	//Control Shift Alt
}

function get_elm(str) {
	return document.querySelector(str);
}
function get_elms(str) {
	return document.querySelectorAll(str);
}
function create_elm(tag_name, attr_dic, ...children) {
	const elm = document.createElement(tag_name);
	if (attr_dic) elm.attr(attr_dic);
	if (children.length) {
		children.forEach((child) => {
			if (typeof child === 'string') {
				elm.textContent = child;
			} else {
				elm.appendChild(child);
			}
		});
	}
	return elm;
}

/** remvoe_all_piece()
 */
function remvoe_all_piece() {
	const players = get_elms('.piece-player');
	const enemies = get_elms('.piece-enemy');
	const eggs = get_elms('.piece-egg');
	players.forEach((player) => {
		remove_player(player);
	});
	enemies.forEach((enemy) => {
		remove_enemy(enemy);
	});
	eggs.forEach((egg) => {
		remove_egg(egg);
	});
	piece_count = 0;
}

/** remove_player(squid)
 */
function remove_player(squid) {
	const enemies = get_elms('.piece-enemy');
	enemies.forEach((enemy) => {
		enemy.route_dic[squid.id] = null;
	});
	squid.is_removed = true;
	squid.remove();
}

/** add_player()
 */
function add_player(x = -1, y = -1) {
	if (x < 0 || y < 0) {
		const piece_pos_index = PIECE_POS_LIST.indexOf(piece_count % 25);
		x = 1200 + ((piece_pos_index % 5) - 2) * 100;
		y = 1200 + (Math.floor(piece_pos_index / 5) - 2) * 100;
	}
	const div = create_elm('div', {
		class: 'draggable-piece piece-player',
		style: `left: ${x}px; top: ${y}px; --image: url(./piece/player-1.png);`,
		piece: 'player'
	})
	.makeDraggable({
		drag_start: () => {
			contextmenu.hide();
			if (key_state['Alt']) {
				remove_player(div);
				update_route();
				return false;
			}
		},
		drag: () => {
			const enemies = get_elms('.piece-enemy');
			enemies.forEach((enemy) => {
				enemy.route_dic[div.id] = null;
			});
			set_timer_update_route();
		}
	})
	.makeContextmenu({
		ready: () => {
			contextmenu.innerHTML = `
			<ul>
				<label for="radio-layer-upper"><li><input type="radio" id="radio-layer-upper" name="radio-layer"><div>${get_lang('upper')}</div></li></label>
				<label for="radio-layer-lower"><li><input type="radio" id="radio-layer-lower" name="radio-layer"><div>${get_lang('lower')}</div></li></label>
				<hr>
				<li id="contextmenu-delete">${get_lang('delete')}</li>
			</ul>`;
			get_elm('#contextmenu-delete').on('click', (e) => {
				remove_player(div);
				update_route();
				contextmenu.hide();
			});
			if (div.use_upper_area) {
				get_elm('#radio-layer-upper').checked = true;
			} else {
				get_elm('#radio-layer-lower').checked = true;
			}
			get_elms('[name=radio-layer]').on('change', (e) => {
				const checked = get_elm('[name=radio-layer]:checked');
				const bool = (checked.id === 'radio-layer-upper');
				div.use_upper_area = bool;
				const [ parent_area, nearest_node ] = get_parent_area(div, bool);
				if (parent_area) {
					if (div.snap_target_node) {
						div.x = nearest_node.x;
						div.y = nearest_node.y;
						div.left(nearest_node.x);
						div.top(nearest_node.y);
						div.snap_target_node = nearest_node;
					}
					div.parent_area = parent_area;
					div.z = nearest_node.z;
				}
				const enemies = get_elms('.piece-enemy');
				enemies.forEach((enemy) => {
					enemy.route_dic[div.id] = null;
				});
				update_route();
			});
		}
	})
	.appendTo(layer_dic.piece);
	const [ parent_area, nearest_node ] = get_parent_area({ x, y }, true);
	if (parent_area) {
		div.parent_area = parent_area;
		div.z = nearest_node.z;
	}
	div.use_upper_area = true;
	div.x = x;
	div.y = y;
	div.id = 'player-' + piece_count;
	player_dic[div.id] = div;
	piece_count++;
	return div;
}

/** set_timer_update_route()
 */
let timer_update_route;
let last_time_update_route;
function set_timer_update_route() {
	if (timer_update_route) {
		return;
	}
	timer_update_route = setTimeout(() => {
		update_route();
		timer_update_route = null;
	}, 100);
}

/** update_route()
 */
function update_route() {
	const players = get_elms('.piece-player');
	const enemies = get_elms('.piece-enemy');
	// 各シャケについて各プレイヤーとの経路距離を計算する
	enemies.forEach((enemy) => {
		players.forEach((player) => {
			if (!enemy.route_dic[player.id]) {
				enemy.route_dic[player.id] = create_route(enemy, player);
			}
		});
	});
	// 各シャケについてターゲットを決定する
	enemies.forEach((enemy) => {
		if (enemy.enemy_key !== 'snatcher') {
			enemy.target = null;
			if (enemy.enemy_key === 'steelhead') {
				let min_distance = Infinity;
				let nearest_player_id = null;
				player_ids = Object.keys(enemy.route_dic);
				player_ids.forEach((player_id) => {	
					const d = get_distance_3d(player_dic[player_id], enemy);
					if (d < min_distance) {
						min_distance = d;
						nearest_player_id = player_id;
					}
				});
				if (nearest_player_id) {
					enemy.target = player_dic[nearest_player_id];
				}
			} else {
				let min_distance = Infinity;
				let nearest_player_id = null;
				player_ids = Object.keys(enemy.route_dic);
				player_ids.forEach((player_id) => {
					if (enemy.route_dic[player_id]) {
						const d = enemy.route_dic[player_id].distance_3d;
						if (d < min_distance) {
							min_distance = d;
							nearest_player_id = player_id;
						}
					}
				});
				if (nearest_player_id) {
					enemy.target = player_dic[nearest_player_id];
				}
			}
		}
	});
	const ctx = ctx_dic['route'];
	ctx.clearAll();
	enemies.forEach((enemy) => {
		enemy.querySelector('.fukidashi').hide();
		if (enemy.enemy_key !== 'snatcher') {
			const target = enemy.target;
			if (target) {
				const route = enemy.route_dic[target.id];
				if (route) {
					let time = route.distance_2d / enemy.speed / 60;
					if (enemy.enemy_key === 'griller') {
						let p1 = route.path[0];
						let before_angle = null;
						let before_angle_y = null;
						for (let i = 1; i < route.path.length; i++) {
							const p2 = route.path[i];
							const angle = ((get_vector_angle(p2, p1) * 180 / Math.PI) + 360) % 360;
							const angle_y = (get_vector_angle_y(p2, p1) * 180 / Math.PI);
							if (before_angle) {
								const dif_angle = Math.min(
									Math.abs(before_angle - angle),
									Math.abs((before_angle + 360) - angle),
									Math.abs(before_angle - (angle + 360))
								);
								const dif_angle_y = Math.abs(before_angle_y - angle_y);
								const rotate_time = Math.max(2.2 * (dif_angle / 360)) + 2/60;
								time += rotate_time;
							}
							before_angle = angle;
							before_angle_y = angle_y;
							p1 = p2;
						}
					}
					enemy.querySelector('.fukidashi').show().textContent = time.toFixed(1) + ' sec.';
					const path = route.path;
					ctx.lineWidth = 6;
					ctx.strokeStyle = '#ff00ac';
					ctx.beginPath();
					ctx.moveTo(path[0].x, path[0].y);
					for (let i = 1; i < path.length; i++) {
						ctx.lineTo(path[i].x, path[i].y);
					}
					ctx.stroke();
					/*
					for (let i = path.length - 2; i >= 0; i--) {
						const p1 = copy_vector(path[i + 0]);
						const p2 = copy_vector(path[i + 1]);
						const d = get_distance_2d(p1, goal_pos);
						if (d > 20) {
							const vec = create_vec(p1, p2);
							const vec_2 = get_added_vector(vec, 20);
							const arrow_pos = {
								x: p1.x - vec_2.x,
								y: p1.y - vec_2.y,
							};
							ctx.beginPath();
							ctx.arrowHead(arrow_pos, p1);
							ctx.fillStyle = '#ff00ac';
							ctx.fill();
							break;
						}
					}
					*/
					ctx.beginPath();
					ctx.arrowHead(path[path.length - 1], path[path.length - 2]);
					ctx.fillStyle = '#ff00ac';
					ctx.fill();
				}
			}
		} else {
			if (enemy.route_go && enemy.route_return) {
				const time_1 = 3.55;
				const time_2 = enemy.route_go.distance_2d / enemy.speed / 60;
				const time_3 = (enemy.egg.egg_count === 3) ? 12.66 : (enemy.egg.egg_count === 2) ? 8.4 : 4.21;
				const time_4 = enemy.route_return.distance_2d / enemy.speed / 60;
				const time = time_1 + time_2 + time_3 + time_4;
				const time_a = time_1 + time_2;
				const time_b = time_1 + time_2 + time_3;
				const time_c = time_1 + time_2 + time_3 + time_4;
				enemy.querySelector('.fukidashi').show().text(`${time_a.toFixed(1)} / ${time_b.toFixed(1)} / ${time_c.toFixed(1)} sec.`);

				let route, path;
				route = enemy.route_go;
				path = route.path;
				ctx.lineWidth = 6;
				ctx.strokeStyle = COLOR_GROUND_NDOE;
				ctx.beginPath();
				ctx.moveTo(path[0].x, path[0].y);
				for (let i = 1; i < path.length; i++) {
					ctx.lineTo(path[i].x, path[i].y);
				}
				ctx.stroke();

				ctx.globalCompositeOperation = 'screen';
				route = enemy.route_return;
				path = route.path;
				ctx.lineWidth = 6;
				ctx.strokeStyle = COLOR_SEA_NDOE;
				ctx.beginPath();
				ctx.moveTo(path[0].x, path[0].y);
				for (let i = 1; i < path.length - 1; i++) {
					ctx.lineTo(path[i].x, path[i].y);
				}
				ctx.stroke();
				for (let i = path.length - 2; i >= 0; i--) {
					const p1 = copy_vector(path[i + 0]);
					const p2 = copy_vector(path[i + 1]);
					const d = get_distance_2d(p1, goal_pos);
					if (d > 20) {
						const vec = create_vec(p1, p2);
						const vec_2 = get_added_vector(vec, 20);
						const pos = {
							x: p1.x - vec_2.x,
							y: p1.y - vec_2.y,
						};
						ctx.beginPath();
						ctx.moveTo(p1.x, p1.y);
						ctx.lineTo(pos.x, pos.y);
						ctx.stroke();
						ctx.globalCompositeOperation = 'source-over';
						ctx.beginPath();
						ctx.arrowHead(p2, pos);
						ctx.fillStyle = COLOR_SEA_NDOE;
						ctx.fill();
						break;
					}
				}
				ctx.globalCompositeOperation = 'source-over';
			}
		}
	});
}

/** remove_enemy(enemy)
 */
function remove_enemy(enemy) {
	enemy.is_removed = true;
	enemy.remove();
}

/** add_enemy()
 */
function add_enemy(enemy_key = 'chum', target_egg, x = -1, y = -1) {
	const enemy_data = ENEMY_DATA[enemy_key];
	if (x < 0 || y < 0) {
		const piece_pos_index = PIECE_POS_LIST.indexOf(piece_count % 25);
		x = 1200 + ((piece_pos_index % 5) - 2) * 100;
		y = 1200 + (Math.floor(piece_pos_index / 5) - 2) * 100;
	}
	const div = create_elm('div', {
		class: 'draggable-piece piece-enemy',
		style: `left: ${x}px; top: ${y}px; --image: url(./piece/enemy-${enemy_key}.png);`,
		piece: enemy_key
	}, create_elm('div', { class: 'fukidashi'}, ''));
	if (enemy_key !== 'snatcher') {
		div.makeDraggable({
			drag_start: () => {
				contextmenu.hide();
				if (key_state['Alt']) {
					remove_enemy(div);
					update_route();
					return false;
				}
			},
			drag: () => {
				div.route_dic = {};
				set_timer_update_route();
			}
		})
		.makeContextmenu({
			ready: () => {
				contextmenu.innerHTML = `
				<ul>
					<label for="radio-layer-upper"><li><input type="radio" id="radio-layer-upper" name="radio-layer"><div>${get_lang('upper')}</div></li></label>
					<label for="radio-layer-lower"><li><input type="radio" id="radio-layer-lower" name="radio-layer"><div>${get_lang('lower')}</div></li></label>
					<hr>
					<li id="contextmenu-delete">${get_lang('delete')}</li>
				</ul>`;
				get_elm('#contextmenu-delete').on('click', (e) => {
					remove_enemy(div);
					update_route();
					contextmenu.hide();
				});
				if (div.use_upper_area) {
					get_elm('#radio-layer-upper').checked = true;
				} else {
					get_elm('#radio-layer-lower').checked = true;
				}
				get_elms('[name=radio-layer]').on('change', (e) => {
					const checked = get_elm('[name=radio-layer]:checked');
					const bool = (checked.id === 'radio-layer-upper');
					div.use_upper_area = bool;
					const [ parent_area, nearest_node ] = get_parent_area(div, bool);
					if (parent_area) {
						if (div.snap_target_node) {
							div.x = nearest_node.x;
							div.y = nearest_node.y;
							div.left(nearest_node.x);
							div.top(nearest_node.y);
							div.snap_target_node = nearest_node;
						}
						div.parent_area = parent_area;
						div.z = nearest_node.z;
					}
					div.route_dic = {};
					update_route();
				});
			}
		});
	}
	div.appendTo(layer_dic.piece);
	const [ parent_area, nearest_node ] = get_parent_area({ x, y }, true);
	if (parent_area) {
		div.parent_area = parent_area;
		div.z = nearest_node.z;
	}
	div.enemy_key = enemy_key;
	div.use_upper_area = false;
	div.speed = enemy_data.speed;
	div.x = x;
	div.y = y;
	div.can_drop = enemy_data.can_drop;
	div.route_dic = {};
	if (target_egg) {
		div.target = target_egg;
	} else {
		div.target = get_elm('.piece-player');
	}
	piece_count++;
	return div;
}

/** remove_egg()
 */
function remove_egg(egg) {
	egg.snatcher.is_removed = true;
	egg.snatcher.remove();
	egg.is_removed = true;
	egg.remove();
}

/** add_egg()
 */
function add_egg(egg_count = 3, x = -1, y = -1) {
	if (x < 0 || y < 0) {
		const piece_pos_index = PIECE_POS_LIST.indexOf(piece_count % 25);
		x = 1200 + ((piece_pos_index % 5) - 2) * 100;
		y = 1200 + (Math.floor(piece_pos_index / 5) - 2) * 100;
	}
	const div = create_elm('div', {
		class: 'draggable-piece piece-egg',
		style: `left: ${x}px; top: ${y}px; --image: url(./piece/egg-${egg_count}.png);`,
		piece: 'egg'
	})
	const snatcher = add_enemy('snatcher', div);
	div.x = x;
	div.y = y;
	div.egg_count = egg_count;
	div.use_upper_area = true;
	div.snatcher = snatcher;
	snatcher.egg = div;
	div.makeDraggable({
		drag_start: () => {
			contextmenu.hide();
			if (key_state['Alt']) {
				remove_egg(div);
				update_route();
				return false;
			}
		},
		drag: () => {
			if (div.parent_area) {
				snatcher.route_go = create_route_snatcher_go(div);
				if (snatcher.route_go) {
					snatcher.left(snatcher.route_go.path[0].x).top(snatcher.route_go.path[0].y);
				}
				snatcher.route_return = create_route_snatcher_return(div);
			}
			set_timer_update_route();
		}
	})
	.makeContextmenu({
		ready: () => {
			contextmenu.innerHTML = `
			<ul>
				<label for="radio-layer-upper"><li><input type="radio" id="radio-layer-upper" name="radio-layer"><div>${get_lang('upper')}</div></li></label>
				<label for="radio-layer-lower"><li><input type="radio" id="radio-layer-lower" name="radio-layer"><div>${get_lang('lower')}</div></li></label>
				<hr>
				<label for="radio-egg-count-1"><li><input type="radio" id="radio-egg-count-1" name="radio-egg-count"><div>${get_lang('egg-1-s')}</div></li></label>
				<label for="radio-egg-count-2"><li><input type="radio" id="radio-egg-count-2" name="radio-egg-count"><div>${get_lang('egg-2-s')}</div></li></label>
				<label for="radio-egg-count-3"><li><input type="radio" id="radio-egg-count-3" name="radio-egg-count"><div>${get_lang('egg-3-s')}</div></li></label>
				<hr>
				<li id="contextmenu-delete">${get_lang('delete')}</li>
			</ul>`;
			get_elm('#contextmenu-delete').on('click', (e) => {
				remove_egg(div);
				update_route();
				contextmenu.hide();
			});
			get_elm('#radio-layer-' + (div.use_upper_area ? 'upper' : 'lower')).checked = true;
			get_elm('#radio-egg-count-' + div.egg_count).checked = true;
			get_elms('[name=radio-egg-count]').on('change', (e) => {
				const checked = get_elm('[name=radio-egg-count]:checked');
				const egg_count = parseInt(checked.id.replace('radio-egg-count-', ''));
				div.egg_count = egg_count;
				div.css('--image', `url(./piece/egg-${egg_count}.png)`);
				update_route();
			});
			get_elms('[name=radio-layer]').forEach((input) => {
				input.on('change', (e) => {
					const checked = get_elm('[name=radio-layer]:checked');
					const bool = (checked.id === 'radio-layer-upper');
					div.use_upper_area = bool;
					const [ parent_area, nearest_node ] = get_parent_area(div, bool);
					if (parent_area) {
						if (div.snap_target_node) {
							div.x = nearest_node.x;
							div.y = nearest_node.y;
							div.left(nearest_node.x);
							div.top(nearest_node.y);
							div.snap_target_node = nearest_node;
						}
						div.parent_area = parent_area;
						div.z = nearest_node.z;
					}
					div.route_dic = {};
					update_route();
				});
			});
		}
	})
	.appendTo(layer_dic.piece);
	const [ parent_area, nearest_node ] = get_parent_area(div, true);
	if (parent_area) {
		div.parent_area = parent_area;
		div.z = nearest_node.z;
		snatcher.route_go = create_route_snatcher_go(div);
		if (snatcher.route_go) {
			snatcher.left(snatcher.route_go.path[0].x).top(snatcher.route_go.path[0].y);
		}
		snatcher.route_return = create_route_snatcher_return(div);
		set_timer_update_route();
	}
	piece_count++;
	return div;
}

/** DOMContentLoaded
 */
window.addEventListener('DOMContentLoaded', () => {

	// タイトル
	document.title = get_lang('title');

	// 翻訳
	translate_all();

	// ヘルプ閉じ
	get_elm('#help').on('click', hide_help);
	get_elm('#help-content').on('click', (e) => {
		e.stopPropagation();
	});
	get_elm('#help-close').on('click', hide_help);

	// 左メニューのスクロールイベント
	get_elm('#left').on('scroll', function(e) {
		check_state['left-scroll'] = this.scrollTop;
		save_storage();
	});

	// ローディング処理
	loading = get_elm('#loading');

	// ローカルストレージのロード
	const storage_item = localStorage.getItem('shakerouter');
	if (storage_item) {
		Object.assign(check_state, JSON.parse(storage_item).check_state);
	}

	if (check_state['help']) {
		show_help();
	}

	// 左メニューのスクロール
	get_elm('#left').scrollTop = check_state['left-scroll'];

	// ラベルとインプットの関連付け
	get_elms('label').each((label) => {
		const input = label.querySelector('input[type=radio]');
		if (input) {
			const name = input.attr('name');
			const value = input.attr('value');
			const id = `input-${name}-${value}`;
			input.attr('id', id);
			label.attr('for', id);
		}
	});

	// ラジオインプットにチェック入れ
	get_elm(`input[type=radio][name=stage][value=${check_state['stage']}]`).checked = true;
	get_elm(`input[type=radio][name=tide][value=${check_state['tide']}]`).checked = true;
	get_elm(`input[type=radio][name=type][value=${check_state['type']}]`).checked = true;
	get_elm(`input[type=radio][name=scale][value="${check_state['scale']}"]`).checked = true;

	// DOM要素の取得
	right_column = get_elm('#right');
	canvas_wrapper = get_elm('#canvas-wrapper');
	canvas_container = get_elm('#canvas-container');
	layer_dic.graph_area = get_elm('#layer-graph-area');
	layer_dic.graph_node = get_elm('#layer-graph-node');
	layer_dic.piece = get_elm('#layer-piece');
	contextmenu = get_elm('#contextmenu');

	// キャンバスの設定
	canvas_dic['download'] = get_elm('#canvas-download');
	   ctx_dic['download'] = canvas_dic['download'].getContext('2d');
	canvas_dic['stage'] = get_elm('#canvas-stage');
	   ctx_dic['stage'] = canvas_dic['stage'].getContext('2d');
	canvas_dic['node_link'] = get_elm('#canvas-node-link');
	   ctx_dic['node_link'] = canvas_dic['node_link'].getContext('2d');
	canvas_dic['route'] = get_elm('#canvas-route');
	   ctx_dic['route'] = canvas_dic['route'].getContext('2d');
	canvas_dic['clip'] = get_elm('#canvas-clip');
	   ctx_dic['clip'] = canvas_dic['clip'].getContext('2d');

	// ステージのドラッグ
	const scroll_data = {};
	const right = get_elm('#right');
	canvas_container.on('mousedown', (e) => {
		if (e.button === 0) {
			scroll_data.is_down = true;
			scroll_data.start_x = e.pageX;
			scroll_data.start_y = e.pageY;
			scroll_data.start_scroll_left = right.scrollLeft;
			scroll_data.start_scroll_top = right.scrollTop;
		}
	});
	canvas_container.on('mousemove', (e) => {
		if (scroll_data.is_down) {
			const end_x = e.pageX;
			const end_y = e.pageY;
			const move_x = end_x - scroll_data.start_x;
			const move_y = end_y - scroll_data.start_y;
			right.scrollLeft = scroll_data.start_scroll_left - move_x;
			right.scrollTop = scroll_data.start_scroll_top - move_y;
		}
	});
	canvas_container.on('mouseup', (e) => {
		if (scroll_data.is_down) {
			scroll_data.is_down = false;
		}
	});
	canvas_container.on('wheel', (e) => {
		set_canvasxy(e);
		if (e.deltaY < 0) {
			canvas_scale = Math.min(3, canvas_scale + 0.1);
			change_scale(canvas_scale);
		} else {
			canvas_scale = Math.max(0.5, canvas_scale - 0.1);
			change_scale(canvas_scale);
		}
		const pagexy = get_pagexy_from_canvasxy(e.canvasX, e.canvasY);
		const scroll_x = pagexy.x - e.pageX;
		const scroll_y = pagexy.y - e.pageY;
		right.scrollLeft += scroll_x;
		right.scrollTop += scroll_y;
		e.preventDefault();
	}, false);

	// クリッピング
	const clip_data = {};
	canvas_dic['clip'].css('pointer-events', 'auto');
	canvas_dic['clip'].on('mousedown', (e) => {
		set_canvasxy(e);
		clip_data.start_x = e.canvasX;
		clip_data.start_y = e.canvasY;
		clip_data.is_down = true;
		e.stopPropagation();
	});
	canvas_dic['clip'].on('mousemove', (e) => {
		if (clip_data.is_down) {
			set_canvasxy(e);
			let start_x = clip_data.start_x;
			let start_y = clip_data.start_y;
			let end_x = e.canvasX;
			let end_y = e.canvasY;
			let left = Math.min(start_x, end_x);
			let right = Math.max(start_x, end_x);
			let top = Math.min(start_y, end_y);
			let bottom = Math.max(start_y, end_y);
			let width = right - left + 1;
			let height = bottom - top + 1;
			ctx_dic['clip'].clearAll();
			ctx_dic['clip'].fillStyle = 'rgba(0, 0, 0, 0.6)';
			ctx_dic['clip'].fillRect(0, 0, 2400, 2400);
			ctx_dic['clip'].clearRect(left, top, width, height);
			ctx_dic['clip'].strokeStyle = '#fff';
			ctx_dic['clip'].strokeRect(left - 1, top - 1, width + 2, height + 2);
			clip_data.left = left;
			clip_data.top = top;
			clip_data.width = width;
			clip_data.height = height;
		}
	});
	canvas_dic['clip'].on('mouseup', (e) => {
		if (clip_data.is_down) {
			clip_data.is_down = false;
			canvas_dic['clip'].classList.add('transparent');
			const text = get_elm('#right-fix-text');
			text.classList.add('transparent');
			setTimeout(() => {
				canvas_dic['clip'].hide();
				text.hide();
				canvas_dic['clip'].classList.remove('transparent');
				text.classList.remove('transparent');
			}, 500);
			download_image(
				clip_data.left,
				clip_data.top,
				clip_data.width,
				clip_data.height
			);
		}
	});

	// 右クリックの準備
	ready_contextmenu();

	// ドラッグの準備
	ready_draggable();

	// 右クリック
	canvas_container.makeContextmenu({
		ready: (e) => {
			const add_text = get_lang('add-some');
			contextmenu.innerHTML = `
			<ul>
				<li class="cmenu-add-player">${add_text.replace('{x}', get_lang('player'))}</li>
				<hr>
				<li class="cmenu-add-enemy" enemy_key="chum">${add_text.replace('{x}', get_lang('chum'))}</li>
				<li class="cmenu-add-enemy" enemy_key="scrapper">${add_text.replace('{x}', get_lang('scrapper'))}</li>
				<li class="cmenu-add-enemy" enemy_key="steeleel">${add_text.replace('{x}', get_lang('steeleel'))}</li>
				<li class="cmenu-add-enemy" enemy_key="steelhead">${add_text.replace('{x}', get_lang('steelhead'))}</li>
				<li class="cmenu-add-enemy" enemy_key="chum-rush">${add_text.replace('{x}', get_lang('chum-rush'))}</li>
				<li class="cmenu-add-enemy" enemy_key="goldie">${add_text.replace('{x}', get_lang('goldie'))}</li>
				<li class="cmenu-add-enemy" enemy_key="griller">${add_text.replace('{x}', get_lang('griller'))}</li>
				<hr>
				<li class="cmenu-add-egg" egg_count="1">${add_text.replace('{x}', get_lang('egg-1'))}</li>
				<li class="cmenu-add-egg" egg_count="2">${add_text.replace('{x}', get_lang('egg-2'))}</li>
				<li class="cmenu-add-egg" egg_count="3">${add_text.replace('{x}', get_lang('egg-3'))}</li>
				<hr>
				<li onclick="download_image();">${get_lang('save-image')}</li>
				<li onclick="download_image_clip();">${get_lang('save-clip-image')}</li>
				<li onclick="download_image_view();">${get_lang('save-view-image')}</li>
			</ul>`;
			get_elms('.cmenu-add-player').on('click', function() {
				add_player(e.canvasX, e.canvasY);
				update_route();
				contextmenu.hide();
			});
			get_elms('.cmenu-add-enemy').on('click', function() {
				const key = this.attr('enemy_key');
				add_enemy(key, null, e.canvasX, e.canvasY);
				update_route();
				contextmenu.hide();
			});
			get_elms('.cmenu-add-egg').on('click', function() {
				const num = parseInt(this.attr('egg_count'));
				add_egg(num, e.canvasX, e.canvasY);
				update_route();
				contextmenu.hide();
			});
		}
	});

	get_elm('#layer-graph-node').setVisible(check_state['input-graph-node']);
	get_elm('#canvas-node-link').setVisible(check_state['input-graph-node']);
	get_elm('#layer-graph-area').setVisible(check_state['input-graph-area']);

	// ノードリンク表示
	get_elm('#input-graph-node').checked = !!check_state['input-graph-node'];
	get_elm('#input-graph-node').onchange = function() {
		if (this.checked) {
			get_elm('#layer-graph-node').show();
			get_elm('#canvas-node-link').show();
		} else {
			get_elm('#layer-graph-node').hide();
			get_elm('#canvas-node-link').hide();
		}
		update_check_state();
		save_storage();
	};
	get_elm('#input-graph-area').checked = !!check_state['input-graph-area'];
	get_elm('#input-graph-area').onchange = function() {
		if (this.checked) {
			get_elm('#layer-graph-area').show();
		} else {
			get_elm('#layer-graph-area').hide();
		}
		update_check_state();
		save_storage();
	};
	get_elm('#input-time').checked = !!check_state['input-time'];
	get_elm('#input-time').onchange = function() {
		if (this.checked) {
			canvas_container.classList.remove('hide-time');
		} else {
			canvas_container.classList.add('hide-time');
		}
		save_storage();
	};
	if (check_state['input-time']) {
		canvas_container.classList.remove('hide-time');
	} else {
		canvas_container.classList.add('hide-time');
	}

	get_elms('[name=stage]').on('change', change_stage);
	get_elms('[name=tide]').on('change', change_stage);
	get_elms('[name=type]').on('change', change_type);
	get_elms('[name=scale]').on('change', change_scale);
	get_elms('.add-button').each((elm) => {
		const name = elm.attr('name');
		const value = elm.attr('lang_key');
		switch (name) {
		case 'player':
			elm.css('--image', 'url(./piece/player-1.png)');
			elm.on('click', () => {
				add_player();
				update_route();
			});
			break;
		case 'enemy':
			elm.css('--image', `url(./piece/enemy-${value}.png)`);
			elm.on('click', () => {
				add_enemy(value);
				update_route();
			});
			break;
		case 'egg':
			elm.css('--image', `url(./piece/${value}.png)`);
			elm.on('click', () => {
				add_egg(parseInt(value.replace('egg-', '')));
				update_route();
			});
			break;
		}
	});

	// 現在の拡大率とステージを適用
	change_scale();
	change_stage();

});

/** show_help()
 */
function show_help() {
	get_elm('#left').css('filter', 'blur(4px)');
	get_elm('#right').css('filter', 'blur(4px)');
	get_elm('#help').show();
	check_state['help'] = true;
	save_storage();
}
/** hide_help()
 */
function hide_help() {
	get_elm('#left').css('filter', 'initial');
	get_elm('#right').css('filter', 'initial');
	get_elm('#help').classList.add('transparent');
	setTimeout(() => {
		get_elm('#help').hide();
		get_elm('#help').classList.remove('transparent');
	}, 500);
	check_state['help'] = false;
	save_storage();
}

/** download_image_view()
 */
function download_image_view() {
	const wrapper = get_elm('#right');
	const rect = wrapper.getBoundingClientRect();
	const left = wrapper.scrollLeft / canvas_scale;
	const top = wrapper.scrollTop / canvas_scale;
	const width = Math.min(2400, rect.width / canvas_scale);
	const height = Math.min(2400, rect.height / canvas_scale);
	download_image(left, top, width, height);
}

/** download_image_clip()
 */
function download_image_clip() {
	ctx_dic['clip'].clearAll();
	ctx_dic['clip'].fillStyle = 'rgba(0, 0, 0, 0.6)';
	ctx_dic['clip'].fillRect(0, 0, 2400, 2400);
	canvas_dic['clip'].show();
	get_elm('#right-fix-text').show();
}

/** download_image(left, top, width, height)
 */
function download_image(left = 0, top = 0, width = 2400, height = 2400) {
	const canvas = canvas_dic['download'];
	const ctx = ctx_dic['download'];
	ctx.save();
	ctx.globalAlpha = 1;
	ctx.fillStyle = 'white';
	ctx.fillRect(0, 0, 2400, 2400);
	ctx.drawImage(canvas_dic['stage'], 0, 0);
	ctx.globalAlpha = 0.5;
	if (check_state['input-graph-area']) {
		const [canvas_area, ctx_area] = create_canvas(2400, 2400);
		get_elms('.graph-area').each((area) => {
			const x = area.left();
			const y = area.top();
			const w = area.width();
			const h = area.height();
			ctx_area.fillStyle = 'rgba(0, 120, 255, .1)';
			ctx_area.fillRect(x - w/2, y - h/2, w, h);
			ctx_area.strokeStyle = 'rgba(0, 120, 255, 1)';
			ctx_area.strokeRect(x - w/2, y - h/2, w, h);
		});
		ctx.drawImage(canvas_area, 0, 0);
	}
	if (check_state['input-graph-node']) {
		ctx.drawImage(canvas_dic['node_link'], 0, 0);
		const [canvas_node, ctx_node] = create_canvas(2400, 2400);
		ctx_node.globalAlpha = 0.5;
		get_elms('.graph-node').each((node) => {
			const x = node.left();
			const y = node.top();
			const color = node.classList.contains('boundary-node') ? COLOR_BOUNDARY_NODE :
			              node.classList.contains('sea-node') ? COLOR_SEA_NDOE :
			              node.classList.contains('spawner') ? COLOR_SPAWNER_NODE : COLOR_GROUND_NDOE;
			const r = node.classList.contains('boundary-node') ? 8 : node.classList.contains('spawner') ? 12 : 5;
			ctx_node.fillStyle = color;
			ctx_node.fillCircle(x, y, r);
		});
		ctx.globalAlpha = 1;
		ctx.drawImage(canvas_node, 0, 0);
	}
	ctx.globalAlpha = 1;
	ctx.drawImage(canvas_dic['route'], 0, 0);
	get_elms('.draggable-piece').each((piece) => {
		let img_id = piece.attr('piece');
		if (img_id === 'player') {
			img_id += '-1';
		} else if (img_id === 'egg') {
			img_id += '-' + piece.egg_count;
		}
		const img = get_elm('#img-' + img_id);
		const x = piece.left();
		const y = piece.top();

		if (check_state['input-time']) {
			const fuki = piece.querySelector('.fukidashi');
			if (fuki) {
				const str = fuki.text();
				ctx.textBaseline = 'bottom';
				ctx.textAlign = 'left';
				ctx.font = 'bold 24px sans-serif';
				const str_width = ctx.measureText(str).width;
				ctx.shadowColor = 'rgba(0, 0, 0, 0)';
				ctx.shadowOffsetX = 0;
				ctx.shadowOffsetY = 0;
				ctx.shadowBlur = 2;
				ctx.strokeStyle = 'black';
				ctx.lineWidth = 2;
				ctx.fillStyle = 'white';
				ctx.strokeText(str, x + 7 + 18, y - 2 - 28 - 18);
				ctx.shadowColor = 'black';
				ctx.fillText(str, x + 7 + 18, y - 2 - 28 - 18);

				ctx.strokeStyle = 'white';
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(x + 7, y - 28);
				ctx.lineTo(x + 7 + 18, y - 28 - 18);
				ctx.lineTo(x + 7 + 18 + str_width, y - 28 - 18);
				ctx.stroke();
				ctx.stroke();
			}
		}

		if (!img_id.includes('egg')) {
			ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
			ctx.shadowOffsetX = 3;
			ctx.shadowOffsetY = 3;
			ctx.shadowBlur = 0;
			ctx.fillStyle = 'red';
			ctx.fillCircle(x, y, 25);

			ctx.shadowColor = 'rgba(0, 0, 0, 0)';
			ctx.fillStyle = 'white';
			ctx.fillCircle(x, y, 22);
		}

		ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
		ctx.shadowOffsetX = 3;
		ctx.shadowOffsetY = 3;
		ctx.shadowBlur = 0;
		ctx.drawImage(img, x - 25, y - 25, 50, 50);

		ctx.shadowColor = 'rgba(0, 0, 0, 0)';
	});
	ctx.restore();
	const [canvas_dl, ctx_dl] = create_canvas(width, height);
	ctx_dl.drawImage(canvas, - left, - top);
	const date_str = get_date_str();
	const stage_str = get_lang('short-' + check_state['stage']);
	const tide_str = get_lang('short-' + check_state['tide'] + 'tide');
	const sep = (USER_LANG === 'ja') ? '' : '_';
	const filename = `${stage_str}${sep}${tide_str}_${date_str}`;
	canvas_dl.download(filename + '.png');
}

/** end
 */
