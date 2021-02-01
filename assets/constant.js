const PIECE_POS_LIST = [
	20, 21, 22, 23, 24,
	19, 06, 07, 08, 09,
	18, 05, 00, 01, 10,
	17, 04, 03, 02, 11,
	16, 15, 14, 13, 12
];
const ENEMY_DATA = {
	'chum': {
		speed: 0.72,
		can_drop: true
	},
	'chum-rush': {
		speed: 2.31,
		can_drop: true
	},
	'snatcher': {
		speed: 1.04,
		can_drop: true
	},
	'goldie': {
		speed: 0.55,
		can_drop: true
	},
	'griller': {
		speed: 1.95,
		can_drop: false
	},
	'scrapper': {
		speed: 1.14,
		can_drop: true
	},
	'steeleel': {
		speed: 0.94,
		can_drop: false
	},
	'steelhead': {
		speed: 0.65,
		can_drop: true
	}
};
let sea_z;
const SEA_Z = {
	'shakeup-high': 151,
	'shakeup-normal': 90,
	'shakeup-low': 64,
	'shakeship-high': 123,
	'shakeship-normal': 89,
	'shakeship-low': 65,
	'shakehouse-high': 138,
	'shakehouse-normal': 112,
	'shakehouse-low': 61,
	'shakelift-high': 116,
	'shakelift-normal': 75,
	'shakelift-low': 36,
	'shakeride-high': 217,
	'shakeride-normal': 98,
	'shakeride-low': 68,
};
const COLOR_GROUND_NDOE = '#ff00ac';
const COLOR_SEA_NDOE = '#00acff';
const COLOR_BOUNDARY_NODE = '#9945cd';
const COLOR_SPAWNER_NODE = '#3ccf00';
