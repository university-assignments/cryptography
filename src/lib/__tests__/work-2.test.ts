import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { translatePhrase } from '@/data/translations';
import { parseCoefs, parseList, VARIANTS_2 } from '@/data/work-2/variants';
import { findWork, workKey } from '@/data/works';
import {
	findFieldPoly,
	maskTex,
	parseElement,
	solveField,
} from '../gf16';
import {
	expand,
	generate,
	linearDivisorWitness,
	minimalRecurrence,
	periodProduct,
	seriesProduct,
} from '../lrs';
import {
	analyzeRegister,
	fromDigits,
	streamDecrypt,
	streamEncrypt,
	toDigits,
} from '../lrs-cipher';
import { chainProduct } from '../lrs-chain';
import { groupedPolynomialTex, recurrenceTex } from '../lrs-format';
import {
	polyAdd, polyGcd, polyMul, polyTex, trim,
} from '../poly';

describe('доступ к работе', () =>
{
	it('код доступа — md5 от «work-2»', () =>
	{
		const work = findWork(2)!;

		expect(workKey(work)).toBe('work-2');
		expect(work.access).toBe(createHash('md5').update('work-2').
			digest('hex'));
	});

	it('первая работа открыта всем', () =>
	{
		expect(findWork(1)!.access).toBeUndefined();
	});
});

/* Ответы части 1 — из тетрадей всех шести вариантов. */
const MINIMAL: Record<number, { f: string; recurrence: string; init: number[] }> = {
	1: { f: 'x^{2}+6x+5', recurrence: 's_{n+2}=s_{n+1}+2s_{n}', init: [ 0, 2 ] },
	2: { f: 'x^{2}+10x+1', recurrence: 's_{n+2}=s_{n+1}+10s_{n}', init: [ 2, 9 ] },
	3: { f: 'x^{2}+4x+3', recurrence: 's_{n+2}=3s_{n+1}+4s_{n}', init: [ 2, 3 ] },
	4: { f: 'x+2', recurrence: 's_{n+1}=5s_{n}', init: [ 3 ] },
	5: { f: 'x^{2}+4x+1', recurrence: 's_{n+2}=s_{n+1}+4s_{n}', init: [ 1, 2 ] },
	6: { f: 'x^{2}+2x+1', recurrence: 's_{n+2}=s_{n+1}+2s_{n}', init: [ 0, 1 ] },
};

describe.each(VARIANTS_2.map((v) => [ v.id, v ] as const))('часть 1, вариант %i: минимальное соотношение', (id, v) =>
{
	const period = parseList(v.minimal.period);
	const result = minimalRecurrence(period, v.minimal.p);

	it('ответ как в тетради', () =>
	{
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(polyTex(result.f)).toBe(MINIMAL[id]!.f);
		expect(recurrenceTex(result.coefs)).toBe(MINIMAL[id]!.recurrence);
		expect(result.init).toEqual(MINIMAL[id]!.init);
	});

	it('соотношение порождает исходную последовательность', () =>
	{
		if (!result.ok) return;

		expect(generate(result.coefs, result.init, v.minimal.p, 18)).toEqual([ ...period, ...period, ...period ]);
	});

	it('сокращение даёт взаимно простые числитель и знаменатель, минимальный делитель аннулирует ряд', () =>
	{
		if (!result.ok) return;

		const { p, common, reducedNumerator, reducedDenominator } = result;

		expect(expand(result.factorization, p)).toEqual(result.g0);
		expect(polyMul(reducedNumerator, common, p)).toEqual(result.numerator);
		expect(polyMul(reducedDenominator, common, p)).toEqual(result.g0);
		expect(polyGcd(reducedNumerator, reducedDenominator, p)).toEqual([ 1 ]);
		const series = seriesProduct(result.candidate, period, p);
		const { first, carry } = periodProduct(result);

		expect(series.annihilating).toBe(true);
		expect(polyAdd(first, carry, p)).toEqual([]);
		expect(trim(first, p)).toEqual(trim(series.head, p));
	});

	it('многочлена меньшей степени, аннулирующего последовательность, нет', () =>
	{
		if (!result.ok) return;

		const p = v.minimal.p;
		const k = result.f.length - 1;

		for (let n = 0; n < p ** (k - 1); n++)
		{
			const lower = Array.from({ length: k - 1 }, (_, i) => Math.floor(n / p ** i) % p);

			expect(seriesProduct([ ...lower, 1 ], period, p).annihilating).toBe(false);
		}
	});
});

