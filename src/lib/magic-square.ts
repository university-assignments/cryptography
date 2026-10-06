import { sub } from './format';

export type Cell = number | null;
export type Grid = Cell[][];
export type Square = number[][];
export type Pos = [number, number];

export interface Line
{
	name: string;
	cells: Pos[];
}

export function magicSum (n: number): number
{
	return n * (n * n + 1) / 2;
}

export function lines (n: number): Line[]
{
	const result: Line[] = [];
	const range = [ ...Array(n).keys() ];

	for (const r of range) result.push({ name: `строка ${r + 1}`, cells: range.map((c): Pos => [ r, c ]) });
	for (const c of range) result.push({ name: `столбец ${c + 1}`, cells: range.map((r): Pos => [ r, c ]) });

	result.push({ name: 'главная диагональ', cells: range.map((i): Pos => [ i, i ]) });
	result.push({ name: 'побочная диагональ', cells: range.map((i): Pos => [ i, n - 1 - i ]) });

	return result;
}

export function emptyGrid (n: number): Grid
{
	return Array.from({ length: n }, () => Array<Cell>(n).fill(null));
}

export function cellName (pos: Pos): string
{
	return `a${sub(pos[0] + 1)}${sub(pos[1] + 1)}`;
}

/** «12,6,.,.;13,3,.,.» → сетка; пустые клетки: «.», «_», «-» или пусто. */
export function parseGrid (text: string, n: number): Grid | null
{
	const rows = text.
		split(/[;\n]/u).
		map((line) => line.trim()).
		filter((line) => line.length > 0);

	if (rows.length !== n) return null;

	const grid: Grid = [];

	for (const row of rows)
	{
		const parts = row.split(/[\s,]+/u).filter((v) => v.length > 0);

		if (parts.length !== n) return null;

		grid.push(parts.map((part) =>
		{
			if ([ '.', '_', '-', '?' ].includes(part)) return null;

			const value = Number(part);

			return Number.isInteger(value)
				? value
				: NaN;
		}));

		if (grid.at(-1)!.some((v) => v !== null && Number.isNaN(v))) return null;
	}

	return grid;
}

export function serializeGrid (grid: Grid): string
{
	const cell = (v: Cell): string =>
	{
		if (v === null) return '.';

		return String(v);
	};

	return grid.map((row) => row.map(cell).join(',')).join(';');
}

export interface SingleStep
{
	line: Line;
	cell: Pos;
	value: number;

	/** Известные слагаемые линии в момент вывода. */
	known: number[];
}

export interface PairEquation
{
	line: Line;
	cells: [Pos, Pos];
	target: number;
	candidates: [number, number][];
}

export interface Analysis
{
	n: number;
	sum: number;

	/** Сетка после вывода однозначных клеток. */
	grid: Grid;
	singles: SingleStep[];
	pairs: PairEquation[];
	available: number[];
	error?: string;
}

function knownSum (grid: Grid, line: Line): { known: number[]; unknown: Pos[] }
{
	const known: number[] = [];
	const unknown: Pos[] = [];

	for (const pos of line.cells)
	{
		const value = grid[pos[0]]![pos[1]]!;

		if (value === null) unknown.push(pos);
		else known.push(value);
	}

	return { known, unknown };
}

function availableNumbers (grid: Grid, n: number): number[]
{
	const used = new Set(grid.flat().filter((v): v is number => v !== null));

	return [ ...Array(n * n).keys() ].map((i) => i + 1).filter((v) => !used.has(v));
}

