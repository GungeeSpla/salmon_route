// =========================================================
// lang.js
// =========================================================

/** get_queries(url)
 */
function get_queries(url) {
	const url_str = String(url || window.location);
	const query_str = url_str.slice(url_str.indexOf('?') + 1);
	const queries = {};
	if (!query_str) {
		return queries;
	}
	query_str.split('&').forEach((query_str) => {
		const query_arr = query_str.split('=');
		queries[query_arr[0]] = query_arr[1];
	});
	return queries;
}

/** get_lang(key)
 */
function get_lang(key) {
	return (LANG[ key ]) ? LANG[ key ][USER_LANG] : 'null';
}

function translate_all() {
	get_elms('[lang_key]').each((elm) => {
		const key = elm.attr('lang_key');
		const text = get_lang(key);
		elm.text(text);
	});
}

const USER_LANG = (get_queries().lang || navigator.language || navigator.userLanguage || 'ja').includes('ja') ? 'ja' : 'en';
const LANG = {};
const LANG_DEF = `
version|0.0.4
title|サーモンラン ルートマップ|Salmon Run Route Map
stage|ステージ|Stage
shakeup|シェケナダム|Spawning Grounds
shakeship|難破船ドン･ブラコ|Marooner's Bay
shakehouse|海上集落シャケト場|Lost Outpost
shakelift|トキシラズいぶし工房|Salmonid Smokeyard
shakeride|朽ちた箱舟 ポラリス|Ruins of Ark Polaris
tide|潮位|Tide
lowtide|干潮|Low Tide
normaltide|通常潮|Normal Tide
hightide|満潮|High Tide
type|タイプ|Type
plan|平面図|Floor Plan
photo|リアル|Screenshot
scale|拡大率|Scale
fit|画面にフィット|Fit to Screen
layer|レイヤー|Layer
layer-node|ノード|Node
layer-mesh|メッシュ|Mesh
layer-time|時間|Time
add|追加|Add
player|プレイヤー|Player
chum|シャケ|Chum
chum-rush|シャケ(MAXラッシュ)|Chum (HLM Rush)
snatcher|タマヒロイ|Snatcher
goldie|キンシャケ(霧)|Goldie (Fog)
griller|グリル(MAX)|Griller (HLM)
scrapper|テッパン|Scrapper
steeleel|ヘビ|Steel Eel
steelhead|バクダン|Steelhead
egg-1|金イクラ(1個)|1 Golden Egg
egg-2|金イクラ(2個)|2 Golden Eggs
egg-3|金イクラ(3個)|3 Golden Eggs
egg-1-s|1個|1 Egg
egg-2-s|2個|2 Eggs
egg-3-s|3個|3 Eggs
delete|削除|Remove
upper|上の階層に配置|Place on upper floors
lower|下の階層に配置|Place on lower floors
add-some|{x}を追加|Add {x}|
other|その他|Others
clear-localstorage|ローカルストレージをクリア|Clear Local Storage
confirm-clear-localstorage|このページで使用しているローカルストレージを削除してから、このページを再読み込みします。よろしいですか？|Delete the local storage used by this page, and then reload this page. Are you sure?
select-range|保存する範囲を選択してください。|Select the range to save.
save-image|全体の画像を保存|Save Image|
save-clip-image|画像を切り取って保存|Save Clipped Image
save-view-image|現在見えている範囲を保存|Save Current View Image|
help|ヘルプ|Help
close|閉じる|Close
short-shakeup|ダム|Grounds
short-shakeship|ドンブラコ|Bay
short-shakehouse|シャケト場|Outpost
short-shakelift|トキシラズ|Yard
short-shakeride|ポラリス|Ark
short-lowtide|干潮|LT
short-normaltide|通常|NT
short-hightide|満潮|HT
`;
{
	const lines = LANG_DEF.split('\n');
	lines.forEach((line) => {
		if (!line) {
			return;
		}
		const values = line.split('|');
		const ja = values[1].trim();
		const en = values[2] ? values[2].trim() : ja;
		LANG[values[0].trim()] = { ja, en };
	});
}