describe('часть 1: проверка линейного делителя и кратности в сокращённом знаменателе', () =>
{
	it('первый вариант и пример из практики дают разные соотношения и ненулевые коэффициенты при любом a', () =>
	{
		const first = minimalRecurrence([ 0, 2, 2, 6, 3, 1 ], 7);
		const practice = minimalRecurrence([ 1, 0, 1, 2, 5, 5 ], 7);

		if (!first.ok || !practice.ok) throw new Error('Ожидались два корректных периода');

		expect(linearDivisorWitness(first)).toEqual({ index: 1, current: 2, previous: 0, difference: 2 });
		expect(linearDivisorWitness(practice)).toEqual({ index: 1, current: 0, previous: 1, difference: 6 });
		expect(polyTex(practice.candidate)).toBe('x^{2}+2x+6');
		expect(polyTex(practice.f)).toBe('x^{2}+5x+6');
		expect(recurrenceTex(practice.coefs)).toBe('s_{n+2}=2s_{n+1}+s_{n}');
	});

	it('для периода без нулей проверяет 1−x, а при порядке 1 лишняя проверка не нужна', () =>
	{
		const second = minimalRecurrence([ 2, 9, 7, 9, 2, 4 ], 11);
		const fourth = minimalRecurrence([ 3, 1, 5, 4, 6, 2 ], 7);

		if (!second.ok || !fourth.ok) throw new Error('Ожидались два корректных периода');

		expect(linearDivisorWitness(second)).toEqual({ index: 0, current: 2, previous: 4, difference: 9 });
		expect(seriesProduct([ 1, 10 ], second.period, second.p).tail.at(-1)).toBe(9);
		expect(linearDivisorWitness(fourth)).toBeNull();
	});

	it.each([
		{ period: [ 0, 1, 1, 0, 2, 2 ], p: 3, power: 2, insufficient: [ 1, 1 ] },
		{ period: [ 1, 0, 0, 0 ], p: 2, power: 4, insufficient: [ 1, 1, 1, 1 ] },
	])('над Z$p множитель x+1 нужен в степени $power', ({ period, p, power, insufficient }) =>
	{
		const result = minimalRecurrence(period, p);

		if (!result.ok) throw new Error(result.error);

		expect(result.candidateFactors.factors).toEqual([{ poly: [ 1, 1 ], power }]);
		expect(seriesProduct(result.candidate, period, p).annihilating).toBe(true);
		expect(seriesProduct(insufficient, period, p).annihilating).toBe(false);
		expect(generate(result.coefs, result.init, p, period.length * 2)).toEqual([ ...period, ...period ]);
	});
});

describe('часть 1: раскрытое умножение производящего ряда', () =>
{
	it('в варианте 1 сдвиги дают 6x + x⁷, а в соседних блоках складываются 6 и 1', () =>
	{
		const result = minimalRecurrence([ 0, 2, 2, 6, 3, 1 ], 7);

		if (!result.ok) throw new Error(result.error);

		const { shifts, product, first, carry } = periodProduct(result);

		expect(shifts).toEqual([
			{ factor: [ 0, 0, 1 ], product: [ 0, 0, 0, 2, 2, 6, 3, 1 ] },
			{ factor: [ 0, 4 ], product: [ 0, 0, 1, 1, 3, 5, 4 ] },
			{ factor: [ 3 ], product: [ 0, 6, 6, 4, 2, 3 ] },
		]);
		expect(polyTex(product)).toBe('x^{7}+6x');
		expect(groupedPolynomialTex(first.map((c, i) => [ c, carry[i] ?? 0 ]))).toBe('\\left(6+1\\right)x');
	});

	it('нулевой ряд аннулируется единицей и имеет порядок 0', () =>
	{
		const result = minimalRecurrence([ 0, 0, 0 ], 7);

		if (!result.ok) throw new Error(result.error);

		expect(result.numerator).toEqual([]);
		expect(result.candidate).toEqual([ 1 ]);
		expect(periodProduct(result).product).toEqual([]);
		expect(result.coefs).toEqual([]);
		expect(generate(result.coefs, result.init, result.p, 3)).toEqual([ 0, 0, 0 ]);
	});
});

