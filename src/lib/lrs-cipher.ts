import {
	type Periodicity,
	generate,
	periodicity,
} from './lrs';
import type { Matrix } from './matrix';
import { mod } from './modmath';
import {
	type Factorization,
	type Poly,
	factorize,
	polyEval,
	trim,
} from './poly';

/** Латинский алфавит с дополнительным символом «+»: 27 = 3³ символов, номер — три троичные цифры. */
export const TERNARY_SYMBOLS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ+';
export const TERNARY_BASE = 3;
export const TERNARY_WIDTH = 3;

export function normalizeTernary (text: string): string
{
	return [ ...text.toUpperCase() ].filter((ch) => TERNARY_SYMBOLS.includes(ch)).join('');
}

/** V (21) → 2, 1, 0. */
export function toDigits (text: string): number[]
{
	return [ ...text ].flatMap((ch) =>
	{
		const index = TERNARY_SYMBOLS.indexOf(ch);

		return [ Math.floor(index / 9), Math.floor(index / 3) % 3, index % 3 ];
	});
}

export function fromDigits (digits: number[]): string
{
	let text = '';

	for (let i = 0; i + TERNARY_WIDTH <= digits.length; i += TERNARY_WIDTH) text += TERNARY_SYMBOLS[digits[i]! * 9 + digits[i + 1]! * 3 + digits[i + 2]!];

	return text;
}

export interface StreamResult
{
	ok: true;
	input: string;
	inDigits: number[];
	key: number[];
	outDigits: number[];
	output: string;
}

export type StreamOutcome = StreamResult | { ok: false; error: string };

/** Ошибка в параметрах регистра или null. */
export function registerError (coefs: number[], init: number[]): string | null
{
	if (coefs.length === 0) return 'Введите коэффициенты соотношения через запятую.';
	if (coefs.length > 6) return 'Порядок соотношения больше 6 — слишком долго расписывать.';
	if (coefs.some((v) => !Number.isInteger(v) || v < 0 || v >= TERNARY_BASE)) return 'Коэффициенты соотношения — числа 0, 1, 2.';
	if (init.length !== coefs.length) return `Начальных условий должно быть ${coefs.length} — по порядку соотношения.`;
	if (init.some((v) => !Number.isInteger(v) || v < 0 || v >= TERNARY_BASE)) return 'Начальные условия — числа 0, 1, 2.';

	return null;
}

function stream (text: string, coefs: number[], init: number[], sign: 1 | -1): StreamOutcome
{
	const error = registerError(coefs, init);

	if (error) return { ok: false, error };

	const input = normalizeTernary(text);

	if (!input) return { ok: false, error: 'В тексте нет букв латинского алфавита и символа «+».' };

	const inDigits = toDigits(input);
	const key = generate(coefs, init, TERNARY_BASE, inDigits.length);
	const outDigits = inDigits.map((v, i) => mod(v + sign * key[i]!, TERNARY_BASE));

	return { ok: true, input, inDigits, key, outDigits, output: fromDigits(outDigits) };
}

/** y = x + s по троичным цифрам. */
export function streamEncrypt (text: string, coefs: number[], init: number[]): StreamOutcome
{
	return stream(text, coefs, init, 1);
}

/** x = y − s. */
export function streamDecrypt (text: string, coefs: number[], init: number[]): StreamOutcome
{
	return stream(text, coefs, init, -1);
}

export function matMul (a: Matrix, b: Matrix, p: number): Matrix
{
	return a.map((row) => b[0]!.map((_, c) => mod(row.reduce((acc, v, i) => acc + v * b[i]![c]!, 0), p)));
}

export function isIdentity (a: Matrix): boolean
{
	return a.every((row, r) => row.every((v, c) => v === (r === c
		? 1
		: 0)));
}

