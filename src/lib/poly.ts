import { mod, modInverse } from './modmath';

/** Многочлен над Z_p: coefs[i] — коэффициент при xⁱ, старших нулей нет; [] — нулевой. */
export type Poly = number[];

export function trim (a: number[], p: number): Poly
{
	const result = a.map((v) => mod(v, p));

	while (result.length > 0 && result[result.length - 1] === 0) result.pop();

	return result;
}

export function degree (a: Poly): number
{
	return a.length - 1;
}

export function polyAdd (a: Poly, b: Poly, p: number): Poly
{
	const size = Math.max(a.length, b.length);

	return trim(Array.from({ length: size }, (_, i) => (a[i] ?? 0) + (b[i] ?? 0)), p);
}

export function polyScale (a: Poly, factor: number, p: number): Poly
{
	return trim(a.map((v) => v * factor), p);
}

export function polyMul (a: Poly, b: Poly, p: number): Poly
{
	if (a.length === 0 || b.length === 0) return [];

	const result = Array.from({ length: a.length + b.length - 1 }, () => 0);

	a.forEach((x, i) => b.forEach((y, j) =>
	{
		result[i + j] = mod(result[i + j]! + x * y, p);
	}));

	return trim(result, p);
}

/** Деление с остатком; p простое, b ≠ 0. */
export function polyDivMod (a: Poly, b: Poly, p: number): { q: Poly; r: Poly }
{
	const r = [ ...a ];
	const q = Array.from({ length: Math.max(a.length - b.length + 1, 0) }, () => 0);
	const lead = modInverse(b[b.length - 1]!, p)!;

	for (let i = r.length - b.length; i >= 0; i--)
	{
		const factor = mod(r[i + b.length - 1]! * lead, p);

		q[i] = factor;
		b.forEach((v, j) =>
		{
			r[i + j] = mod(r[i + j]! - factor * v, p);
		});
	}

	return { q: trim(q, p), r: trim(r, p) };
}

/** Старший коэффициент → 1. */
export function polyMonic (a: Poly, p: number): Poly
{
	if (a.length === 0) return [];

	return polyScale(a, modInverse(a[a.length - 1]!, p)!, p);
}

/** НОД со старшим коэффициентом 1. */
export function polyGcd (a: Poly, b: Poly, p: number): Poly
{
	let [ x, y ] = [ a, b ];

	while (y.length > 0) [ x, y ] = [ y, polyDivMod(x, y, p).r ];

	return polyMonic(x, p);
}

export function polyEval (a: Poly, x: number, p: number): number
{
	return a.reduceRight((acc, v) => mod(acc * x + v, p), 0);
}

export function polyEqual (a: Poly, b: Poly): boolean
{
	return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** Многочлен в TeX по убыванию степеней: x^{2}+6x+5. */
export function polyTex (a: Poly, variable = 'x'): string
{
	const terms: string[] = [];

	for (let i = a.length - 1; i >= 0; i--)
	{
		const coef = a[i]!;

		if (coef === 0) continue;

		if (i === 0) terms.push(String(coef));
		else
		{
			const power = i === 1
				? variable
				: `${variable}^{${i}}`;

			terms.push(coef === 1
				? power
				: `${coef}${power}`);
		}
	}

	return terms.length > 0
		? terms.join('+')
		: '0';
}

export interface Factor
{

	/** Неприводимый множитель со старшим коэффициентом 1. */
	poly: Poly;
	power: number;
}

export interface Factorization
{

	/** Числовой множитель перед произведением. */
	unit: number;
	factors: Factor[];

	/** false — перебор оборван по лимиту, последний множитель может быть приводим. */
	complete: boolean;
}

const TRIAL_BUDGET = 60_000;

/** Все многочлены степени d со старшим коэффициентом 1 — по возрастанию младших коэффициентов. */
function *monicPolys (d: number, p: number): Generator<Poly>
{
	const total = p ** d;

	for (let n = 0; n < total; n++)
	{
		const coefs: number[] = [];
		let rest = n;

		for (let i = 0; i < d; i++)
		{
			coefs.push(rest % p);
			rest = Math.floor(rest / p);
		}

		yield [ ...coefs, 1 ];
	}
}

/** Разложение на неприводимые пробным делением по возрастанию степени (степени маленькие). */
export function factorize (a: Poly, p: number): Factorization
{
	const factors: Factor[] = [];

	if (a.length === 0) return { unit: 0, factors, complete: true };

	const unit = a[a.length - 1]!;
	let rest = polyMonic(a, p);
	let budget = TRIAL_BUDGET;
	let complete = true;

	for (let d = 1; degree(rest) >= 2 * d && complete; d++)
	{
		for (const candidate of monicPolys(d, p))
		{
			if (degree(rest) < 2 * d) break;

			if (budget-- <= 0)
			{
				complete = false;
				break;
			}

			let power = 0;

			for (let division = polyDivMod(rest, candidate, p); division.r.length === 0; division = polyDivMod(rest, candidate, p))
			{
				rest = division.q;
				power++;
			}

			if (power > 0) factors.push({ poly: candidate, power });
		}
	}

	if (degree(rest) > 0)
	{
		const same = factors.find((item) => polyEqual(item.poly, rest));

		if (same) same.power++;
		else factors.push({ poly: rest, power: 1 });
	}

	factors.sort((x, y) => degree(x.poly) - degree(y.poly));

	return { unit, factors, complete };
}