/* Ответы части 2, задание 1. Расхождения с тетрадью — в комментариях. */
const STREAM: Record<number, { encrypt: string; decrypt: string; f: string; order: number; period: number; irreducible: boolean }> = {

	/* В тетради а) пропущена буква (VIVEREST…), в) ошибка в шестой тройке (DIVIDIETIMPERA). */
	1: { encrypt: 'WKYIXNRKUNRBOBNGF', decrypt: 'DIVIDEETIMPERA', f: 'x^{3}+2x^{2}+2', order: 8, period: 8, irreducible: false },
	2: { encrypt: 'TDXHIBTRHCDCIBMSBMYD', decrypt: 'SIVISAMARIAMR', f: 'x^{3}+x+2', order: 8, period: 8, irreducible: false },

	/* В тетради тринадцатая буква исправлена на C (LUCET); по листу выходит I. */
	3: { encrypt: 'WUBGRVATHNT+YFFVONI', decrypt: 'SOLOMNIBUSLUIET', f: 'x^{3}+x^{2}+2', order: 13, period: 13, irreducible: true },
	4: { encrypt: 'WBDEKHJFXVQXEKJCFS', decrypt: 'DOCENDODISCIMUS', f: 'x^{3}+2x+1', order: 26, period: 26, irreducible: true },
	5: { encrypt: 'WASENPYUIQYAQJVU', decrypt: 'FESTINALENTEAAA', f: 'x^{3}+2x+2', order: 13, period: 13, irreducible: true },
	6: { encrypt: 'TLQUAFFWBQ+OYCZJ+CDK', decrypt: 'DICTUMESTFACTUM', f: 'x^{3}+2x^{2}+1', order: 26, period: 26, irreducible: true },
};

describe.each(VARIANTS_2.map((v) => [ v.id, v ] as const))('часть 2, вариант %i: шифр на ЛРП', (id, v) =>
{
	const coefs = parseCoefs(v.stream.coefs);
	const init = parseList(v.stream.init);
	const expected = STREAM[id]!;

	it('шифрование и расшифрование', () =>
	{
		const encrypted = streamEncrypt(v.stream.encrypt, coefs, init);
		const decrypted = streamDecrypt(v.stream.decrypt, coefs, init);

		expect(encrypted.ok && encrypted.output).toBe(expected.encrypt);
		expect(decrypted.ok && decrypted.output).toBe(expected.decrypt);
		expect(translatePhrase(expected.decrypt)).toBeTruthy();
	});

	it('расшифрование обратно шифрованию', () =>
	{
		const back = streamDecrypt(expected.encrypt, coefs, init);

		expect(back.ok && back.output).toBe(v.stream.encrypt);
	});

	it('матрица, многочлен, порядки и период', () =>
	{
		const result = analyzeRegister(coefs, init);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(polyTex(result.f)).toBe(expected.f);
		expect(result.order).toBe(expected.order);
		expect(result.periodicity).toEqual({ preperiod: 0, period: expected.period });
		expect(result.irreducible).toBe(expected.irreducible);
		expect(result.powers[result.powers.length - 1]!.n).toBe(expected.order);
	});
});

describe('троичная запись букв', () =>
{
	it('V = 21 → 2,1,0; «+» = 26 → 2,2,2', () =>
	{
		expect(toDigits('V+A')).toEqual([ 2, 1, 0, 2, 2, 2, 0, 0, 0 ]);
		expect(fromDigits([ 2, 1, 0, 2, 2, 2, 0, 0, 0 ])).toBe('V+A');
	});

	it('степени матрицы варианта 4 — как в тетради, кроме A⁴ и A⁸ (там ошибка)', () =>
	{
		const result = analyzeRegister([ 2, 1, 0 ], [ 0, 0, 1 ]);

		expect(result.ok && result.powers.map((item) => item.n)).toEqual([ 2, 4, 8, 12, 13, 26 ]);
		expect(result.ok && result.powers[3]!.matrix).toEqual([[ 2, 2, 0 ], [ 0, 0, 2 ], [ 1, 0, 0 ]]);
		expect(result.ok && result.powers[4]!.matrix).toEqual([[ 2, 0, 0 ], [ 0, 2, 0 ], [ 0, 0, 2 ]]);
	});
});