/** Ассоциированная матрица: единицы под диагональю, последний столбец — коэффициенты a₀ … a_{k−1}. */
export function companion (coefs: number[]): Matrix
{
	const k = coefs.length;

	return coefs.map((coef, r) => Array.from({ length: k }, (_, c) =>
	{
		if (c === k - 1) return coef;

		return c === r - 1
			? 1
			: 0;
	}));
}

export function primeDivisors (n: number): number[]
{
	const result: number[] = [];
	let rest = n;

	for (let d = 2; d * d <= rest; d++)
	{
		if (rest % d !== 0) continue;

		result.push(d);
		while (rest % d === 0) rest /= d;
	}

	if (rest > 1) result.push(rest);

	return result;
}

export function divisors (n: number): number[]
{
	return Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);
}

export interface MatrixPower
{
	n: number;
	matrix: Matrix;
}

/**
 * Степени A, которых хватает для вывода о порядке: Aᴺ = E и A^(N/q) ≠ E для простых q | N.
 * Считаются возведением в квадрат и перемножением уже найденных: A², A⁴, A⁸, A¹², A¹³, A²⁶.
 */
export function orderPowers (a: Matrix, order: number, p: number): MatrixPower[]
{
	const shown = new Map<number, Matrix>([[ 1, a ]]);
	const targets = [ ...primeDivisors(order).map((q) => order / q), order ].filter((t) => t > 1).
		sort((x, y) => x - y);

	for (const target of targets)
	{
		if (shown.has(target)) continue;

		const half = shown.get(target / 2);

		if (half)
		{
			shown.set(target, matMul(half, half, p));
			continue;
		}

		let top = 1;

		while (top * 2 <= target)
		{
			top *= 2;
			if (!shown.has(top)) shown.set(top, matMul(shown.get(top / 2)!, shown.get(top / 2)!, p));
		}

		let reached = top;

		for (let bit = top / 2; bit >= 1; bit /= 2)
		{
			if (target - reached < bit) continue;

			shown.set(reached + bit, matMul(shown.get(reached)!, shown.get(bit)!, p));
			reached += bit;
		}
	}

	return [ ...shown.entries() ].filter(([ n ]) => n > 1).
		sort(([ x ], [ y ]) => x - y).
		map(([ n, matrix ]) => ({ n, matrix }));
}

export interface RegisterAnalysis
{
	ok: true;
	coefs: number[];
	init: number[];
	matrix: Matrix;

	/** Характеристический многочлен f(x) = xᵏ − a_{k−1}x^(k−1) − … − a₀. */
	f: Poly;

	/** f(0), f(1), f(2). */
	values: number[];
	factorization: Factorization;
	irreducible: boolean;

	/** Порядок A (= ord f); 0 — матрица вырождена (a₀ = 0), порядка нет. */
	order: number;
	powers: MatrixPower[];
	orderDivisors: number[];
	periodicity: Periodicity;
}

export type RegisterOutcome = RegisterAnalysis | { ok: false; error: string };

/** Ассоциированная матрица, характеристический многочлен, их порядки и минимальный период. */
export function analyzeRegister (coefs: number[], init: number[]): RegisterOutcome
{
	const error = registerError(coefs, init);

	if (error) return { ok: false, error };

	const p = TERNARY_BASE;
	const matrix = companion(coefs);
	const f = trim([ ...coefs.map((v) => -v), 1 ], p);
	const factorization = factorize(f, p);

	let order = 0;

	if (coefs[0] !== 0)
	{
		let power = matrix;

		for (order = 1; !isIdentity(power); order++) power = matMul(power, matrix, p);
	}

	return {
		ok: true,
		coefs,
		init,
		matrix,
		f,
		values: Array.from({ length: p }, (_, x) => polyEval(f, x, p)),
		factorization,
		irreducible: factorization.factors.length === 1 && factorization.factors[0]!.power === 1,
		order,
		powers: order > 1
			? orderPowers(matrix, order, p)
			: [],
		orderDivisors: order > 0
			? divisors(order)
			: [],
		periodicity: periodicity(coefs, init, p),
	};
}