/** Как в тетради: сначала клетки, которые определяются однозначно, затем уравнения для пар. */
export function analyze (input: Grid): Analysis
{
	const n = input.length;
	const sum = magicSum(n);
	const grid: Grid = input.map((row) => [ ...row ]);
	const allLines = lines(n);
	const singles: SingleStep[] = [];
	const givens = grid.flat().filter((v): v is number => v !== null);

	if (givens.some((v) => v < 1 || v > n * n)) return { n, sum, grid, singles, pairs: [], available: [], error: `Значения должны быть от 1 до ${n * n}.` };
	if (new Set(givens).size !== givens.length) return { n, sum, grid, singles, pairs: [], available: [], error: 'Значения в квадрате не должны повторяться.' };

	let changed = true;

	while (changed)
	{
		changed = false;

		for (const line of allLines)
		{
			const { known, unknown } = knownSum(grid, line);

			if (unknown.length !== 1) continue;

			const value = sum - known.reduce((acc, v) => acc + v, 0);
			const [ cell ] = unknown;

			if (value < 1 || value > n * n || !availableNumbers(grid, n).includes(value))
			{
				return { n, sum, grid, singles, pairs: [], available: availableNumbers(grid, n), error: `${line.name}: ${cellName(cell!)} = ${value} — невозможно, квадрат с такими значениями не существует.` };
			}

			grid[cell![0]]![cell![1]] = value;
			singles.push({ line, cell: cell!, value, known });
			changed = true;
		}
	}

	const available = availableNumbers(grid, n);
	const pairs: PairEquation[] = [];

	for (const line of allLines)
	{
		const { known, unknown } = knownSum(grid, line);

		if (unknown.length !== 2) continue;

		const target = sum - known.reduce((acc, v) => acc + v, 0);
		const candidates: [number, number][] = [];

		for (const p of available)
		{
			const q = target - p;

			if (q > p && available.includes(q)) candidates.push([ p, q ]);
		}

		pairs.push({ line, cells: [ unknown[0]!, unknown[1]! ], target, candidates });
	}

	return { n, sum, grid, singles, pairs, available };
}

export const MAX_UNKNOWN = 12;

/** Все достройки квадрата: перебор только по неизвестным клеткам с отсечением по суммам линий. */
export function solve (input: Grid): { solutions: Square[]; error?: string }
{
	const analysis = analyze(input);

	if (analysis.error) return { solutions: [], error: analysis.error };

	const { n, sum, grid } = analysis;
	const unknown: Pos[] = [];

	grid.forEach((row, r) => row.forEach((value, c) =>
	{
		if (value === null) unknown.push([ r, c ]);
	}));

	if (unknown.length > MAX_UNKNOWN) return { solutions: [], error: `Неизвестных клеток ${unknown.length} — слишком много для перебора (максимум ${MAX_UNKNOWN}).` };

	const allLines = lines(n);
	const linesByCell = new Map<string, Line[]>();

	for (const line of allLines)
	{
		for (const pos of line.cells)
		{
			const key = pos.join(',');

			linesByCell.set(key, [ ...linesByCell.get(key) ?? [], line ]);
		}
	}

	const available = new Set(analysis.available);
	const solutions: Square[] = [];

	const fits = (pos: Pos): boolean =>
	{
		for (const line of linesByCell.get(pos.join(','))!)
		{
			const { known, unknown: rest } = knownSum(grid, line);
			const partial = known.reduce((acc, v) => acc + v, 0);

			if (rest.length === 0 && partial !== sum) return false;
			if (rest.length > 0 && partial >= sum) return false;
		}

		return true;
	};

	const step = (index: number): void =>
	{
		if (index === unknown.length)
		{
			solutions.push(grid.map((row) => row.map((v) => v!)));

			return;
		}

		const pos = unknown[index]!;

		/* Снимок: множество меняется внутри цикла. */
		const candidates = [ ...available ];

		for (const value of candidates)
		{
			grid[pos[0]]![pos[1]] = value;
			available.delete(value);

			if (fits(pos)) step(index + 1);

			available.add(value);
			grid[pos[0]]![pos[1]] = null;
		}
	};

	step(0);

	return { solutions };
}

export type RouteMode = 'rows-numbers' | 'cols-numbers' | 'numbers-rows' | 'numbers-cols';