/* Ответы части 2, задание 2. В6 в тетради неверен (ошибка в β³): там x⁴+x+1. */
const FIELD: Record<number, { powers: string[]; h: string; f: string; recurrence: string; order: number }> = {
	1: { powers: [ '\\alpha^{2}+\\alpha+1', '1', '\\alpha^{2}+\\alpha' ], h: 'x^{4}+x^{2}+1', f: 'x^{2}+x+1', recurrence: 's_{n+2}=s_{n+1}+s_{n}', order: 3 },
	2: { powers: [ '\\alpha^{3}+\\alpha^{2}', '\\alpha^{3}+\\alpha^{2}+\\alpha+1', '\\alpha^{2}+\\alpha' ], h: 'x^{4}+x+1', f: 'x^{4}+x+1', recurrence: 's_{n+4}=s_{n+1}+s_{n}', order: 15 },
	3: { powers: [ '\\alpha^{3}+1', '\\alpha^{3}+\\alpha^{2}', '\\alpha^{3}+\\alpha^{2}+1' ], h: 'x^{4}+x^{3}+1', f: 'x^{4}+x^{3}+1', recurrence: 's_{n+4}=s_{n+3}+s_{n}', order: 15 },
	4: { powers: [ '\\alpha', '\\alpha^{3}+\\alpha', '\\alpha^{2}' ], h: 'x^{4}+x+1', f: 'x^{4}+x+1', recurrence: 's_{n+4}=s_{n+1}+s_{n}', order: 15 },
	5: { powers: [ '\\alpha^{3}+\\alpha^{2}+\\alpha', '\\alpha+1', '\\alpha' ], h: 'x^{4}+x^{3}+1', f: 'x^{4}+x^{3}+1', recurrence: 's_{n+4}=s_{n+3}+s_{n}', order: 15 },
	6: { powers: [ '\\alpha^{3}+1', '\\alpha^{3}+\\alpha^{2}', '\\alpha^{3}+\\alpha^{2}+1' ], h: 'x^{4}+x^{3}+1', f: 'x^{4}+x^{3}+1', recurrence: 's_{n+4}=s_{n+3}+s_{n}', order: 15 },
};

describe.each(VARIANTS_2.map((v) => [ v.id, v ] as const))('часть 2, вариант %i: минимальный многочлен в F16', (id, v) =>
{
	const g = findFieldPoly(v.field.g).mask;
	const result = solveField(g, parseElement(v.field.beta, g)!);
	const expected = FIELD[id]!;

	it('степени β, h(x), f(x) и соотношение', () =>
	{
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.steps.map((step) => maskTex(step.result))).toEqual(expected.powers);
		expect(maskTex(result.h, 'x')).toBe(expected.h);
		expect(maskTex(result.minimal, 'x')).toBe(expected.f);
		expect(result.order).toBe(expected.order);

		const coefs = result.init.map((_, i) => Number(result.taps.includes(i)));

		expect(recurrenceTex(coefs)).toBe(expected.recurrence);
	});

	it('последовательность имеет период ord f(x) и не меньше', () =>
	{
		if (!result.ok) return;

		const { sequence, order, init } = result;

		expect(sequence.slice(order)).toEqual(sequence.slice(0, init.length));

		for (let t = 1; t < order; t++) expect(sequence.slice(0, order).every((value, i) => value === sequence[(i + t) % order])).toBe(false);
	});
});

describe('запись элемента поля', () =>
{
	it('a^3+a+1, α³+α+1 и a3+a+1 — одно и то же', () =>
	{
		expect(parseElement('a^3+a+1', 0b10011)).toBe(0b1011);
		expect(parseElement('α³ + α + 1', 0b10011)).toBe(0b1011);
		expect(parseElement('a3+a+1', 0b10011)).toBe(0b1011);
		expect(parseElement('b+1', 0b10011)).toBeNull();
	});
});

/* Разложение 1 − x⁶ — звено за звеном, как записано в тетрадях. */
describe('разложение g(x) цепочкой', () =>
{
	const INTEGER = [ '(1-x^{3})(1+x^{3})', '(1-x)(1+x+x^{2})(1+x)(1-x+x^{2})' ];
	const LAST: Record<number, string> = {
		1: '(1+6x)(x+3)(x+5)(1+x)(x+2)(x+4)',
		2: '(1+10x)(1+x+x^{2})(1+x)(1+10x+x^{2})',
		3: '(1+6x)(x+3)(x+5)(1+x)(x+2)(x+4)',
		4: '(1+6x)(x+3)(x+5)(1+x)(x+2)(x+4)',
		5: '(1+4x)(1+x+x^{2})(1+x)(1+4x+x^{2})',
		6: '(1+2x)(x+2)^{2}(x+1)^{3}',
	};

	it.each(VARIANTS_2.map((v) => [ v.id, v ] as const))('вариант %i', (id, v) =>
	{
		const result = minimalRecurrence(parseList(v.minimal.period), v.minimal.p);

		expect(result.ok && result.chain.stages).toEqual([ ...INTEGER, LAST[id] ]);
		expect(result.ok && chainProduct(result.chain, v.minimal.p)).toEqual(result.ok && result.g0);
	});
});
