import { mod, modInverse } from './modmath';

export type Matrix = number[][];

export function isSquare (a: Matrix): boolean
{
	return a.length > 0 && a.every((row) => row.length === a.length);
}

function minor (a: Matrix, row: number, col: number): Matrix
{
	return a.
		filter((_, r) => r !== row).
		map((line) => line.filter((_, c) => c !== col));
}

/** Целочисленный определитель разложением по первой строке (n ≤ 4 — мгновенно). */
export function det (a: Matrix): number
{
	const n = a.length;

	if (n === 1) return a[0]![0]!;
	if (n === 2) return a[0]![0]! * a[1]![1]! - a[0]![1]! * a[1]![0]!;

	let sum = 0;

	for (let c = 0; c < n; c++)
	{
		const sign = c % 2 === 0
			? 1
			: -1;

		sum += sign * a[0]![c]! * det(minor(a, 0, c));
	}

	return sum;
}

/** Матрица алгебраических дополнений. */
export function cofactors (a: Matrix): Matrix
{
	const n = a.length;

	if (n === 1) return [[ 1 ]];

	return a.map((row, r) => row.map((_, c) =>
	{
		const sign = (r + c) % 2 === 0
			? 1
			: -1;

		return sign * det(minor(a, r, c));
	}));
}

export function transpose (a: Matrix): Matrix
{
	return a[0]!.map((_, c) => a.map((row) => row[c]!));
}

export function modMatrix (a: Matrix, m: number): Matrix
{
	return a.map((row) => row.map((v) => mod(v, m)));
}

export interface InverseSteps
{
	det: number;
	detMod: number;
	detInverse: number;

	/** Ã — матрица алгебраических дополнений (ещё не транспонированная). */
	cofactors: Matrix;

	/** Ãᵀ — на неё умножается det⁻¹. */
	adjugate: Matrix;
	inverse: Matrix;
}

/** Обратная матрица по модулю m: A⁻¹ = det⁻¹ · Ãᵀ (mod m), Ã — алгебраические дополнения. */
export function inverseMod (a: Matrix, m: number): InverseSteps | { error: string }
{
	const d = det(a);
	const detMod = mod(d, m);
	const detInverse = modInverse(detMod, m);

	if (detInverse === null)
	{
		return { error: `det A = ${d} ≡ ${detMod} (mod ${m}) не взаимно прост с ${m} — матрица необратима, расшифровать нельзя.` };
	}

	const complements = cofactors(a);
	const adjugate = transpose(complements);
	const inverse = modMatrix(adjugate.map((row) => row.map((v) => v * detInverse)), m);

	return { det: d, detMod, detInverse, cofactors: complements, adjugate, inverse };
}

export interface RowProduct
{

	/** Пары [коэффициент, компонента] для записи вида 0·3 + 3·20 + 3·12. */
	terms: [number, number][];
	sum: number;
	result: number;
}

export interface MatVecResult
{
	result: number[];
	rows: RowProduct[];
}

/** A·x (mod m) с расписанными произведениями для каждой строки. */
export function matVec (a: Matrix, x: number[], m: number): MatVecResult
{
	const rows = a.map((row) =>
	{
		const terms = row.map((coef, i): [number, number] => [ coef, x[i]! ]);
		const sum = terms.reduce((acc, [ coef, value ]) => acc + coef * value, 0);

		return { terms, sum, result: mod(sum, m) };
	});

	return { result: rows.map((r) => r.result), rows };
}

export function addVec (a: number[], b: number[], m: number): number[]
{
	return a.map((v, i) => mod(v + (b[i] ?? 0), m));
}

export function subVec (a: number[], b: number[], m: number): number[]
{
	return a.map((v, i) => mod(v - (b[i] ?? 0), m));
}

/** «0,3,3;11,1,1;1,4,5» → матрица. Разделители строк: «;» или перевод строки. */
export function parseMatrix (text: string): Matrix | null
{
	const rows = text.
		split(/[;\n]/u).
		map((line) => line.trim()).
		filter((line) => line.length > 0).
		map((line) => line.split(/[\s,]+/u).filter((v) => v.length > 0).
			map(Number));

	if (rows.length === 0 || rows.some((row) => row.some((v) => !Number.isInteger(v)))) return null;

	return rows;
}

export function serializeMatrix (a: Matrix): string
{
	return a.map((row) => row.join(',')).join(';');
}

export function parseVector (text: string): number[] | null
{
	const values = text.split(/[\s,;]+/u).filter((v) => v.length > 0).
		map(Number);

	return values.some((v) => !Number.isInteger(v))
		? null
		: values;
}
