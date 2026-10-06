import { describe, expect, it } from 'vitest';
import {
	analyze,
	applyRoute,
	invertPermutation,
	parseGrid,
	prepareRouteText,
	routePermutation,
	solve,
} from '../magic-square';

const grid = (text: string) => parseGrid(text, 4)!;

const V1 = grid('12,6,.,.;13,3,.,.;.,.,.,11;.,.,4,14');
const V1A = [[ 12, 6, 9, 7 ], [ 13, 3, 16, 2 ], [ 8, 10, 5, 11 ], [ 1, 15, 4, 14 ]];
const V1B = [[ 12, 6, 15, 1 ], [ 13, 3, 10, 8 ], [ 2, 16, 5, 11 ], [ 7, 9, 4, 14 ]];

const V2 = grid('.,.,14,4;.,.,11,5;3,13,.,.;.,12,.,.');
const V2A = [[ 15, 1, 14, 4 ], [ 10, 8, 11, 5 ], [ 3, 13, 2, 16 ], [ 6, 12, 7, 9 ]];
const V2B = [[ 9, 7, 14, 4 ], [ 16, 2, 11, 5 ], [ 3, 13, 8, 10 ], [ 6, 12, 1, 15 ]];

const V3 = grid('.,16,2,.;.,3,13,.;15,.,.,1;4,.,.,14');
const V3A = [[ 5, 16, 2, 11 ], [ 10, 3, 13, 8 ], [ 15, 6, 12, 1 ], [ 4, 9, 7, 14 ]];
const V3B = [[ 9, 16, 2, 7 ], [ 6, 3, 13, 12 ], [ 15, 10, 8, 1 ], [ 4, 5, 11, 14 ]];

const V5 = grid('.,.,14,1;.,.,.,8;3,16,.,.;6,9,.,.');
const V5A = [[ 15, 4, 14, 1 ], [ 10, 5, 11, 8 ], [ 3, 16, 2, 13 ], [ 6, 9, 7, 12 ]];
const V5B = [[ 12, 7, 14, 1 ], [ 13, 2, 11, 8 ], [ 3, 16, 5, 10 ], [ 6, 9, 4, 15 ]];

const sorted = (squares: number[][][]) => [ ...squares ].sort((a, b) => a.flat().join(',').
	localeCompare(b.flat().join(',')));

describe('магический квадрат — достройка', () =>
{
	it('однозначные клетки выводятся по диагонали, как в тетради', () =>
	{
		const v1 = analyze(V1);

		expect(v1.singles).toHaveLength(1);
		expect(v1.singles[0]).toMatchObject({ cell: [ 2, 2 ], value: 5 });

		const v5 = analyze(V5);

		expect(v5.singles[0]).toMatchObject({ cell: [ 1, 2 ], value: 11 });
	});

	it('уравнения пар с кандидатами', () =>
	{
		const v3 = analyze(V3);
		const first = v3.pairs.find((p) => p.line.name === 'строка 1');

		expect(first).toMatchObject({ target: 16, candidates: [[ 5, 11 ], [ 6, 10 ], [ 7, 9 ]] });
	});

	it.each([
		[ 'вариант 1', V1, [ V1A, V1B ]],
		[ 'вариант 2', V2, [ V2A, V2B ]],
		[ 'вариант 3', V3, [ V3A, V3B ]],
		[ 'вариант 5', V5, [ V5A, V5B ]],
	])('%s: ровно два решения', (_, input, expected) =>
	{
		expect(sorted(solve(input).solutions)).toEqual(sorted(expected));
	});

	it('противоречивые данные — ошибка', () =>
	{
		expect(solve(grid('1,2,3,4;.,.,.,.;.,.,.,.;.,.,.,.'))).toMatchObject({ solutions: [] });
		expect(solve(grid('1,1,.,.;.,.,.,.;.,.,.,.;.,.,.,.')).error).toBeTruthy();
	});
});

describe('маршрутная перестановка — ответы из тетради', () =>
{
	it('вариант 1, шифрование: четыре способа обхода с первым квадратом', () =>
	{
		const { blocks } = prepareRouteText('КАРАБАС БАРАБАС', 4, 'А');

		expect(blocks).toEqual([ 'КАРАБАСБАРАБАСАА' ]);
		expect(applyRoute(blocks, V1A, 'rows-numbers').output).toBe('АБААААААРРБКБАСС');
		expect(applyRoute(blocks, V1A, 'cols-numbers').output).toBe('АСАБАБАРАСАКААБР');
		expect(applyRoute(blocks, V1A, 'numbers-rows').output).toBe('БААСАРААБРБАКААС');
		expect(applyRoute(blocks, V1A, 'numbers-cols').output).toBe('БАБКАРРАААБАСААС');
	});

	it('вариант 1, расшифрование: осмысленный текст даёт второй квадрат', () =>
	{
		const { blocks } = prepareRouteText('SERSCIIICEMLNHOI', 4, 'A');

		expect(applyRoute(blocks, V1A, 'rows-numbers').output).toBe('NIIOMESCRELSCIHI');
		expect(applyRoute(blocks, V1B, 'rows-numbers').output).toBe('SCIOMENIHILSCIRE');
		expect(applyRoute(blocks, V1A, 'numbers-rows').output).toBe('LICINRIEIECMSOSH');
		expect(applyRoute(blocks, V1B, 'numbers-cols').output).toBe('LNEIIRICOECSSIMH');
	});

	it('варианты 2, 3, 5 — расшифрование', () =>
	{
		expect(applyRoute([ 'CSNETANESCCPEMRE' ], V2B, 'cols-numbers').output).toBe('PANEMETCCRCENSES');
		expect(applyRoute([ 'ITAMOBNIIANLORVC' ], V3B, 'rows-numbers').output).toBe('LABOROMNIAVINCIT');
		expect(applyRoute([ 'LOOADCIUVIDBASTA' ], V5A, 'rows-numbers').output).toBe('ADVOCATUSDIABOLI');
	});

	it('вариант 3, шифрование', () =>
	{
		const { blocks } = prepareRouteText('РУКА РУКУ МОЕТ', 4, 'А');

		expect(applyRoute(blocks, V3A, 'rows-numbers').output).toBe('ТКУАРОАУАРАЕКАМУ');
		expect(applyRoute(blocks, V3A, 'numbers-rows').output).toBe('РАУЕОКАУАУТРАМКА');
	});

	it('обратная перестановка восстанавливает текст', () =>
	{
		const text = 'ОКОЗАОКОЗУБЗАЗУБ';
		const perm = routePermutation(V5A, 'cols-numbers');
		const cipher = applyRoute([ text ], V5A, 'cols-numbers').output;
		const inverse = invertPermutation(perm);
		const chars = [ ...cipher ];

		expect(inverse.map((source) => chars[source]).join('')).toBe(text);
	});

	it('добивка и блоки', () =>
	{
		expect(prepareRouteText('ПЕРВЫЙ БЛИН КОМОМ', 4, 'А')).toMatchObject({ blocks: [ 'ПЕРВЫЙБЛИНКОМОМА' ], padCount: 1 });
		expect(prepareRouteText('SOPMOE!!ORTROAME', 4, 'A')).toMatchObject({ blocks: [ 'SOPMOE!!ORTROAME' ], padCount: 0 });
		expect(prepareRouteText('abcdefghijklmnopq', 4, 'x').blocks).toEqual([ 'ABCDEFGHIJKLMNOP', 'QXXXXXXXXXXXXXXX' ]);
	});
});
