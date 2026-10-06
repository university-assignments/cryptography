import { type Alphabet, normalize } from './alphabet';

export interface PlayfairLayout
{
	rows: number;
	cols: number;

	/** Буква, которую объединяют с соседней, чтобы алфавит уложился в прямоугольник. */
	merged: { from: string; to: string } | null;
}

/** Латиница 5×5 (J → I), русский без Ё 4×8. */
export function playfairLayout (alphabet: Alphabet): PlayfairLayout | null
{
	switch (alphabet.id)
	{
		case 'lat':
			return { rows: 5, cols: 5, merged: { from: 'J', to: 'I' } };
		case 'ru32':
			return { rows: 4, cols: 8, merged: null };
		default:
			return null;
	}
}

export interface PlayfairTable
{
	layout: PlayfairLayout;
	key: string;
	table: string[][];
}

export type PairRule = 'row' | 'col' | 'rect';

export const PAIR_RULE_LABELS: Record<PairRule, string> = {
	row: 'одна строка',
	col: 'один столбец',
	rect: 'прямоугольник',
};

export interface PlayfairPair
{
	input: string;
	output: string;
	rule: PairRule;
}

export interface PlayfairResult
{
	ok: true;
	table: PlayfairTable;
	source: string;
	pairs: PlayfairPair[];
	result: string;
}

export interface Failure
{
	ok: false;
	error: string;
}

function foldText (text: string, alphabet: Alphabet, layout: PlayfairLayout): string
{
	const normalized = normalize(text, alphabet);

	return layout.merged
		? normalized.split(layout.merged.from).join(layout.merged.to)
		: normalized;
}

export function buildTable (keyword: string, alphabet: Alphabet): PlayfairTable | Failure
{
	const layout = playfairLayout(alphabet);

	if (!layout) return { ok: false, error: `Для алфавита «${alphabet.label}» таблица Плейфера не определена — нужен латинский или русский без Ё.` };

	const key = foldText(keyword, alphabet, layout);

	if (key.length === 0) return { ok: false, error: 'Введите ключевое слово.' };

	const letters = [ ...alphabet.letters ].filter((ch) => ch !== layout.merged?.from);
	const order = [ ...new Set([ ...key, ...letters ]) ];
	const table: string[][] = [];

	for (let r = 0; r < layout.rows; r++) table.push(order.slice(r * layout.cols, (r + 1) * layout.cols));

	return { layout, key, table };
}

function locate (table: string[][], ch: string): [number, number]
{
	for (let r = 0; r < table.length; r++)
	{
		const c = table[r]!.indexOf(ch);

		if (c >= 0) return [ r, c ];
	}

	throw new Error(`Буквы ${ch} нет в таблице.`);
}

function transform (table: PlayfairTable, a: string, b: string, direction: 1 | -1): PlayfairPair
{
	const { rows, cols } = table.layout;
	const [ ra, ca ] = locate(table.table, a);
	const [ rb, cb ] = locate(table.table, b);
	const at = (r: number, c: number): string => table.table[(r % rows + rows) % rows]![(c % cols + cols) % cols]!;

	if (ra === rb) return { input: a + b, output: at(ra, ca + direction) + at(rb, cb + direction), rule: 'row' };
	if (ca === cb) return { input: a + b, output: at(ra + direction, ca) + at(rb + direction, cb), rule: 'col' };

	return { input: a + b, output: at(ra, cb) + at(rb, ca), rule: 'rect' };
}

export function playfairDecrypt (text: string, keyword: string, alphabet: Alphabet): PlayfairResult | Failure
{
	const table = buildTable(keyword, alphabet);

	if ('ok' in table) return table;

	const source = foldText(text, alphabet, table.layout);

	if (source.length === 0) return { ok: false, error: 'Введите шифртекст.' };
	if (source.length % 2 !== 0) return { ok: false, error: `Длина шифртекста ${source.length} нечётная — биграммы не складываются.` };

	const pairs: PlayfairPair[] = [];

	for (let i = 0; i < source.length; i += 2) pairs.push(transform(table, source[i]!, source[i + 1]!, -1));

	return { ok: true, table, source, pairs, result: pairs.map((p) => p.output).join('') };
}

export function playfairEncrypt (text: string, keyword: string, alphabet: Alphabet, filler: string): PlayfairResult | Failure
{
	const table = buildTable(keyword, alphabet);

	if ('ok' in table) return table;

	const clean = foldText(text, alphabet, table.layout);
	const fill = foldText(filler, alphabet, table.layout).slice(0, 1);

	if (clean.length === 0) return { ok: false, error: 'Введите открытый текст.' };
	if (fill.length === 0) return { ok: false, error: 'Укажите букву-разделитель из алфавита.' };

	const digraphs: [string, string][] = [];
	let i = 0;

	while (i < clean.length)
	{
		const a = clean[i]!;
		const next = clean[i + 1];

		if (next === undefined || next === a)
		{
			digraphs.push([ a, fill ]);
			i += 1;
		}
		else
		{
			digraphs.push([ a, next ]);
			i += 2;
		}
	}

	const pairs = digraphs.map(([ a, b ]) => transform(table, a, b, 1));

	return { ok: true, table, source: digraphs.map((d) => d.join('')).join(''), pairs, result: pairs.map((p) => p.output).join('') };
}
