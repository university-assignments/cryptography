import { mod } from './modmath';
import {
	type Poly,
	degree,
	factorize,
	polyEqual,
	polyTex,
	trim,
} from './poly';

/*
 * Разложение 1 − xᵀ цепочкой, как в тетради:
 * 1 − x⁶ = (1 − x³)(1 + x³) = (1 − x)(1 + x + x²)(1 + x)(1 − x + x²) = (1 + 6x)(x + 3)(x + 5)(1 + x)(x + 2)(x + 4).
 * Сначала формулы сокращённого умножения над целыми, в конце — разложение каждого множителя по модулю p.
 */

type Kind = 'minus' | 'plus' | 'other';

/** Множитель над целыми: 1 − xᵐ, 1 + xᵐ или дальше не раскладываемый формулами. */
interface Piece
{
	kind: Kind;
	m: number;

	/** Коэффициенты по возрастанию степеней, могут быть отрицательными. */
	coefs: number[];
}

function binomial (m: number, sign: 1 | -1): Piece
{
	return {
		kind: sign === 1
			? 'plus'
			: 'minus',
		m,
		coefs: [ 1, ...Array.from({ length: m - 1 }, () => 0), sign ],
	};
}

/** 1 ± xᵐ + x²ᵐ ± … — неполный квадрат и его обобщение: count слагаемых, шаг степени m. */
function cofactor (m: number, count: number, sign: 1 | -1): Piece
{
	const coefs = Array.from({ length: m * (count - 1) + 1 }, () => 0);

	for (let i = 0; i < count; i++) coefs[i * m] = sign ** i;

	return { kind: 'other', m, coefs };
}

/** Наименьший нечётный простой делитель или 0. */
function oddPrime (m: number): number
{
	for (let d = 3; d <= m; d += 2)
	{
		if (m % d === 0) return d;
	}

	return 0;
}

/** Один шаг: разность квадратов, затем сумма и разность нечётных степеней. */
function split (piece: Piece): Piece[]
{
	const { kind, m } = piece;

	if (kind === 'other' || m === 1) return [ piece ];
	if (kind === 'minus' && m % 2 === 0) return [ binomial(m / 2, -1), binomial(m / 2, 1) ];

	const q = oddPrime(m);

	if (q === 0) return [ piece ];
	if (kind === 'minus') return [ binomial(m / q, -1), cofactor(m / q, q, 1) ];

	return [ binomial(m / q, 1), cofactor(m / q, q, -1) ];
}

/** 1-x^{3}, 1+x+x^{2} — по возрастанию степеней, со знаками. */
function signedTex (coefs: number[]): string
{
	let tex = '';

	coefs.forEach((coef, i) =>
	{
		if (coef === 0) return;

		const size = Math.abs(coef);
		let body = String(size);

		if (i === 1) body = 'x';
		if (i > 1) body = `x^{${i}}`;
		if (i > 0 && size !== 1) body = `${size}${body}`;

		if (coef < 0) tex += `-${body}`;
		else if (tex) tex += `+${body}`;
		else tex += body;
	});

	return tex;
}

export interface ChainFactor
{

	/** Множитель по модулю p — в том виде, в каком записан. */
	poly: Poly;
	power: number;
	tex: string;
}

export interface FactorChain
{

	/** Звенья цепочки в TeX — без исходного 1 − xᵀ. */
	stages: string[];

	/** Множители последнего звена — по ним идёт перебор. */
	factors: ChainFactor[];

	/** Множители предпоследнего звена, которые по модулю p разложились дальше (1 + x + x² = (x+3)(x+5)). */
	composite: ChainFactor[];
}

function productTex (factors: { tex: string; power: number }[]): string
{
	return factors.map(({ tex, power }) =>
	{
		if (power > 1) return `(${tex})^{${power}}`;

		return `(${tex})`;
	}).join('');
}

export function factorChain (t: number, p: number): FactorChain
{
	const stages: string[] = [];
	let pieces: Piece[] = [ binomial(t, -1) ];

	for (;;)
	{
		const next = pieces.flatMap(split);

		if (next.length === pieces.length) break;

		pieces = next;
		stages.push(productTex(pieces.map((piece) => ({ tex: signedTex(piece.coefs), power: 1 }))));
	}

	const factors: ChainFactor[] = [];
	const composite: ChainFactor[] = [];

	const add = (poly: Poly, power: number, tex: string, prefer: boolean): void =>
	{
		const same = factors.find((item) => polyEqual(item.poly, poly));

		if (!same)
		{
			factors.push({ poly, power, tex });

			return;
		}

		same.power += power;
		if (prefer) same.tex = tex;
	};

	for (const piece of pieces)
	{
		const poly = trim(piece.coefs, p);
		const parts = factorize(poly, p).factors;
		const whole = parts.length === 1 && parts[0]!.power === 1;

		if (whole)
		{
			add(poly, 1, signedTex(poly), false);
			continue;
		}

		if (degree(poly) > 1) composite.push({ poly, power: 1, tex: signedTex(poly) });

		for (const part of parts) add(part.poly, part.power, polyTex(part.poly), true);
	}

	const last = productTex(factors);

	if (last !== stages[stages.length - 1]) stages.push(last);

	return { stages, factors, composite };
}

/** То же для приведённого xᵀ − 1 (как в тетради нового подтипа): звенья по убыванию степеней, затем по модулю p. */
export function monicChainStages (t: number, p: number): string[]
{
	const stages: string[] = [];
	let pieces: Piece[] = [ binomial(t, -1) ];
	const descending = (piece: Piece): string =>
	{
		const coefs = piece.kind === 'minus'
			? piece.coefs.map((v) => -v)
			: piece.coefs;
		const terms: string[] = [];

		for (let i = coefs.length - 1; i >= 0; i--)
		{
			const coef = coefs[i]!;

			if (coef === 0) continue;

			const size = Math.abs(coef);
			let body = i === 0
				? String(size)
				: i === 1
					? 'x'
					: `x^{${i}}`;

			if (i > 0 && size !== 1) body = `${size}${body}`;
			terms.push(coef < 0
				? `-${body}`
				: terms.length > 0
					? `+${body}`
					: body);
		}

		return terms.join('');
	};

	for (;;)
	{
		const next = pieces.flatMap(split);

		if (next.length === pieces.length) break;

		pieces = next;
		stages.push(pieces.map((piece) => `(${descending(piece)})`).join(''));
	}

	const reduced = pieces.map((piece) => `(${polyTex(trim(piece.kind === 'minus'
		? piece.coefs.map((v) => -v)
		: piece.coefs, p))})`).join('');

	if (reduced !== stages[stages.length - 1]) stages.push(reduced);

	return stages;
}

/** Проверка: произведение множителей последнего звена равно 1 − xᵀ по модулю p. */
export function chainProduct (chain: FactorChain, p: number): Poly
{
	let result: number[] = [ 1 ];

	for (const { poly, power } of chain.factors)
	{
		for (let i = 0; i < power; i++)
		{
			const next = Array.from({ length: result.length + poly.length - 1 }, () => 0);

			result.forEach((x, a) => poly.forEach((y, b) =>
			{
				next[a + b] = mod(next[a + b]! + x * y, p);
			}));
			result = next;
		}
	}

	return trim(result, p);
}
