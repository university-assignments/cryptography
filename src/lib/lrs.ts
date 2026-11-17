import { type FactorChain, factorChain } from './lrs-chain';
import { mod, modInverse } from './modmath';
import {
	type Factorization,
	type Poly,
	degree,
	factorize,
	polyDivMod,
	polyEqual,
	polyGcd,
	polyMonic,
	polyMul,
	polyScale,
	polyTex,
	trim,
} from './poly';

export function isPrime (n: number): boolean
{
	if (!Number.isInteger(n) || n < 2) return false;

	for (let d = 2; d * d <= n; d++)
	{
		if (n % d === 0) return false;
	}

	return true;
}

/**
 * Линейная рекуррентная последовательность: s(n+k) = coefs[k−1]·s(n+k−1) + … + coefs[0]·s(n).
 * init — первые k членов.
 */
export function generate (coefs: number[], init: number[], p: number, length: number): number[]
{
	const k = coefs.length;
	const s = init.slice(0, k).map((v) => mod(v, p));

	for (let n = 0; s.length < length; n++) s.push(mod(coefs.reduce((acc, c, i) => acc + c * s[n + i]!, 0), p));

	return s.slice(0, length);
}

export interface Periodicity
{

	/** Сколько первых членов не входят в период. */
	preperiod: number;
	period: number;
}

/** Минимальный период последовательности — по повторению состояния регистра. */
export function periodicity (coefs: number[], init: number[], p: number): Periodicity
{
	const k = coefs.length;
	const seen = new Map<string, number>();
	const s = generate(coefs, init, p, k + p ** k + 1);

	for (let n = 0; ; n++)
	{
		const state = s.slice(n, n + k).join(',');
		const first = seen.get(state);

		if (first !== undefined) return { preperiod: first, period: n - first };

		seen.set(state, n);
	}
}

/** Произведение q(x)·S(x): начало — многочлен, дальше коэффициенты повторяются с периодом T. */
export interface SeriesProduct
{
	factor: Poly;

	/** Коэффициенты при x⁰ … x^(d−1), d = deg q. */
	head: number[];

	/** Коэффициенты при x^(Tm+d) … x^(Tm+d+T−1). */
	tail: number[];

	/** Хвост нулевой — произведение является многочленом, q(x) аннулирует последовательность. */
	annihilating: boolean;
}

export function seriesProduct (factor: Poly, period: number[], p: number): SeriesProduct
{
	const t = period.length;
	const d = degree(factor);
	const at = (n: number): number => mod(factor.reduce((acc, c, j) => acc + (n - j >= 0
		? c * period[(n - j) % t]!
		: 0), 0), p);

	const head = Array.from({ length: d }, (_, n) => at(n));
	const tail = Array.from({ length: t }, (_, n) => at(n + d));

	return { factor, head, tail, annihilating: tail.every((v) => v === 0) };
}

/** Проверка множителя; label — множитель в том виде, в каком он записан в разложении. */
export interface LabeledProduct extends SeriesProduct
{
	label: string;
}

export interface MinimalRecurrence
{
	ok: true;
	p: number;
	period: number[];

	/** xᵀ − 1: соотношение s(n+T) = s(n). */
	periodPoly: Poly;

	/** g(x) = 1 − xᵀ — он заведомо аннулирует: g(x)·S(x) — многочлен. */
	g0: Poly;
	factorization: Factorization;

	/** g(x)·S(x) = s₀ + s₁x + … */
	numerator: Poly;

	/** НОД(g(x), g(x)·S(x)). */
	common: Poly;

	/** Разложение g(x) цепочкой, как в тетради: (1 − x³)(1 + x³) = … */
	chain: FactorChain;

	/** Проверки множителей — как в тетради; последняя — аннулирующий. */
	tests: LabeledProduct[];

	/** Аннулирующий наименьшей степени — произведение неприводимых множителей g(x). */
	candidate: Poly;

	/** Неприводимые множители candidate (для подписи произведения). */
	candidateFactors: Factorization;

	/** На что домножить candidate, чтобы g(0) = 1. */
	scale: number;

	/** Минимальный аннулирующий с g(0) = 1. */
	g: Poly;

	/** Характеристический многочлен f(x) = xᵏ·g(1/x). */
	f: Poly;

	/** s(n+k) = coefs[k−1]·s(n+k−1) + … + coefs[0]·s(n). */
	coefs: number[];
	init: number[];
}

export type MinimalResult = MinimalRecurrence | { ok: false; error: string };

const MAX_PERIOD = 24;

/** Минимальное линейное однородное рекуррентное соотношение периодической последовательности над Z_p. */
export function minimalRecurrence (period: number[], p: number): MinimalResult
{
	if (!isPrime(p)) return { ok: false, error: `Модуль ${p} не простой — Z${p} не поле, метод не работает.` };
	if (period.length === 0) return { ok: false, error: 'Введите период последовательности через запятую.' };
	if (period.length > MAX_PERIOD) return { ok: false, error: `Период длиннее ${MAX_PERIOD} — слишком долго расписывать.` };
	if (period.some((v) => !Number.isInteger(v) || v < 0 || v >= p)) return { ok: false, error: `Члены последовательности должны быть числами от 0 до ${p - 1}.` };
	if (period.every((v) => v === 0)) return { ok: false, error: 'Нулевая последовательность: соотношение не требуется.' };

	const t = period.length;
	const periodPoly = trim([ -1, ...Array.from({ length: t - 1 }, () => 0), 1 ], p);
	const g0 = trim([ 1, ...Array.from({ length: t - 1 }, () => 0), -1 ], p);
	const numerator = trim(period, p);
	const common = polyGcd(g0, numerator, p);
	const candidate = polyMonic(polyDivMod(g0, common, p).q, p);
	const factorization = factorize(g0, p);
	const candidateFactors = factorize(candidate, p);

	const chain = factorChain(t, p);
	const tests: LabeledProduct[] = [];
	const found = (): boolean => tests.some((test) => test.annihilating);

	/* Сначала множители последнего звена, затем неразложенные множители предыдущего, затем сам минимальный. */
	for (const { poly, tex } of chain.factors)
	{
		if (found()) break;

		tests.push({ ...seriesProduct(poly, period, p), label: tex });
	}

	for (const { poly, tex } of chain.composite)
	{
		if (found()) break;
		if (degree(poly) > degree(candidate) || tests.some((test) => polyEqual(test.factor, poly))) continue;

		tests.push({ ...seriesProduct(poly, period, p), label: tex });
	}

	if (!found()) tests.push({ ...seriesProduct(candidate, period, p), label: polyTex(candidate) });

	const scale = modInverse(candidate[0]!, p)!;
	const g = polyScale(candidate, scale, p);
	const f = [ ...g ].reverse();
	const k = degree(f);

	return {
		ok: true,
		p,
		period,
		periodPoly,
		g0,
		factorization,
		chain,
		numerator,
		common,
		tests,
		candidate,
		candidateFactors,
		scale,
		g,
		f,
		coefs: f.slice(0, k).map((v) => mod(-v, p)),
		init: period.slice(0, k),
	};
}

/** Проверка: множители действительно дают исходный многочлен. */
export function expand (factorization: Factorization, p: number): Poly
{
	return factorization.factors.reduce<Poly>((acc, { poly, power }) =>
	{
		let result = acc;

		for (let i = 0; i < power; i++) result = polyMul(result, poly, p);

		return result;
	}, [ factorization.unit ]);
}
