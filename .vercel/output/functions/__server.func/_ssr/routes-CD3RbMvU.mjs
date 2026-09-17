import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as Compass, S as Ellipsis, T as Bomb, _ as Info, a as Trophy, b as Gift, c as Star, d as RotateCcw, f as RefreshCw, g as Lock, h as MapPin, i as Vibrate, l as Snowflake, m as Map$1, n as VolumeX, p as Paintbrush, r as Volume2, s as Store, t as X, u as Settings, v as House, w as CalendarDays, x as Gem, y as Hammer } from "../_libs/lucide-react.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CD3RbMvU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ADVENTURE = [
	{
		id: 1,
		name: "Shore",
		blurb: "Score 400 to leave the beach.",
		goal: {
			type: "score",
			value: 400
		},
		stones: 0,
		reward: {
			coins: 40,
			gems: 4
		}
	},
	{
		id: 2,
		name: "Palms",
		blurb: "Clear 6 lines under the palms.",
		goal: {
			type: "lines",
			value: 6
		},
		stones: 0,
		reward: {
			coins: 50,
			gems: 5
		}
	},
	{
		id: 3,
		name: "Cove",
		blurb: "Reach a x3 combo in the cove.",
		goal: {
			type: "combo",
			value: 3
		},
		stones: 2,
		reward: {
			coins: 60,
			gems: 6
		}
	},
	{
		id: 4,
		name: "Falls",
		blurb: "Score 900 beside the waterfall.",
		goal: {
			type: "score",
			value: 900
		},
		stones: 2,
		reward: {
			coins: 70,
			gems: 6
		}
	},
	{
		id: 5,
		name: "Lanterns",
		blurb: "Clear 10 lines by lantern light.",
		goal: {
			type: "lines",
			value: 10
		},
		stones: 3,
		reward: {
			coins: 80,
			gems: 8
		}
	},
	{
		id: 6,
		name: "Cliff",
		blurb: "Hold a x4 combo on the cliff.",
		goal: {
			type: "combo",
			value: 4
		},
		stones: 3,
		reward: {
			coins: 90,
			gems: 8
		}
	},
	{
		id: 7,
		name: "Ruins",
		blurb: "Score 1,400 among cracked ruins.",
		goal: {
			type: "score",
			value: 1400
		},
		stones: 4,
		reward: {
			coins: 100,
			gems: 10
		}
	},
	{
		id: 8,
		name: "Lagoon",
		blurb: "Clear 14 lines across the lagoon.",
		goal: {
			type: "lines",
			value: 14
		},
		stones: 4,
		reward: {
			coins: 110,
			gems: 10
		}
	},
	{
		id: 9,
		name: "Temple",
		blurb: "Reach a x5 combo at the temple.",
		goal: {
			type: "combo",
			value: 5
		},
		stones: 5,
		reward: {
			coins: 130,
			gems: 12
		}
	},
	{
		id: 10,
		name: "Summit",
		blurb: "Score 2,200 on the summit.",
		goal: {
			type: "score",
			value: 2200
		},
		stones: 6,
		reward: {
			coins: 160,
			gems: 16
		}
	}
];
var CHALLENGES = [
	{
		id: "tide",
		name: "Tide lines",
		blurb: "Clear 8 lines before you stall.",
		goal: {
			type: "lines",
			value: 8
		},
		reward: {
			coins: 80,
			gems: 6
		}
	},
	{
		id: "summit",
		name: "Harbor score",
		blurb: "Score 800 in a single run.",
		goal: {
			type: "score",
			value: 800
		},
		reward: {
			coins: 90,
			gems: 6
		}
	},
	{
		id: "streak",
		name: "Lantern combo",
		blurb: "String a x3 combo.",
		goal: {
			type: "combo",
			value: 3
		},
		reward: {
			coins: 70,
			gems: 5
		}
	}
];
var SHOP_ITEMS = [
	{
		id: "hammer",
		name: "Hammer",
		blurb: "Smash one block.",
		power: "hammer",
		amount: 1,
		coins: 90
	},
	{
		id: "refresh",
		name: "Reroll",
		blurb: "New set of three blocks.",
		power: "refresh",
		amount: 1,
		coins: 70
	},
	{
		id: "bomb",
		name: "Bomb",
		blurb: "Clear a 3×3 blast.",
		power: "bomb",
		amount: 1,
		coins: 140
	},
	{
		id: "freeze",
		name: "Frost",
		blurb: "Combo shield for two drops.",
		power: "freeze",
		amount: 1,
		coins: 110
	},
	{
		id: "pack",
		name: "Power pack",
		blurb: "+2 of every tool.",
		amount: 2,
		gems: 90
	},
	{
		id: "coins",
		name: "Coin pouch",
		blurb: "+400 coins.",
		amount: 400,
		gems: 40
	}
];
var QUESTS = [
	{
		id: "lines",
		title: "Line cook",
		blurb: "Clear 12 lines today.",
		target: 12,
		coins: 50,
		gems: 4
	},
	{
		id: "score",
		title: "High roller",
		blurb: "Score 1,000 in a single run.",
		target: 1e3,
		coins: 50,
		gems: 4
	},
	{
		id: "combo",
		title: "On a streak",
		blurb: "Reach a x3 combo.",
		target: 3,
		coins: 40,
		gems: 3
	},
	{
		id: "powers",
		title: "Tool time",
		blurb: "Use 3 power-ups.",
		target: 3,
		coins: 30,
		gems: 2
	}
];
var SKINS = [
	{
		id: "classic",
		name: "Island gloss",
		blurb: "The original candy blocks."
	},
	{
		id: "ocean",
		name: "Tide glass",
		blurb: "Cooler sea-glass sheen."
	},
	{
		id: "sunset",
		name: "Dusk fire",
		blurb: "Warm lantern tones."
	},
	{
		id: "midnight",
		name: "Night market",
		blurb: "Deep neon after dark."
	}
];
function xpForLevel(level) {
	return 700 + level * 220;
}
function goalLabel(goal) {
	if (goal.type === "score") return `Score ${goal.value.toLocaleString("en-US")}`;
	if (goal.type === "lines") return `Clear ${goal.value} lines`;
	return `Reach a x${goal.value} combo`;
}
var bus = null;
var musicTimer = null;
var unlocked = false;
function ensure() {
	if (typeof window === "undefined") return null;
	if (bus) return bus;
	const AudioCtx = window.AudioContext || window.webkitAudioContext;
	if (!AudioCtx) return null;
	const ctx = new AudioCtx({ latencyHint: "interactive" });
	const master = ctx.createGain();
	const sfx = ctx.createGain();
	const music = ctx.createGain();
	sfx.gain.value = .7;
	music.gain.value = .18;
	master.gain.value = .85;
	sfx.connect(master);
	music.connect(master);
	master.connect(ctx.destination);
	bus = {
		ctx,
		master,
		sfx,
		music
	};
	return bus;
}
function unlockAudio() {
	const b = ensure();
	if (!b) return;
	if (b.ctx.state === "suspended") b.ctx.resume();
	unlocked = true;
}
function setMuted(sfxOn, musicOn) {
	const b = ensure();
	if (!b) return;
	b.sfx.gain.setTargetAtTime(sfxOn ? .7 : 0, b.ctx.currentTime, .04);
	b.music.gain.setTargetAtTime(musicOn ? .18 : 0, b.ctx.currentTime, .08);
	if (musicOn) startMusic();
	else stopMusic();
}
function tone(freq, dur, type, gain, dest, when = 0, slide) {
	const b = bus;
	if (!b || !unlocked) return;
	const t0 = b.ctx.currentTime + when;
	const osc = b.ctx.createOscillator();
	const g = b.ctx.createGain();
	osc.type = type;
	osc.frequency.setValueAtTime(freq, t0);
	if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t0 + dur);
	g.gain.setValueAtTime(1e-4, t0);
	g.gain.exponentialRampToValueAtTime(gain, t0 + .012);
	g.gain.exponentialRampToValueAtTime(1e-4, t0 + dur);
	osc.connect(g);
	g.connect(dest);
	osc.start(t0);
	osc.stop(t0 + dur + .02);
	osc.onended = () => {
		osc.disconnect();
		g.disconnect();
	};
}
function sfxPlace() {
	const b = ensure();
	if (!b) return;
	const f = 420 + Math.random() * 40;
	tone(f, .09, "triangle", .18, b.sfx);
	tone(f * 2, .06, "sine", .08, b.sfx, .01);
}
function sfxClear(combo) {
	const b = ensure();
	if (!b) return;
	const base = 520 + Math.min(combo, 8) * 40;
	tone(base, .16, "triangle", .22, b.sfx);
	tone(base * 1.25, .18, "sine", .14, b.sfx, .04);
	tone(base * 1.5, .22, "sine", .1, b.sfx, .08);
}
function sfxBad() {
	const b = ensure();
	if (!b) return;
	tone(180, .12, "square", .08, b.sfx, 0, 110);
}
function sfxWin() {
	const b = ensure();
	if (!b) return;
	[
		523,
		659,
		784,
		1046
	].forEach((f, i) => tone(f, .22, "triangle", .16, b.sfx, i * .08));
}
function sfxOver() {
	const b = ensure();
	if (!b) return;
	tone(320, .28, "sawtooth", .1, b.sfx, 0, 140);
	tone(220, .4, "triangle", .12, b.sfx, .08, 90);
}
function sfxCoin() {
	const b = ensure();
	if (!b) return;
	tone(880, .08, "square", .08, b.sfx);
	tone(1320, .12, "square", .07, b.sfx, .05);
}
function sfxUi() {
	const b = ensure();
	if (!b) return;
	tone(640 + Math.random() * 40, .05, "sine", .08, b.sfx);
}
function startMusic() {
	if (!ensure() || musicTimer !== null) return;
	const notes = [
		196,
		247,
		294,
		330,
		392,
		330,
		294,
		247
	];
	let i = 0;
	const tick = () => {
		if (!bus) return;
		const n = notes[i % notes.length];
		tone(n, .55, "sine", .07, bus.music);
		tone(n * 2, .4, "triangle", .03, bus.music, .05);
		i++;
		musicTimer = window.setTimeout(tick, 900);
	};
	tick();
}
function stopMusic() {
	if (musicTimer !== null) {
		window.clearTimeout(musicTimer);
		musicTimer = null;
	}
}
function bindAudioLifecycle() {
	const onVis = () => {
		if (document.visibilityState === "visible") {
			const b = ensure();
			if (b && b.ctx.state === "suspended") b.ctx.resume();
		}
	};
	document.addEventListener("visibilitychange", onVis);
	return () => document.removeEventListener("visibilitychange", onVis);
}
var COLORS = [
	"cyan",
	"lime",
	"pink",
	"amber",
	"violet",
	"orange",
	"azure"
];
var SHAPES = [
	{
		id: "o1",
		cells: [[0, 0]],
		weight: 5
	},
	{
		id: "i2",
		cells: [[0, 0], [0, 1]],
		weight: 11
	},
	{
		id: "i3",
		cells: [
			[0, 0],
			[0, 1],
			[0, 2]
		],
		weight: 11
	},
	{
		id: "i4",
		cells: [
			[0, 0],
			[0, 1],
			[0, 2],
			[0, 3]
		],
		weight: 8
	},
	{
		id: "i5",
		cells: [
			[0, 0],
			[0, 1],
			[0, 2],
			[0, 3],
			[0, 4]
		],
		weight: 3
	},
	{
		id: "o4",
		cells: [
			[0, 0],
			[0, 1],
			[1, 0],
			[1, 1]
		],
		weight: 11
	},
	{
		id: "r23",
		cells: [
			[0, 0],
			[0, 1],
			[0, 2],
			[1, 0],
			[1, 1],
			[1, 2]
		],
		weight: 5
	},
	{
		id: "o9",
		cells: [
			[0, 0],
			[0, 1],
			[0, 2],
			[1, 0],
			[1, 1],
			[1, 2],
			[2, 0],
			[2, 1],
			[2, 2]
		],
		weight: 2
	},
	{
		id: "l3",
		cells: [
			[0, 0],
			[1, 0],
			[1, 1]
		],
		weight: 11
	},
	{
		id: "l4",
		cells: [
			[0, 0],
			[1, 0],
			[2, 0],
			[2, 1]
		],
		weight: 8
	},
	{
		id: "j4",
		cells: [
			[0, 1],
			[1, 1],
			[2, 0],
			[2, 1]
		],
		weight: 8
	},
	{
		id: "l5",
		cells: [
			[0, 0],
			[1, 0],
			[2, 0],
			[2, 1],
			[2, 2]
		],
		weight: 5
	},
	{
		id: "t4",
		cells: [
			[0, 0],
			[0, 1],
			[0, 2],
			[1, 1]
		],
		weight: 8
	},
	{
		id: "t5",
		cells: [
			[0, 0],
			[0, 1],
			[0, 2],
			[1, 1],
			[2, 1]
		],
		weight: 3
	},
	{
		id: "s4",
		cells: [
			[0, 1],
			[0, 2],
			[1, 0],
			[1, 1]
		],
		weight: 6
	},
	{
		id: "z4",
		cells: [
			[0, 0],
			[0, 1],
			[1, 1],
			[1, 2]
		],
		weight: 6
	},
	{
		id: "u5",
		cells: [
			[0, 0],
			[0, 2],
			[1, 0],
			[1, 1],
			[1, 2]
		],
		weight: 4
	},
	{
		id: "plus",
		cells: [
			[0, 1],
			[1, 0],
			[1, 1],
			[1, 2],
			[2, 1]
		],
		weight: 3
	},
	{
		id: "corner5",
		cells: [
			[0, 0],
			[0, 1],
			[0, 2],
			[1, 0],
			[2, 0]
		],
		weight: 5
	},
	{
		id: "z5",
		cells: [
			[0, 0],
			[0, 1],
			[1, 1],
			[2, 1],
			[2, 2]
		],
		weight: 3
	},
	{
		id: "diag2",
		cells: [[0, 0], [1, 1]],
		weight: 2
	},
	{
		id: "h3",
		cells: [
			[0, 0],
			[0, 1],
			[0, 2],
			[1, 0],
			[1, 2]
		],
		weight: 3
	}
];
var SHAPE_MAP = new Map(SHAPES.map((s) => [s.id, s]));
var WEIGHT_SUM = SHAPES.reduce((a, s) => a + s.weight, 0);
var seq = 1;
function uid(prefix = "p") {
	return `${prefix}${seq++}-${Math.random().toString(36).slice(2, 7)}`;
}
function emptyBoard() {
	return Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => ({ t: "e" })));
}
function cloneBoard(board) {
	return board.map((row) => row.map((cell) => ({ ...cell })));
}
function clonePiece(piece) {
	return {
		...piece,
		cells: piece.cells.map(([r, c]) => [r, c])
	};
}
function cloneMatch(m) {
	return {
		...m,
		board: cloneBoard(m.board),
		tray: m.tray.map((p) => p ? clonePiece(p) : null),
		goal: m.goal ? { ...m.goal } : null
	};
}
function normalize(cells) {
	const minR = Math.min(...cells.map((x) => x[0]));
	const minC = Math.min(...cells.map((x) => x[1]));
	return cells.map(([r, c]) => [r - minR, c - minC]);
}
function rotateCW(cells) {
	return normalize(cells.map(([r, c]) => [c, -r]));
}
function rotateN(cells, n) {
	let next = cells;
	const turns = (n % 4 + 4) % 4;
	for (let i = 0; i < turns; i++) next = rotateCW(next);
	return next;
}
function bounds(cells) {
	return {
		rows: Math.max(...cells.map((x) => x[0])) + 1,
		cols: Math.max(...cells.map((x) => x[1])) + 1
	};
}
function isEmpty(cell) {
	return cell.t === "e";
}
function canPlace(board, cells, row, col) {
	for (const [dr, dc] of cells) {
		const r = row + dr;
		const c = col + dc;
		if (r < 0 || c < 0 || r >= 8 || c >= 8) return false;
		if (!isEmpty(board[r][c])) return false;
	}
	return true;
}
function canPlaceAnywhere(board, cells) {
	const { rows, cols } = bounds(cells);
	for (let r = 0; r <= 8 - rows; r++) for (let c = 0; c <= 8 - cols; c++) if (canPlace(board, cells, r, c)) return true;
	return false;
}
function pickShape(rng) {
	let roll = rng() * WEIGHT_SUM;
	for (const shape of SHAPES) {
		roll -= shape.weight;
		if (roll <= 0) return shape;
	}
	return SHAPES[0];
}
function pickColor(rng) {
	return COLORS[Math.floor(rng() * COLORS.length)];
}
function makePiece(rng, forceShape) {
	const shape = forceShape ? SHAPE_MAP.get(forceShape) ?? pickShape(rng) : pickShape(rng);
	const turns = Math.floor(rng() * 4);
	const cells = rotateN(shape.cells, turns);
	const starRoll = rng();
	const gold = starRoll > .97;
	const starAt = gold || starRoll > .9 ? Math.floor(rng() * cells.length) : null;
	return {
		id: uid(),
		shape: shape.id,
		cells,
		color: pickColor(rng),
		starAt,
		gold
	};
}
function namedPiece(shapeId, color, cells, starAt = null, gold = false) {
	return {
		id: uid(),
		shape: shapeId,
		cells,
		color,
		starAt,
		gold
	};
}
function rotatePiece(piece) {
	const next = clonePiece(piece);
	next.cells = rotateCW(next.cells);
	return next;
}
function mulberry32(seed) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = a + 1831565813 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function defaultRng() {
	return Math.random;
}
function sprinkleStones(board, count, rng) {
	let placed = 0;
	let guard = 0;
	while (placed < count && guard < 200) {
		guard++;
		const r = Math.floor(rng() * 8);
		const c = Math.floor(rng() * 8);
		if (!isEmpty(board[r][c])) continue;
		board[r][c] = {
			t: "k",
			hp: rng() > .55 ? 2 : 1
		};
		placed++;
	}
}
/** Mid-run board that matches the Puzzle Journey mock — no full lines. */
function openingBoard() {
	const b = emptyBoard();
	const put = (r, c, cell) => {
		b[r][c] = cell;
	};
	const blk = (c) => ({
		t: "b",
		c
	});
	const star = (c, gold = false) => ({
		t: "s",
		c,
		gold
	});
	const stone = (hp = 1) => ({
		t: "k",
		hp
	});
	put(0, 2, blk("cyan"));
	put(0, 3, blk("cyan"));
	put(1, 2, blk("cyan"));
	put(1, 3, blk("lime"));
	put(2, 2, stone(1));
	put(2, 3, blk("lime"));
	put(2, 5, star("azure"));
	put(2, 7, blk("violet"));
	put(3, 5, blk("amber"));
	put(3, 6, blk("amber"));
	put(3, 7, blk("violet"));
	put(4, 3, blk("pink"));
	put(4, 4, blk("pink"));
	put(4, 6, blk("amber"));
	put(4, 7, blk("amber"));
	put(5, 2, star("azure"));
	put(5, 3, blk("pink"));
	put(5, 4, blk("pink"));
	put(6, 0, blk("lime"));
	put(6, 1, blk("lime"));
	put(6, 2, blk("lime"));
	put(6, 4, star("orange", true));
	put(6, 6, stone(2));
	put(7, 0, blk("cyan"));
	put(7, 1, blk("cyan"));
	put(7, 2, stone(1));
	put(7, 3, blk("amber"));
	put(7, 6, star("violet"));
	put(7, 7, blk("violet"));
	return b;
}
function openingTray() {
	return [
		namedPiece("t4", "pink", [
			[0, 1],
			[1, 0],
			[1, 1],
			[1, 2]
		]),
		namedPiece("o4", "amber", [
			[0, 0],
			[0, 1],
			[1, 0],
			[1, 1]
		]),
		namedPiece("l4", "cyan", [
			[0, 0],
			[1, 0],
			[1, 1],
			[1, 2]
		])
	];
}
function findFullLines(board) {
	const rows = [];
	const cols = [];
	for (let r = 0; r < 8; r++) if (board[r].every((cell) => !isEmpty(cell))) rows.push(r);
	for (let c = 0; c < 8; c++) {
		let full = true;
		for (let r = 0; r < 8; r++) if (isEmpty(board[r][c])) {
			full = false;
			break;
		}
		if (full) cols.push(c);
	}
	return {
		rows,
		cols
	};
}
function applyLineClear(board, rows, cols) {
	const marked = /* @__PURE__ */ new Set();
	const cells = [];
	let stars = 0;
	let golds = 0;
	let intersections = 0;
	const mark = (r, c, fromRow, fromCol) => {
		const key = `${r},${c}`;
		if (marked.has(key)) return;
		marked.add(key);
		const cell = board[r][c];
		cells.push({
			r,
			c,
			cell: { ...cell }
		});
		if (fromRow && fromCol) intersections++;
		if (cell.t === "s") {
			stars++;
			if (cell.gold) golds++;
		}
	};
	const rowSet = new Set(rows);
	const colSet = new Set(cols);
	for (const r of rows) for (let c = 0; c < 8; c++) mark(r, c, true, colSet.has(c));
	for (const c of cols) for (let r = 0; r < 8; r++) mark(r, c, rowSet.has(r), true);
	for (const { r, c } of cells) {
		const cell = board[r][c];
		if (cell.t === "k") {
			if (cell.hp <= 1) board[r][c] = { t: "e" };
			else board[r][c] = {
				t: "k",
				hp: 1
			};
		} else board[r][c] = { t: "e" };
	}
	return {
		rows,
		cols,
		cells,
		lines: rows.length + cols.length,
		intersections,
		stars,
		golds,
		waves: 1
	};
}
function resolveClears(board) {
	const merged = {
		rows: [],
		cols: [],
		cells: [],
		lines: 0,
		intersections: 0,
		stars: 0,
		golds: 0,
		waves: 0
	};
	const seen = /* @__PURE__ */ new Set();
	for (let wave = 0; wave < 8; wave++) {
		const { rows, cols } = findFullLines(board);
		if (rows.length + cols.length === 0) break;
		const info = applyLineClear(board, rows, cols);
		merged.waves++;
		merged.lines += info.lines;
		merged.intersections += info.intersections;
		merged.stars += info.stars;
		merged.golds += info.golds;
		for (const r of rows) if (!merged.rows.includes(r)) merged.rows.push(r);
		for (const c of cols) if (!merged.cols.includes(c)) merged.cols.push(c);
		for (const cell of info.cells) {
			const key = `${cell.r},${cell.c}`;
			if (seen.has(key)) continue;
			seen.add(key);
			merged.cells.push(cell);
		}
	}
	return merged.lines > 0 ? merged : null;
}
function previewClear(board, piece, row, col) {
	if (!canPlace(board, piece.cells, row, col)) return null;
	const next = cloneBoard(board);
	stampPiece(next, piece, row, col);
	return resolveClears(next);
}
function stampPiece(board, piece, row, col) {
	piece.cells.forEach(([dr, dc], i) => {
		const star = piece.starAt === i;
		board[row + dr][col + dc] = star ? {
			t: "s",
			c: piece.color,
			gold: piece.gold
		} : {
			t: "b",
			c: piece.color
		};
	});
}
function scoreFor(piece, clear, combo) {
	let score = piece.cells.length * 10;
	if (clear && clear.lines > 0) {
		score += clear.lines * 100 * combo;
		if (clear.lines > 1) score += (clear.lines - 1) * 50 * combo;
		score += clear.intersections * 25 * combo;
		score += clear.stars * 50 + clear.golds * 150;
	}
	return score;
}
function coinsFor(clear, gained) {
	return (clear ? clear.lines * 4 : 0) + Math.floor(gained / 80);
}
function updateGoal(match) {
	if (!match.goal) {
		match.goalProgress = 0;
		match.won = false;
		return;
	}
	if (match.goal.type === "score") match.goalProgress = match.score;
	else if (match.goal.type === "lines") match.goalProgress = match.lines;
	else match.goalProgress = match.bestCombo;
	match.won = match.goalProgress >= match.goal.value;
}
function checkOver(match) {
	if (match.won) {
		match.over = false;
		return match;
	}
	const remaining = match.tray.filter((p) => p !== null);
	if (remaining.length === 0) {
		match.over = false;
		return match;
	}
	match.over = !remaining.some((p) => canPlaceAnywhere(match.board, p.cells));
	return match;
}
function fillTray(match, rng, easy) {
	const makeFitting = () => {
		if (easy) return [
			makePiece(rng, "o4"),
			makePiece(rng, "i3"),
			makePiece(rng, "l3")
		];
		for (let attempt = 0; attempt < 28; attempt++) {
			const pieces = [
				makePiece(rng),
				makePiece(rng),
				makePiece(rng)
			];
			if (pieces.some((p) => canPlaceAnywhere(match.board, p.cells))) return pieces;
		}
		const fallback = [
			makePiece(rng, "o1"),
			makePiece(rng, "i2"),
			makePiece(rng, "l3")
		];
		if (!fallback.some((p) => canPlaceAnywhere(match.board, p.cells))) fallback[0] = makePiece(rng, "o1");
		return fallback;
	};
	match.tray = makeFitting();
}
function refillIfNeeded(match, rng = defaultRng()) {
	if (match.tray.every((p) => p === null)) fillTray(match, rng, false);
	return checkOver(match);
}
function blankMatch() {
	return {
		board: emptyBoard(),
		tray: [
			null,
			null,
			null
		],
		score: 0,
		combo: 0,
		bestCombo: 0,
		lines: 0,
		moves: 0,
		shield: 0,
		over: false,
		won: false,
		mode: "endless",
		levelId: null,
		goal: null,
		goalProgress: 0,
		stonesCleared: 0
	};
}
function newGoalMatch(goal) {
	const match = newEndlessMatch();
	match.mode = "adventure";
	match.goal = goal;
	match.levelId = null;
	updateGoal(match);
	return match;
}
function newEndlessMatch(opts) {
	const match = blankMatch();
	if (opts?.showcase) {
		match.board = openingBoard();
		match.tray = openingTray();
		return checkOver(match);
	}
	fillTray(match, defaultRng(), true);
	return match;
}
function newAdventureMatch(levelId, goal, stones) {
	const rng = mulberry32(levelId * 9973 + 17);
	const board = emptyBoard();
	sprinkleStones(board, stones, rng);
	const match = blankMatch();
	match.board = board;
	match.mode = "adventure";
	match.levelId = levelId;
	match.goal = goal;
	fillTray(match, rng, levelId <= 2);
	updateGoal(match);
	return match;
}
function placePiece(match, trayIndex, row, col) {
	const piece = match.tray[trayIndex];
	if (!piece || match.over) return {
		ok: false,
		match,
		clear: null,
		gained: 0,
		combo: match.combo,
		coins: 0
	};
	if (!canPlace(match.board, piece.cells, row, col)) return {
		ok: false,
		match,
		clear: null,
		gained: 0,
		combo: match.combo,
		coins: 0
	};
	const next = cloneMatch(match);
	stampPiece(next.board, piece, row, col);
	const clear = resolveClears(next.board);
	next.tray[trayIndex] = null;
	next.moves += 1;
	if (clear) {
		next.combo = match.combo + 1;
		next.lines += clear.lines;
		next.stonesCleared += clear.cells.filter((c) => c.cell.t === "k").length;
	} else if (next.shield > 0) next.shield -= 1;
	else next.combo = 0;
	next.bestCombo = Math.max(next.bestCombo, next.combo);
	const gained = scoreFor(piece, clear, Math.max(1, next.combo));
	next.score += gained;
	updateGoal(next);
	refillIfNeeded(next);
	checkOver(next);
	return {
		ok: true,
		match: next,
		clear,
		gained,
		combo: next.combo,
		coins: coinsFor(clear, gained)
	};
}
function hammerCell(match, row, col) {
	if (row < 0 || col < 0 || row >= 8 || col >= 8) return null;
	if (isEmpty(match.board[row][col])) return null;
	const next = cloneMatch(match);
	next.board[row][col] = { t: "e" };
	next.over = false;
	checkOver(next);
	return next;
}
function bombCell(match, row, col) {
	if (row < 0 || col < 0 || row >= 8 || col >= 8) return null;
	const next = cloneMatch(match);
	let hit = false;
	for (let r = row - 1; r <= row + 1; r++) for (let c = col - 1; c <= col + 1; c++) {
		if (r < 0 || c < 0 || r >= 8 || c >= 8) continue;
		if (!isEmpty(next.board[r][c])) {
			next.board[r][c] = { t: "e" };
			hit = true;
		}
	}
	if (!hit) return null;
	next.over = false;
	checkOver(next);
	return next;
}
function refreshTray(match) {
	const next = cloneMatch(match);
	fillTray(next, defaultRng(), false);
	next.over = false;
	checkOver(next);
	return next;
}
function applyFreeze(match) {
	const next = cloneMatch(match);
	next.shield += 2;
	return next;
}
function continueMatch(match) {
	const next = cloneMatch(match);
	const occupied = [];
	for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (!isEmpty(next.board[r][c])) occupied.push({
		r,
		c
	});
	occupied.sort(() => Math.random() - .5);
	const remove = Math.min(6, occupied.length);
	for (let i = 0; i < remove; i++) {
		const cell = occupied[i];
		next.board[cell.r][cell.c] = { t: "e" };
	}
	next.over = false;
	fillTray(next, defaultRng(), false);
	checkOver(next);
	return next;
}
function comboLabel(combo) {
	if (combo <= 1) return "Clear";
	if (combo === 2) return "Nice";
	if (combo === 3) return "Great";
	if (combo === 4) return "Super";
	if (combo === 5) return "Amazing";
	if (combo === 6) return "Unreal";
	return "Legendary";
}
function pieceFits(match, piece) {
	return canPlaceAnywhere(match.board, piece.cells);
}
var SAVE_KEY = "puzzle-journey-v1";
var EMPTY_QUESTS = () => ({
	lines: {
		value: 0,
		claimed: false
	},
	score: {
		value: 0,
		claimed: false
	},
	combo: {
		value: 0,
		claimed: false
	},
	powers: {
		value: 0,
		claimed: false
	}
});
function defaultProfile() {
	return {
		version: 1,
		coins: 240,
		gems: 80,
		xp: 0,
		level: 1,
		highScore: 0,
		bestCombo: 0,
		games: 0,
		powerups: {
			hammer: 3,
			refresh: 3,
			bomb: 3,
			freeze: 3
		},
		settings: {
			sfx: true,
			music: true,
			shake: true
		},
		daily: {
			lastClaim: 0,
			streak: 0,
			nextAt: Date.now()
		},
		quests: EMPTY_QUESTS(),
		questDay: todayKey(),
		adventure: {
			unlocked: 1,
			stars: {}
		},
		skin: "classic",
		seenHowTo: false,
		match: null
	};
}
function todayKey(d = /* @__PURE__ */ new Date()) {
	return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function migrate(raw) {
	const base = defaultProfile();
	const next = {
		...base,
		...raw,
		version: 1,
		powerups: {
			...base.powerups,
			...raw.powerups
		},
		settings: {
			...base.settings,
			...raw.settings
		},
		daily: {
			...base.daily,
			...raw.daily
		},
		quests: {
			...base.quests,
			...raw.quests
		},
		adventure: {
			unlocked: raw.adventure?.unlocked ?? 1,
			stars: raw.adventure?.stars ?? {}
		}
	};
	if (next.questDay !== todayKey()) {
		next.questDay = todayKey();
		next.quests = EMPTY_QUESTS();
	}
	return next;
}
function loadProfile() {
	try {
		const raw = localStorage.getItem(SAVE_KEY);
		if (!raw) return defaultProfile();
		return migrate(JSON.parse(raw));
	} catch {
		return defaultProfile();
	}
}
function saveProfile(profile) {
	try {
		const blob = JSON.stringify(profile);
		localStorage.setItem(`${SAVE_KEY}__bak`, localStorage.getItem("puzzle-journey-v1") ?? "");
		localStorage.setItem(SAVE_KEY, blob);
	} catch {}
}
function ensureMatch(profile) {
	if (profile.match) return profile;
	return {
		...profile,
		match: newEndlessMatch({ showcase: profile.games === 0 })
	};
}
var persistTimer = null;
var popSeq = 1;
function persistSoon(get) {
	if (persistTimer) clearTimeout(persistTimer);
	persistTimer = setTimeout(() => get().persist(), 250);
}
function applyQuestScore(profile, match, powersUsed = 0) {
	const q = { ...profile.quests };
	q.lines = {
		...q.lines,
		value: Math.max(q.lines.value, match.lines)
	};
	q.score = {
		...q.score,
		value: Math.max(q.score.value, match.score)
	};
	q.combo = {
		...q.combo,
		value: Math.max(q.combo.value, match.bestCombo)
	};
	if (powersUsed) q.powers = {
		...q.powers,
		value: q.powers.value + powersUsed
	};
	return {
		...profile,
		quests: q
	};
}
function grantXp(profile, xp) {
	let next = {
		...profile,
		xp: profile.xp + xp
	};
	let leveled = null;
	while (next.xp >= xpForLevel(next.level)) {
		next = {
			...next,
			xp: next.xp - xpForLevel(next.level),
			level: next.level + 1,
			coins: next.coins + 40 + next.level * 4,
			gems: next.gems + 3
		};
		leveled = next.level;
	}
	return {
		profile: next,
		leveled
	};
}
var useGame = create((set, get) => ({
	ready: true,
	started: false,
	tab: "home",
	panel: null,
	profile: defaultProfile(),
	match: newEndlessMatch({ showcase: true }),
	selected: 0,
	targeting: null,
	flash: [],
	shake: false,
	comboPop: null,
	toast: null,
	levelUpTo: null,
	hydrate: () => {
		const profile = ensureMatch(loadProfile());
		setMuted(profile.settings.sfx, profile.settings.music);
		set({
			ready: true,
			profile,
			match: profile.match ?? newEndlessMatch({ showcase: true }),
			started: false,
			panel: profile.seenHowTo ? null : "how"
		});
	},
	persist: () => {
		const { profile, match } = get();
		saveProfile({
			...profile,
			match
		});
	},
	start: () => {
		unlockAudio();
		const { profile } = get();
		setMuted(profile.settings.sfx, profile.settings.music);
		set({ started: true });
	},
	setTab: (tab) => {
		sfxUi();
		set({
			tab,
			panel: tab === "home" ? get().panel : null,
			targeting: null
		});
	},
	setPanel: (panel) => {
		if (panel) sfxUi();
		const { profile } = get();
		if (panel !== "how" && !profile.seenHowTo) {
			set({
				panel,
				profile: {
					...profile,
					seenHowTo: true
				}
			});
			persistSoon(get);
			return;
		}
		set({ panel });
	},
	selectPiece: (index) => set({
		selected: index,
		targeting: null
	}),
	rotateSelected: () => {
		const { match, selected } = get();
		if (selected === null) return;
		const piece = match.tray[selected];
		if (!piece) return;
		sfxUi();
		const tray = match.tray.slice();
		tray[selected] = rotatePiece(piece);
		set({ match: {
			...match,
			tray
		} });
		persistSoon(get);
	},
	tryPlace: (trayIndex, row, col) => {
		const { match, profile } = get();
		const result = placePiece(match, trayIndex, row, col);
		if (!result.ok) {
			sfxBad();
			return false;
		}
		sfxPlace();
		let nextProfile = {
			...profile,
			coins: profile.coins + result.coins,
			highScore: Math.max(profile.highScore, result.match.score),
			bestCombo: Math.max(profile.bestCombo, result.match.bestCombo)
		};
		const xpGain = Math.max(4, Math.floor(result.gained / 12));
		const leveled = grantXp(nextProfile, xpGain);
		nextProfile = applyQuestScore(leveled.profile, result.match);
		if (result.clear) {
			sfxClear(result.combo);
			if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(18);
		}
		if (result.match.won && result.match.mode === "adventure") {
			if (result.match.levelId) {
				const lvl = ADVENTURE.find((l) => l.id === result.match.levelId);
				if (lvl) {
					const ratio = result.match.goal ? result.match.goalProgress / result.match.goal.value : 1;
					const stars = ratio >= 1.6 ? 3 : ratio >= 1.2 ? 2 : 1;
					const prev = nextProfile.adventure.stars[String(lvl.id)] ?? 0;
					nextProfile = {
						...nextProfile,
						coins: nextProfile.coins + lvl.reward.coins,
						gems: nextProfile.gems + lvl.reward.gems,
						adventure: {
							unlocked: Math.max(nextProfile.adventure.unlocked, lvl.id + 1),
							stars: {
								...nextProfile.adventure.stars,
								[String(lvl.id)]: Math.max(prev, stars)
							}
						}
					};
				}
			} else {
				const ch = CHALLENGES.find((c) => c.goal.type === result.match.goal?.type && c.goal.value === result.match.goal.value);
				nextProfile = {
					...nextProfile,
					coins: nextProfile.coins + (ch?.reward.coins ?? 70),
					gems: nextProfile.gems + (ch?.reward.gems ?? 5)
				};
			}
		}
		const comboPop = result.clear && result.combo > 0 ? {
			id: popSeq++,
			label: comboLabel(result.combo),
			score: result.gained,
			combo: result.combo
		} : null;
		set({
			match: result.match,
			profile: nextProfile,
			selected: result.match.tray.findIndex((p) => p),
			flash: result.clear?.cells ?? [],
			shake: Boolean(result.clear && profile.settings.shake && result.clear.lines >= 2),
			comboPop,
			levelUpTo: leveled.leveled,
			panel: result.match.won ? "won" : result.match.over ? "over" : get().panel
		});
		if (result.match.won) sfxWin();
		else if (result.match.over) sfxOver();
		persistSoon(get);
		window.setTimeout(() => set({
			flash: [],
			shake: false
		}), 420);
		window.setTimeout(() => set({ comboPop: null }), 900);
		return true;
	},
	armPower: (id) => {
		const { profile, match, targeting } = get();
		if (profile.powerups[id] <= 0) {
			set({
				panel: "shop",
				toast: "Buy more in the shop."
			});
			return;
		}
		if (id === "refresh") {
			const next = refreshTray(match);
			const nextProfile = applyQuestScore({
				...profile,
				powerups: {
					...profile.powerups,
					refresh: profile.powerups.refresh - 1
				}
			}, next, 1);
			sfxUi();
			set({
				match: next,
				profile: nextProfile,
				targeting: null,
				selected: next.tray.findIndex((p) => p)
			});
			persistSoon(get);
			return;
		}
		if (id === "freeze") {
			const next = applyFreeze(match);
			const nextProfile = applyQuestScore({
				...profile,
				powerups: {
					...profile.powerups,
					freeze: profile.powerups.freeze - 1
				}
			}, next, 1);
			sfxUi();
			set({
				match: next,
				profile: nextProfile,
				targeting: null,
				toast: "Combo shield ready for two drops."
			});
			persistSoon(get);
			window.setTimeout(() => set({ toast: null }), 1600);
			return;
		}
		set({
			targeting: targeting === id ? null : id,
			selected: null
		});
	},
	usePowerOnCell: (row, col) => {
		const { targeting, match, profile } = get();
		if (!targeting) return false;
		const used = targeting === "hammer" ? hammerCell(match, row, col) : targeting === "bomb" ? bombCell(match, row, col) : null;
		if (!used) {
			sfxBad();
			return false;
		}
		sfxClear(1);
		set({
			match: used,
			profile: applyQuestScore({
				...profile,
				powerups: {
					...profile.powerups,
					[targeting]: profile.powerups[targeting] - 1
				}
			}, used, 1),
			targeting: null,
			panel: used.over ? "over" : get().panel
		});
		persistSoon(get);
		return true;
	},
	cancelTarget: () => set({ targeting: null }),
	newGame: () => {
		sfxUi();
		const { profile } = get();
		set({
			match: newEndlessMatch(),
			selected: 0,
			targeting: null,
			panel: null,
			tab: "home",
			flash: [],
			profile: {
				...profile,
				games: profile.games + 1,
				seenHowTo: true
			}
		});
		persistSoon(get);
	},
	startAdventure: (levelId) => {
		const level = ADVENTURE.find((l) => l.id === levelId);
		if (!level) return;
		const { profile } = get();
		if (levelId > profile.adventure.unlocked) {
			set({ toast: "Clear the previous island first." });
			window.setTimeout(() => set({ toast: null }), 1400);
			return;
		}
		sfxUi();
		set({
			match: newAdventureMatch(level.id, level.goal, level.stones),
			tab: "home",
			panel: null,
			selected: 0,
			targeting: null,
			profile: {
				...profile,
				games: profile.games + 1
			}
		});
		persistSoon(get);
	},
	startChallenge: (id) => {
		const challenge = CHALLENGES.find((c) => c.id === id);
		if (!challenge) return;
		sfxUi();
		const { profile } = get();
		set({
			match: newGoalMatch(challenge.goal),
			tab: "home",
			panel: null,
			selected: 0,
			targeting: null,
			profile: {
				...profile,
				games: profile.games + 1
			}
		});
		persistSoon(get);
	},
	continueRun: () => {
		const { profile, match } = get();
		if (profile.gems < 40) {
			set({
				panel: "shop",
				toast: `Need 40 gems to continue.`
			});
			return;
		}
		const next = continueMatch(match);
		sfxWin();
		set({
			match: next,
			profile: {
				...profile,
				gems: profile.gems - 40
			},
			panel: null,
			selected: next.tray.findIndex((p) => p)
		});
		persistSoon(get);
	},
	claimDaily: () => {
		const { profile } = get();
		const now = Date.now();
		if (now < profile.daily.nextAt) return;
		const streak = now - profile.daily.lastClaim < 1728e5 && profile.daily.lastClaim > 0 ? profile.daily.streak + 1 : 1;
		const coins = 50 + streak * 8;
		const gems = 4 + Math.min(6, streak);
		sfxCoin();
		set({
			profile: {
				...profile,
				coins: profile.coins + coins,
				gems: profile.gems + gems,
				daily: {
					lastClaim: now,
					streak,
					nextAt: now + 288e5
				}
			},
			toast: `Daily gift: +${coins} coins, +${gems} gems`
		});
		persistSoon(get);
		window.setTimeout(() => set({ toast: null }), 1800);
	},
	claimQuest: (id) => {
		const { profile } = get();
		const def = QUESTS.find((q) => q.id === id);
		const progress = profile.quests[id];
		if (!def || !progress || progress.claimed || progress.value < def.target) return;
		sfxCoin();
		set({ profile: {
			...profile,
			coins: profile.coins + def.coins,
			gems: profile.gems + def.gems,
			quests: {
				...profile.quests,
				[id]: {
					...progress,
					claimed: true
				}
			}
		} });
		persistSoon(get);
	},
	buy: (itemId) => {
		const { profile } = get();
		const pack = itemId === "pack";
		const pouch = itemId === "coins";
		if (pack) {
			if (profile.gems < 90) {
				set({ toast: "Not enough gems." });
				return;
			}
			sfxCoin();
			set({
				profile: {
					...profile,
					gems: profile.gems - 90,
					powerups: {
						hammer: profile.powerups.hammer + 2,
						refresh: profile.powerups.refresh + 2,
						bomb: profile.powerups.bomb + 2,
						freeze: profile.powerups.freeze + 2
					}
				},
				toast: "Packed four tools."
			});
			persistSoon(get);
			return;
		}
		if (pouch) {
			if (profile.gems < 40) {
				set({ toast: "Not enough gems." });
				return;
			}
			sfxCoin();
			set({
				profile: {
					...profile,
					gems: profile.gems - 40,
					coins: profile.coins + 400
				},
				toast: "+400 coins"
			});
			persistSoon(get);
			return;
		}
		const item = {
			hammer: {
				coins: 90,
				power: "hammer"
			},
			refresh: {
				coins: 70,
				power: "refresh"
			},
			bomb: {
				coins: 140,
				power: "bomb"
			},
			freeze: {
				coins: 110,
				power: "freeze"
			}
		}[itemId];
		if (!item) return;
		if (profile.coins < item.coins) {
			set({ toast: "Not enough coins." });
			return;
		}
		sfxCoin();
		set({ profile: {
			...profile,
			coins: profile.coins - item.coins,
			powerups: {
				...profile.powerups,
				[item.power]: profile.powerups[item.power] + 1
			}
		} });
		persistSoon(get);
	},
	setSkin: (skin) => {
		sfxUi();
		set({ profile: {
			...get().profile,
			skin
		} });
		persistSoon(get);
	},
	toggleSetting: (key) => {
		const { profile } = get();
		const settings = {
			...profile.settings,
			[key]: !profile.settings[key]
		};
		setMuted(settings.sfx, settings.music);
		set({ profile: {
			...profile,
			settings
		} });
		persistSoon(get);
	},
	resetProgress: () => {
		const fresh = defaultProfile();
		const match = newEndlessMatch({ showcase: true });
		set({
			profile: fresh,
			match,
			panel: "how",
			selected: 0,
			tab: "home"
		});
		saveProfile({
			...fresh,
			match
		});
	},
	dismissLevelUp: () => set({ levelUpTo: null }),
	setToast: (msg) => set({ toast: msg })
}));
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function formatInt(n) {
	return Math.max(0, Math.floor(n)).toLocaleString("en-US");
}
function NightIsle() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pj-skyline",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: "/isle-bg.jpg",
			alt: "",
			className: "pj-bg-img",
			crossOrigin: "anonymous"
		})
	});
}
function SideRails() {
	const setPanel = useGame((s) => s.setPanel);
	const profile = useGame((s) => s.profile);
	const [, tick] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		const id = window.setInterval(() => tick((n) => n + 1), 1e3);
		return () => window.clearInterval(id);
	}, []);
	const dailyReady = Date.now() >= profile.daily.nextAt;
	const remain = Math.max(0, profile.daily.nextAt - Date.now());
	const mm = String(Math.floor(remain / 6e4) % 60).padStart(2, "0");
	const hh = String(Math.floor(remain / 36e5)).padStart(2, "0");
	const ss = String(Math.floor(remain / 1e3 % 60)).padStart(2, "0");
	const questReady = QUESTS.some((q) => profile.quests[q.id].value >= q.target && !profile.quests[q.id].claimed);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pj-rails pj-rails-l",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "pj-rail relative",
				onClick: () => setPanel("daily"),
				children: [
					dailyReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pj-badge" }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ico bg-title/20",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "size-4" })
					}),
					"Daily"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "pj-rail",
				onClick: () => setPanel("daily"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ico bg-gold/20",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, { className: "size-4 text-gold" })
				}), dailyReady ? "Claim" : `${hh}:${mm}:${ss}`]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "pj-rail",
				onClick: () => setPanel("events"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ico bg-gold/20",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, { className: "size-4 text-gold" })
				}), "Events"]
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pj-rails pj-rails-r",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "pj-rail relative",
				onClick: () => setPanel("map"),
				children: [
					profile.adventure.unlocked === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pj-badge" }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ico bg-ok/20",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Map$1, { className: "size-4 text-ok" })
					}),
					"Map"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "pj-rail relative",
				onClick: () => setPanel("quests"),
				children: [
					questReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pj-badge" }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ico bg-title/20",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Compass, { className: "size-4" })
					}),
					"Quests"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "pj-rail",
				onClick: () => setPanel("shop"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ico bg-gold/20",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "size-4 text-gold" })
				}), "Shop"]
			})
		]
	})] });
}
function PowerBar() {
	const profile = useGame((s) => s.profile);
	const targeting = useGame((s) => s.targeting);
	const armPower = useGame((s) => s.armPower);
	const setPanel = useGame((s) => s.setPanel);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pj-powers",
		children: [
			{
				id: "hammer",
				label: "Hammer",
				Icon: Hammer
			},
			{
				id: "refresh",
				label: "Reroll",
				Icon: RefreshCw
			},
			{
				id: "bomb",
				label: "Bomb",
				Icon: Bomb
			},
			{
				id: "freeze",
				label: "Frost",
				Icon: Snowflake
			}
		].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			"data-testid": `power-${item.id}`,
			"data-id": item.id,
			className: `pj-power ${targeting === item.id ? "is-armed" : ""}`,
			onClick: () => armPower(item.id),
			"aria-label": item.label,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.Icon, { className: "mx-auto size-6" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "pj-count",
					children: profile.powerups[item.id]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "pj-add",
					onClick: (e) => {
						e.stopPropagation();
						setPanel("shop");
					},
					role: "presentation",
					children: "+"
				})
			]
		}, item.id))
	});
}
function TabScreens() {
	const tab = useGame((s) => s.tab);
	if (tab === "home") return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pj-screen",
		children: [
			tab === "adventure" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdventureScreen, {}) : null,
			tab === "challenges" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChallengeScreen, {}) : null,
			tab === "skins" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkinsScreen, {}) : null,
			tab === "more" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoreScreen, {}) : null
		]
	});
}
function Overlays() {
	const panel = useGame((s) => s.panel);
	const toast = useGame((s) => s.toast);
	const levelUpTo = useGame((s) => s.levelUpTo);
	useGame((s) => s.setPanel);
	const dismissLevelUp = useGame((s) => s.dismissLevelUp);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		toast ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pj-toast",
			children: toast
		}) : null,
		levelUpTo && panel !== "over" && panel !== "won" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pj-modal center",
			role: "dialog",
			"aria-label": "Level up",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pj-sheet text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-extrabold tracking-widest text-gold uppercase",
						children: "Level up"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "mt-1 font-display text-4xl text-cream",
						children: ["Lv. ", levelUpTo]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "A little more coin, a little more sparkle."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "pj-btn pj-btn-primary mt-5 w-full",
						onClick: dismissLevelUp,
						children: "Keep going"
					})
				]
			})
		}) : null,
		panel ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `pj-modal ${panel === "how" || panel === "over" || panel === "won" ? "center" : ""}`,
			role: "dialog",
			"aria-modal": "true",
			children: [
				panel === "shop" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopSheet, {}) : null,
				panel === "quests" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuestSheet, {}) : null,
				panel === "daily" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DailySheet, {}) : null,
				panel === "events" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventsSheet, {}) : null,
				panel === "map" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapSheet, {}) : null,
				panel === "settings" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSheet, {}) : null,
				panel === "how" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HowSheet, {}) : null,
				panel === "over" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverSheet, {}) : null,
				panel === "won" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WonSheet, {}) : null
			]
		}) : null
	] });
}
function Sheet({ title, children }) {
	const setPanel = useGame((s) => s.setPanel);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pj-sheet",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pj-close",
				onClick: () => setPanel(null),
				"aria-label": "Close",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl text-cream pr-8",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 space-y-2",
				children
			})
		]
	});
}
function ShopSheet() {
	const buy = useGame((s) => s.buy);
	const profile = useGame((s) => s.profile);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
		title: "Night market",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm text-muted",
			children: [
				formatInt(profile.coins),
				" coins · ",
				formatInt(profile.gems),
				" gems"
			]
		}), SHOP_ITEMS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pj-card flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-extrabold",
					children: item.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs text-muted",
					children: item.blurb
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"data-testid": `buy-${item.id}`,
				className: "pj-btn pj-btn-primary shrink-0 text-sm",
				onClick: () => buy(item.id),
				children: item.coins ? `${item.coins}c` : `${item.gems}g`
			})]
		}, item.id))]
	});
}
function QuestSheet() {
	const profile = useGame((s) => s.profile);
	const claimQuest = useGame((s) => s.claimQuest);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		title: "Quests",
		children: QUESTS.map((q) => {
			const p = profile.quests[q.id];
			const ready = p.value >= q.target && !p.claimed;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pj-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-extrabold",
						children: q.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs text-muted",
						children: q.blurb
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "pj-btn pj-btn-primary text-sm",
						disabled: !ready,
						onClick: () => claimQuest(q.id),
						children: p.claimed ? "Done" : ready ? "Claim" : `${Math.min(p.value, q.target)}/${q.target}`
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pj-meter mt-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: `${Math.min(100, p.value / q.target * 100)}%` } })
				})]
			}, q.id);
		})
	});
}
function DailySheet() {
	const profile = useGame((s) => s.profile);
	const claimDaily = useGame((s) => s.claimDaily);
	const ready = Date.now() >= profile.daily.nextAt;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		title: "Daily gift",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pj-card text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, { className: "mx-auto size-8 text-gold" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 font-extrabold",
					children: ["Streak ", profile.daily.streak]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "A small pouch every eight hours."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "pj-btn pj-btn-primary mt-4 w-full",
					disabled: !ready,
					onClick: claimDaily,
					children: ready ? "Claim gift" : "Come back later"
				})
			]
		})
	});
}
function EventsSheet() {
	const startChallenge = useGame((s) => s.startChallenge);
	const setPanel = useGame((s) => s.setPanel);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		title: "Lantern weekend",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pj-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-extrabold",
					children: "Combo tide"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "String a x3 combo while the lanterns are lit."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "pj-btn pj-btn-primary mt-3 w-full",
					onClick: () => {
						setPanel(null);
						startChallenge("streak");
					},
					children: "Play event"
				})
			]
		})
	});
}
function MapSheet() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		title: "Island map",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdventureList, { compact: true })
	});
}
function SettingsSheet() {
	const profile = useGame((s) => s.profile);
	const toggleSetting = useGame((s) => s.toggleSetting);
	const setPanel = useGame((s) => s.setPanel);
	const newGame = useGame((s) => s.newGame);
	const resetProgress = useGame((s) => s.resetProgress);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
		title: "Settings",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, {
				label: "Sound",
				icon: profile.settings.sfx ? Volume2 : VolumeX,
				on: profile.settings.sfx,
				onClick: () => toggleSetting("sfx")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, {
				label: "Music",
				icon: profile.settings.music ? Volume2 : VolumeX,
				on: profile.settings.music,
				onClick: () => toggleSetting("music")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, {
				label: "Screen shake",
				icon: Vibrate,
				on: profile.settings.shake,
				onClick: () => toggleSetting("shake")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pj-btn pj-btn-ghost w-full",
				onClick: () => setPanel("how"),
				children: "How to play"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pj-btn pj-btn-ghost w-full",
				onClick: newGame,
				children: "New endless run"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pj-btn pj-btn-ghost w-full text-danger",
				onClick: resetProgress,
				children: "Reset progress"
			})
		]
	});
}
function HowSheet() {
	const setPanel = useGame((s) => s.setPanel);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pj-sheet text-left",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl text-cream",
				children: "How to play"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
				className: "mt-3 space-y-2 text-sm text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "1. Drag a block from the tray onto the board." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "2. Fill a whole row or column to clear it." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "3. Chain clears on back-to-back drops for combos." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "4. Tap a tray block to rotate it. Press R to rotate the selected one." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "5. Hammer, reroll, bomb, and frost get you out of tight spots." })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pj-btn pj-btn-primary mt-5 w-full",
				"data-testid": "play-start",
				onClick: () => setPanel(null),
				children: "Got it"
			})
		]
	});
}
function OverSheet() {
	const profile = useGame((s) => s.profile);
	const match = useGame((s) => s.match);
	const newGame = useGame((s) => s.newGame);
	const continueRun = useGame((s) => s.continueRun);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pj-sheet text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-3xl text-cream",
				children: "No more moves"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-muted",
				children: [
					"Score ",
					formatInt(match.score),
					" · best ",
					formatInt(profile.highScore)
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pj-btn pj-btn-primary mt-5 w-full",
				onClick: newGame,
				children: "Play again"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "pj-btn pj-btn-ghost mt-2 w-full",
				onClick: continueRun,
				children: [
					"Continue · ",
					40,
					" gems"
				]
			})
		]
	});
}
function WonSheet() {
	const match = useGame((s) => s.match);
	const profile = useGame((s) => s.profile);
	const newGame = useGame((s) => s.newGame);
	const startAdventure = useGame((s) => s.startAdventure);
	const setTab = useGame((s) => s.setTab);
	const nextId = match.levelId ? match.levelId + 1 : null;
	const nextOpen = nextId !== null && nextId <= profile.adventure.unlocked && ADVENTURE.some((l) => l.id === nextId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pj-sheet text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
				className: "mx-auto size-8 text-gold",
				fill: "currentColor"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-2 font-display text-3xl text-cream",
				children: "Island cleared"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-muted",
				children: [
					match.goal ? goalLabel(match.goal) : "Challenge complete",
					" · ",
					formatInt(match.score),
					" pts"
				]
			}),
			nextOpen && nextId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pj-btn pj-btn-primary mt-5 w-full",
				onClick: () => startAdventure(nextId),
				children: "Next island"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pj-btn pj-btn-primary mt-5 w-full",
				onClick: newGame,
				children: "Endless run"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pj-btn pj-btn-ghost mt-2 w-full",
				onClick: () => {
					newGame();
					setTab("adventure");
				},
				children: "Island map"
			})
		]
	});
}
function AdventureScreen() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-2xl",
			children: "Adventure"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted",
			children: "Ten islands. Clear · relax · level up."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdventureList, {})
		})
	] });
}
function ChallengeScreen() {
	const startChallenge = useGame((s) => s.startChallenge);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-2xl",
			children: "Challenges"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted",
			children: "Short goals on a fresh board."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 space-y-2",
			children: CHALLENGES.map((ch) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pj-card flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-extrabold",
						children: ch.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs text-muted",
						children: ch.blurb
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"data-testid": `challenge-${ch.id}`,
					className: "pj-btn pj-btn-primary shrink-0 text-sm",
					onClick: () => startChallenge(ch.id),
					children: "Play"
				})]
			}, ch.id))
		})
	] });
}
function SkinsScreen() {
	const skin = useGame((s) => s.profile.skin);
	const setSkin = useGame((s) => s.setSkin);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-2xl",
			children: "Skins"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted",
			children: "Same blocks, different dusk."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 grid grid-cols-2 gap-2",
			children: SKINS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: `pj-card text-left ${skin === s.id ? "is-on" : ""}`,
				onClick: () => setSkin(s.id),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "pj-swatch",
								"data-c": "cyan",
								"data-skin": s.id
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "pj-swatch",
								"data-c": "pink",
								"data-skin": s.id
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "pj-swatch",
								"data-c": "amber",
								"data-skin": s.id
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 font-extrabold",
						children: s.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs text-muted",
						children: s.blurb
					})
				]
			}, s.id))
		})
	] });
}
function MoreScreen() {
	const profile = useGame((s) => s.profile);
	const setPanel = useGame((s) => s.setPanel);
	const newGame = useGame((s) => s.newGame);
	const xpNeed = xpForLevel(profile.level);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-2xl",
			children: "More"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 grid grid-cols-2 gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "High score",
					value: formatInt(profile.highScore)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Best combo",
					value: `x${profile.bestCombo}`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Runs",
					value: String(profile.games)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Level",
					value: `${profile.level} · ${profile.xp}/${xpNeed}`
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 space-y-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "pj-btn pj-btn-ghost w-full",
					onClick: () => setPanel("how"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "mr-2 inline size-4" }), "How to play"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "pj-btn pj-btn-ghost w-full",
					onClick: () => setPanel("settings"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "mr-2 inline size-4" }), "Settings"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "pj-btn pj-btn-ghost w-full",
					onClick: newGame,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "mr-2 inline size-4" }), "New endless run"]
				})
			]
		})
	] });
}
function AdventureList({ compact = false }) {
	const profile = useGame((s) => s.profile);
	const startAdventure = useGame((s) => s.startAdventure);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-2",
		children: ADVENTURE.map((lvl) => {
			const locked = lvl.id > profile.adventure.unlocked;
			const stars = profile.adventure.stars[String(lvl.id)] ?? 0;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pj-card flex items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid size-10 shrink-0 place-items-center rounded-xl bg-dusk font-extrabold",
						children: locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-4 text-muted" }) : lvl.id
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-extrabold",
								children: lvl.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-muted",
								children: compact ? goalLabel(lvl.goal) : lvl.blurb
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 flex gap-0.5",
								children: [
									1,
									2,
									3
								].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
									className: `size-3 ${n <= stars ? "text-gold" : "text-muted/40"}`,
									fill: n <= stars ? "currentColor" : "none"
								}, n))
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"data-testid": `adv-${lvl.id}`,
						className: "pj-btn pj-btn-primary shrink-0 text-sm",
						disabled: locked,
						onClick: () => startAdventure(lvl.id),
						children: locked ? "Locked" : stars ? "Replay" : "Play"
					})
				]
			}, lvl.id);
		})
	});
}
function ToggleRow({ label, icon: Icon, on, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: "pj-card flex w-full items-center gap-3 text-left",
		onClick,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex-1 font-extrabold",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `pj-switch ${on ? "is-on" : ""}` })
		]
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pj-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-xs text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 font-display text-xl tabular-nums",
			children: value
		})]
	});
}
function colorOf(cell) {
	if (cell.t === "b" || cell.t === "s") return cell.c;
	if (cell.t === "k") return "stone";
	return null;
}
function BlockFace({ color, star, gold, cracked, ghost, flash, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("pj-block", ghost && "is-ghost", flash && "is-flash", className),
		"data-c": color,
		children: [cracked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pj-cracks" }) : null, star ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
			className: "pj-star",
			fill: gold ? "#ffe27a" : "currentColor",
			strokeWidth: 1.5
		}) : null]
	});
}
function PieceGrid({ piece, cell = 18, gap = 3, faded }) {
	const rows = Math.max(...piece.cells.map((x) => x[0])) + 1;
	const cols = Math.max(...piece.cells.map((x) => x[1])) + 1;
	const map = new Map(piece.cells.map((pos, i) => [`${pos[0]}-${pos[1]}`, i]));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("pj-mini", faded && "opacity-40"),
		style: {
			gridTemplateColumns: `repeat(${cols}, ${cell}px)`,
			gridTemplateRows: `repeat(${rows}, ${cell}px)`,
			gap
		},
		children: Array.from({ length: rows * cols }, (_, n) => {
			const r = Math.floor(n / cols);
			const c = n % cols;
			const idx = map.get(`${r}-${c}`);
			if (idx === void 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}, n);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlockFace, {
				color: piece.color,
				star: piece.starAt === idx,
				gold: piece.gold
			}, n);
		})
	});
}
function pieceSize(cells, cell, gap) {
	const rows = Math.max(...cells.map((x) => x[0])) + 1;
	const cols = Math.max(...cells.map((x) => x[1])) + 1;
	return {
		rows,
		cols,
		w: cols * cell + (cols - 1) * gap,
		h: rows * cell + (rows - 1) * gap
	};
}
function gridMetrics(grid) {
	const a = grid.querySelector("[data-cell=\"0-0\"]");
	const b = grid.querySelector("[data-cell=\"0-1\"]");
	if (!a) return null;
	const ar = a.getBoundingClientRect();
	const br = b?.getBoundingClientRect();
	const cell = ar.width;
	const gap = br ? br.left - ar.right : 4;
	return {
		left: ar.left,
		top: ar.top,
		cell,
		gap,
		stride: cell + gap
	};
}
function PlayArea() {
	const match = useGame((s) => s.match);
	const selected = useGame((s) => s.selected);
	const targeting = useGame((s) => s.targeting);
	const flash = useGame((s) => s.flash);
	const shake = useGame((s) => s.shake);
	const comboPop = useGame((s) => s.comboPop);
	const selectPiece = useGame((s) => s.selectPiece);
	const rotateSelected = useGame((s) => s.rotateSelected);
	const tryPlace = useGame((s) => s.tryPlace);
	const usePowerOnCell = useGame((s) => s.usePowerOnCell);
	const gridRef = (0, import_react.useRef)(null);
	const dragRef = (0, import_react.useRef)(null);
	const [drag, setDrag] = (0, import_react.useState)(null);
	const [hover, setHover] = (0, import_react.useState)(null);
	const moved = (0, import_react.useRef)(false);
	const skipClick = (0, import_react.useRef)(false);
	const wasSelected = (0, import_react.useRef)(false);
	const syncHover = (0, import_react.useCallback)((x, y, piece, lift) => {
		const grid = gridRef.current;
		if (!grid) return;
		const m = gridMetrics(grid);
		if (!m) return;
		const { rows, cols } = bounds(piece.cells);
		const w = cols * m.cell + (cols - 1) * m.gap;
		const h = rows * m.cell + (rows - 1) * m.gap;
		const cx = x;
		const cy = y - lift;
		const left = cx - w / 2;
		const top = cy - h / 2;
		const c = Math.round((left - m.left) / m.stride);
		const r = Math.round((top - m.top) / m.stride);
		if (r < 0 || c < 0 || r >= 8 || c >= 8) {
			setHover(null);
			return;
		}
		const valid = canPlace(match.board, piece.cells, r, c);
		const preview = valid ? previewClear(match.board, piece, r, c) : null;
		setHover({
			r,
			c,
			valid,
			rows: preview?.rows ?? [],
			cols: preview?.cols ?? []
		});
	}, [match.board]);
	(0, import_react.useEffect)(() => {
		const onMove = (e) => {
			const d = dragRef.current;
			if (!d || e.pointerId !== d.pointerId) return;
			if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) moved.current = true;
			const next = {
				...d,
				x: e.clientX,
				y: e.clientY
			};
			dragRef.current = next;
			setDrag(next);
			const piece = match.tray[d.index];
			if (piece) syncHover(next.x, next.y, piece, next.lift);
		};
		const onUp = (e) => {
			const d = dragRef.current;
			if (!d || e.pointerId !== d.pointerId) return;
			const piece = match.tray[d.index];
			const h = hover;
			dragRef.current = null;
			setDrag(null);
			if (piece && h?.valid && moved.current) {
				skipClick.current = true;
				tryPlace(d.index, h.r, h.c);
			} else if (!moved.current) {
				if (wasSelected.current) rotateSelected();
			}
			setHover(null);
		};
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
		window.addEventListener("pointercancel", onUp);
		return () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
			window.removeEventListener("pointercancel", onUp);
		};
	}, [
		hover,
		match.tray,
		rotateSelected,
		selectPiece,
		selected,
		syncHover,
		tryPlace
	]);
	const onPieceDown = (index, e) => {
		if (match.over || !match.tray[index]) return;
		e.preventDefault();
		e.currentTarget.setPointerCapture?.(e.pointerId);
		moved.current = false;
		wasSelected.current = selected === index;
		const lift = e.pointerType === "mouse" ? 0 : 88;
		const d = {
			index,
			pointerId: e.pointerId,
			x: e.clientX,
			y: e.clientY,
			lift
		};
		dragRef.current = d;
		setDrag(d);
		selectPiece(index);
	};
	const onCellClick = (r, c) => {
		if (skipClick.current) {
			skipClick.current = false;
			return;
		}
		if (targeting) {
			usePowerOnCell(r, c);
			return;
		}
		if (selected === null) return;
		if (!match.tray[selected]) return;
		tryPlace(selected, r, c);
	};
	const flashAt = (r, c) => flash.find((f) => f.r === r && f.c === c);
	const draggingPiece = drag ? match.tray[drag.index] : null;
	const ghostMetrics = (() => {
		if (!drag || !draggingPiece || !gridRef.current) return {
			cell: 28,
			gap: 3
		};
		return gridMetrics(gridRef.current) ?? {
			cell: 28,
			gap: 3
		};
	})();
	const hintCells = /* @__PURE__ */ new Set();
	if (hover?.valid && draggingPiece) for (const [dr, dc] of draggingPiece.cells) hintCells.add(`${hover.r + dr}-${hover.c + dc}`);
	const clearSet = /* @__PURE__ */ new Set();
	if (hover?.valid) {
		for (const r of hover.rows) for (let c = 0; c < 8; c++) clearSet.add(`${r}-${c}`);
		for (const c of hover.cols) for (let r = 0; r < 8; r++) clearSet.add(`${r}-${c}`);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pj-play",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `pj-frame ${shake ? "pj-shake" : ""}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					ref: gridRef,
					className: "pj-grid",
					"data-testid": "board",
					children: match.board.flatMap((row, r) => row.map((cell, c) => {
						const key = `${r}-${c}`;
						const col = colorOf(cell);
						const ghost = flashAt(r, c);
						const hinted = hintCells.has(key);
						const willClear = clearSet.has(key);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"data-cell": key,
							"data-testid": `cell-${r}-${c}`,
							className: `pj-well ${willClear ? "is-clear" : ""} ${hinted && hover?.valid ? "is-hint" : ""} ${targeting ? "is-target" : ""}`,
							onClick: () => onCellClick(r, c),
							"aria-label": `Row ${r + 1} column ${c + 1}`,
							children: col ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlockFace, {
								color: col,
								star: cell.t === "s",
								gold: cell.t === "s" && cell.gold,
								cracked: cell.t === "k"
							}) : hinted && draggingPiece ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlockFace, {
								color: draggingPiece.color,
								ghost: true
							}) : ghost ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlockFace, {
								color: colorOf(ghost.cell) ?? "stone",
								star: ghost.cell.t === "s",
								gold: ghost.cell.t === "s" && ghost.cell.gold,
								flash: true
							}) : null
						}, key);
					}))
				}), comboPop ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pj-float",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pj-combo",
						children: [
							comboPop.label,
							comboPop.combo > 1 ? ` x${comboPop.combo}` : "",
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pj-combo-pts",
								children: ["+", comboPop.score]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pj-sparks",
						"aria-hidden": "true",
						children: Array.from({ length: 12 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "pj-spark",
							style: { ["--a"]: `${i * 30}deg` }
						}, i))
					})]
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "pj-sign",
				"aria-hidden": "true",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Small moves" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Big journeys" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pj-tray",
				"data-testid": "tray",
				children: match.tray.map((piece, i) => {
					const fits = piece ? pieceFits(match, piece) : true;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"data-testid": `tray-${i}`,
						className: `pj-slot ${selected === i ? "is-selected" : ""} ${piece && !fits ? "is-dead" : ""}`,
						disabled: !piece || match.over,
						onPointerDown: (e) => onPieceDown(i, e),
						onClick: (e) => {
							if (e.detail !== 0) return;
							if (!piece) return;
							if (selected === i) rotateSelected();
							else selectPiece(i);
						},
						"aria-label": piece ? `Block ${i + 1}. Tap to rotate, drag to place.` : `Empty slot ${i + 1}`,
						children: piece && drag?.index !== i ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PieceGrid, {
							piece,
							cell: 16,
							faded: !fits
						}) : null
					}, piece?.id ?? `empty-${i}`);
				})
			}),
			drag && draggingPiece ? (() => {
				const size = pieceSize(draggingPiece.cells, ghostMetrics.cell, ghostMetrics.gap);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pj-ghost",
					style: {
						left: drag.x - size.w / 2,
						top: drag.y - drag.lift - size.h / 2,
						width: size.w,
						height: size.h
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PieceGrid, {
						piece: draggingPiece,
						cell: ghostMetrics.cell,
						gap: ghostMetrics.gap,
						faded: hover ? !hover.valid : false
					})
				});
			})() : null
		]
	});
}
function GameShell() {
	const hydrate = useGame((s) => s.hydrate);
	const persist = useGame((s) => s.persist);
	const start = useGame((s) => s.start);
	const profile = useGame((s) => s.profile);
	const match = useGame((s) => s.match);
	const tab = useGame((s) => s.tab);
	const setTab = useGame((s) => s.setTab);
	const setPanel = useGame((s) => s.setPanel);
	const rotateSelected = useGame((s) => s.rotateSelected);
	const cancelTarget = useGame((s) => s.cancelTarget);
	const selectPiece = useGame((s) => s.selectPiece);
	(0, import_react.useEffect)(() => {
		hydrate();
		const unbind = bindAudioLifecycle();
		const onHide = () => {
			if (document.visibilityState === "hidden") persist();
		};
		const onFirst = () => start();
		document.addEventListener("visibilitychange", onHide);
		window.addEventListener("pagehide", persist);
		window.addEventListener("pointerdown", onFirst, { once: true });
		return () => {
			unbind();
			document.removeEventListener("visibilitychange", onHide);
			window.removeEventListener("pagehide", persist);
			window.removeEventListener("pointerdown", onFirst);
		};
	}, [
		hydrate,
		persist,
		start
	]);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.key === "r" || e.key === "R") {
				e.preventDefault();
				rotateSelected();
			} else if (e.key === "Escape") {
				cancelTarget();
				setPanel(null);
			} else if (e.key === "1" || e.key === "2" || e.key === "3") {
				const i = Number(e.key) - 1;
				if (useGame.getState().match.tray[i]) selectPiece(i);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		cancelTarget,
		rotateSelected,
		selectPiece,
		setPanel
	]);
	const xpNeed = xpForLevel(profile.level);
	const xpPct = Math.min(100, Math.round(profile.xp / xpNeed * 100));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pj-root",
		"data-skin": profile.skin,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pj-stars" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NightIsle, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pj-stage",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "pj-hud",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pj-chip pj-chip-wide",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PalmBadge, {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "tabular-nums",
										children: ["Lv. ", profile.level]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "pj-xp",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: `${xpPct}%` } })
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pj-chip",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "pj-coin",
										"aria-hidden": "true"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "tabular-nums",
										children: formatInt(profile.coins)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "pj-plus",
										onClick: () => setPanel("shop"),
										"aria-label": "Get coins",
										children: "+"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pj-chip",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gem, { className: "size-4 text-violet" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "tabular-nums",
										children: formatInt(profile.gems)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "pj-plus",
										onClick: () => setPanel("shop"),
										"aria-label": "Get gems",
										children: "+"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "pj-icon-btn",
								onClick: () => setPanel("settings"),
								"aria-label": "Settings",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-4" })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pj-title",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pj-score tabular-nums",
							children: [
								formatInt(match.score),
								match.combo > 1 ? `  ·  x${match.combo}` : "",
								match.goal ? `  ·  ${Math.min(match.goalProgress, match.goal.value)}/${match.goal.value}` : "",
								match.shield > 0 ? `  ·  frost ${match.shield}` : ""
							]
						})]
					}),
					tab === "home" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayArea, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PowerBar, {})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabScreens, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "pj-nav",
						"aria-label": "Main",
						children: [
							[
								"home",
								"Home",
								House
							],
							[
								"adventure",
								"Adventure",
								MapPin
							],
							[
								"challenges",
								"Challenges",
								Trophy
							],
							[
								"skins",
								"Skins",
								Paintbrush
							],
							[
								"more",
								"More",
								Ellipsis
							]
						].map(([id, label, Icon]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: `pj-nav-btn ${tab === id ? "is-on" : ""}`,
							onClick: () => setTab(id),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" }), label]
						}, id))
					})
				]
			}),
			tab === "home" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SideRails, {}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlays, {})
		]
	});
}
function Logo() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pj-bob",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "pj-crown",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
					viewBox: "0 0 24 24",
					className: "size-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						fill: "#f0c14a",
						stroke: "#8a4a08",
						strokeWidth: "1.4",
						d: "M3 18h18l-1.2-9-5.3 4.2L12 6l-2.5 7.2L4.2 9z"
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "pj-word pj-word-a",
				children: "PUZZLE"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "pj-word pj-word-b",
				children: "JOURNEY"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pj-tag",
				children: "Clear · Relax · Level up"
			})
		]
	});
}
function PalmBadge() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "pj-avatar",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 32 32",
			className: "size-7",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
					id: "dusk",
					x1: "0",
					y1: "0",
					x2: "0",
					y2: "1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "0%",
							stopColor: "#ff9a62"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "55%",
							stopColor: "#7a3a88"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "100%",
							stopColor: "#1a2850"
						})
					]
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "16",
					cy: "16",
					r: "16",
					fill: "url(#dusk)"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "22",
					cy: "10",
					r: "4",
					fill: "#ffe7a8"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M8 24c4-1 8-1 16 0v2H8z",
					fill: "#16301c"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M16 22V12",
					stroke: "#4a2a12",
					strokeWidth: "1.6"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M16 13c-6-1-8-5-8-5 3 1 7 2 8 5z",
					fill: "#1d6a32"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M16 13c6-1 8-5 8-5-3 1-7 2-8 5z",
					fill: "#24823c"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M16 14c-4 3-8 3-8 3 3-1 6-2 8-3z",
					fill: "#185828"
				})
			]
		})
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameShell, {});
}
//#endregion
export { Home as component };