export const ROUTE_MODES: { id: RouteMode; label: string; short: string }[] = [
	{ id: 'rows-numbers', label: 'текст записываем в квадрат по строкам, читаем по номерам клеток', short: 'по строкам → по номерам' },
	{ id: 'cols-numbers', label: 'текст записываем в квадрат по столбцам, читаем по номерам клеток', short: 'по столбцам → по номерам' },
	{ id: 'numbers-rows', label: 'k-ю букву ставим в клетку с номером k, читаем по строкам', short: 'по номерам → по строкам' },
	{ id: 'numbers-cols', label: 'k-ю букву ставим в клетку с номером k, читаем по столбцам', short: 'по номерам → по столбцам' },
];

/** Перестановка маршрута: output[i] = text[perm[i]] (индексы с нуля). */
export function routePermutation (square: Square, mode: RouteMode): number[]
{
	const n = square.length;
	const size = n * n;
	const perm = Array<number>(size).fill(0);
	const rowMajor = (r: number, c: number): number => r * n + c;
	const colMajor = (r: number, c: number): number => c * n + r;

	square.forEach((row, r) => row.forEach((k, c) =>
	{
		switch (mode)
		{
			case 'rows-numbers':
				perm[k - 1] = rowMajor(r, c);
				break;
			case 'cols-numbers':
				perm[k - 1] = colMajor(r, c);
				break;
			case 'numbers-rows':
				perm[rowMajor(r, c)] = k - 1;
				break;
			case 'numbers-cols':
				perm[colMajor(r, c)] = k - 1;
				break;
		}
	}));

	return perm;
}

export function invertPermutation (perm: number[]): number[]
{
	const inverse = Array<number>(perm.length).fill(0);

	perm.forEach((source, target) =>
	{
		inverse[source] = target;
	});

	return inverse;
}

/** Текст без пробелов, верхний регистр, добивка до блоков по n² символов. */
export function prepareRouteText (text: string, n: number, pad: string): { blocks: string[]; padCount: number; error?: string }
{
	const clean = text.replace(/\s+/gu, '').toUpperCase();
	const size = n * n;

	if (clean.length === 0) return { blocks: [], padCount: 0, error: 'Введите текст.' };

	const padCount = (size - clean.length % size) % size;
	const padChar = [ ...pad.toUpperCase() ][0] ?? '';

	if (padCount > 0 && padChar.length === 0) return { blocks: [], padCount, error: 'Укажите символ добивки.' };

	const padded = clean + padChar.repeat(padCount);
	const chars = [ ...padded ];
	const blocks: string[] = [];

	for (let i = 0; i < chars.length; i += size) blocks.push(chars.slice(i, i + size).join(''));

	return { blocks, padCount };
}

export interface RouteBlock
{
	input: string;

	/** Квадрат с буквами так, как он записан на бумаге для этого режима. */
	grid: string[][];
	output: string;
}

export interface RouteResult
{
	mode: RouteMode;
	perm: number[];
	blocks: RouteBlock[];
	output: string;
}

/** Применить маршрут к блокам текста (так и шифруют, и «пробуют» расшифровать). */
export function applyRoute (blocks: string[], square: Square, mode: RouteMode): RouteResult
{
	const perm = routePermutation(square, mode);
	const results: RouteBlock[] = blocks.map((block) =>
	{
		const chars = [ ...block ];
		const output = perm.map((source) => chars[source]!).join('');
		const grid = letterGrid(chars, square, mode);

		return { input: block, grid, output };
	});

	return { mode, perm, blocks: results, output: results.map((b) => b.output).join('') };
}

function letterGrid (chars: string[], square: Square, mode: RouteMode): string[][]
{
	const n = square.length;

	return square.map((row, r) => row.map((k, c) =>
	{
		switch (mode)
		{
			case 'rows-numbers':
				return chars[r * n + c]!;
			case 'cols-numbers':
				return chars[c * n + r]!;
			default:
				return chars[k - 1]!;
		}
	}));
}
