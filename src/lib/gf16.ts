import { generate } from './lrs';

/*
 * Поле F16 = Z2[x]/(g(x)), g(α) = 0. Элемент — 4 бита: бит i — коэффициент при αⁱ.
 * Многочлены над Z2 (от x или от α) — тоже битовые маски.
 */

export interface FieldPoly
{
	id: string;
	mask: number;
}

/** Все неприводимые многочлены степени 4 над Z2. */
export const FIELD_POLYS: FieldPoly[] = [
	{ id: '10011', mask: 0b10011 },
	{ id: '11001', mask: 0b11001 },
	{ id: '11111', mask: 0b11111 },
];

export const FIELD_DEGREE = 4;

export function findFieldPoly (id: string): FieldPoly
{
	return FIELD_POLYS.find((item) => item.id === id) ?? FIELD_POLYS[0]!;
}

/** Степени с ненулевым коэффициентом — по убыванию. */
export function exponents (mask: number): number[]
{
	const result: number[] = [];

	for (let i = 31 - Math.clz32(mask); i >= 0; i--)
	{
		if (mask >> i & 1) result.push(i);
	}

	return result;
}

/** Битовая маска → TeX: 0b0110 → \alpha^{2}+\alpha. */
export function maskTex (mask: number, variable = '\\alpha'): string
{
	if (mask === 0) return '0';

	return exponents(mask).map((i) =>
	{
		if (i === 0) return '1';

		return i === 1
			? variable
			: `${variable}^{${i}}`;
	}).
		join('+');
}

/** Произведение многочленов над Z2 без приведения. */
export function rawMul (a: number, b: number): number
{
	let result = 0;

	for (const i of exponents(b)) result ^= a << i;

	return result;
}

/** Приведение по модулю g: старшие степени заменяются через α⁴ = … */
export function reduce (value: number, g: number): number
{
	let result = value;

	for (let i = 31 - Math.clz32(result); i >= FIELD_DEGREE; i = 31 - Math.clz32(result)) result ^= g << i - FIELD_DEGREE;

	return result;
}

export function fieldMul (a: number, b: number, g: number): number
{
	return reduce(rawMul(a, b), g);
}

export function fieldPow (a: number, n: number, g: number): number
{
	let result = 1;

	for (let i = 0; i < n; i++) result = fieldMul(result, a, g);

	return result;
}

/** Значение многочлена (маска коэффициентов) в элементе поля. */
export function evalAt (poly: number, x: number, g: number): number
{
	return exponents(poly).reduce((acc, i) => acc ^ fieldPow(x, i, g), 0);
}

const SUPERSCRIPTS = '⁰¹²³⁴⁵⁶⁷⁸⁹';

/** «a^3+a+1», «α³+α+1», «a3 + a + 1» → маска; степени выше 3 приводятся по g. */
export function parseElement (text: string, g: number): number | null
{
	const source = text.toLowerCase().replace(/\s+/gu, '').
		replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/gu, (ch) => String(SUPERSCRIPTS.indexOf(ch))).
		replace(/[αаx]/gu, 'a');

	if (!source) return null;

	let result = 0;

	for (const term of source.split('+'))
	{
		if (term === '1') result ^= 1;
		else if (term === '0') result ^= 0;
		else
		{
			const match = (/^a\^?(\d{0,2})$/u).exec(term);

			if (!match) return null;

			result ^= fieldPow(0b10, match[1]
				? Number(match[1])
				: 1, g);
		}
	}

	return result;
}

export interface PowerStep
{
	n: number;

	/** Сомножители: βⁿ = left · right. */
	left: number;
	right: number;

	/** Произведение до приведения (степени до α⁶). */
	raw: number;
	result: number;
}

export interface Equation
{

	/** Степень α, при которой собраны коэффициенты. */
	power: number;

	/** Номера c_i, входящих в уравнение. */
	terms: number[];
}

export interface FieldSolution
{
	ok: true;
	g: number;
	beta: number;

	/** α⁴, α⁵, α⁶ через младшие степени. */
	rules: { power: number; value: number }[];

	/** β², β³, β⁴. */
	steps: PowerStep[];

	/** β⁰ … β⁴. */
	powers: number[];
	system: Equation[];

	/** h(x) степени 4 с h(β) = 0 — решение системы при c₄ = 1. */
	h: number;

	/** Минимальный многочлен β: h = minimalᵉ. */
	minimal: number;
	exponent: number;

	/** Порядок β в F16* = ord f(x) — наибольший минимальный период. */
	order: number;

	/** s(n+d) = Σ s(n+i), i ∈ taps. */
	taps: number[];
	init: number[];

	/** Период и ещё d членов — видно, что последовательность повторилась. */
	sequence: number[];
}

export type FieldOutcome = FieldSolution | { ok: false; error: string };

function degreeOf (mask: number): number
{
	return 31 - Math.clz32(mask);
}

/** Минимальный многочлен элемента F16 над Z2 и последовательность с этим характеристическим многочленом. */
export function solveField (g: number, beta: number): FieldOutcome
{
	if (beta === 0) return { ok: false, error: 'β = 0: минимальный многочлен x, последовательность нулевая.' };

	const square = fieldMul(beta, beta, g);
	const steps: PowerStep[] = [
		{ n: 2, left: beta, right: beta, raw: rawMul(beta, beta), result: square },
		{ n: 3, left: square, right: beta, raw: rawMul(square, beta), result: fieldMul(square, beta, g) },
		{ n: 4, left: square, right: square, raw: rawMul(square, square), result: fieldMul(square, square, g) },
	];
	const powers = [ 1, beta, ...steps.map((step) => step.result) ];

	const system: Equation[] = [];

	for (let power = FIELD_DEGREE - 1; power >= 0; power--)
	{
		const terms = powers.map((_, i) => i).filter((i) => (powers[i]! >> power & 1) === 1);

		if (terms.length > 0) system.push({ power, terms });
	}

	let minimal = 0;

	for (let candidate = 0b10; candidate < 0b100000 && !minimal; candidate++)
	{
		if (evalAt(candidate, beta, g) === 0) minimal = candidate;
	}

	const d = degreeOf(minimal);
	const exponent = FIELD_DEGREE / d;
	let h = 1;

	for (let i = 0; i < exponent; i++) h = rawMul(h, minimal);

	let order = 1;

	while (fieldPow(beta, order, g) !== 1) order++;

	const taps = exponents(minimal ^ 1 << d).reverse();
	const coefs = Array.from({ length: d }, (_, i) => Number(taps.includes(i)));
	const init = Array.from({ length: d }, (_, i) => Number(i === d - 1));

	return {
		ok: true,
		g,
		beta,
		rules: [ 4, 5, 6 ].map((power) => ({ power, value: reduce(1 << power, g) })),
		steps,
		powers,
		system,
		h,
		minimal,
		exponent,
		order,
		taps,
		init,
		sequence: generate(coefs, init, 2, order + d),
	};
}
