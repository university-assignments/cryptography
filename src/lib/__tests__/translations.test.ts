import { describe, expect, it } from 'vitest';
import { translatePhrase, translateWord } from '@/data/translations';
import { VARIANTS } from '@/data/work-1/variants';
import { ALPHABETS } from '../alphabet';
import { caesarTable } from '../caesar';
import { hillDecrypt } from '../hill';
import {
	applyRoute,
	parseGrid,
	prepareRouteText,
	ROUTE_MODES,
	solve,
} from '../magic-square';
import { playfairDecrypt } from '../playfair';
import { autokeyDecrypt } from '../vigenere';

const lat = ALPHABETS.lat;

describe.each(VARIANTS.map((v) => [ v.id, v ] as const))('вариант %i: перевод ответа находится', (_, v) =>
{
	it('Хилл', () =>
	{
		const result = hillDecrypt(v.hill.decrypt, { a: v.hill.a, b: v.hill.b, alphabet: lat, pad: v.hill.pad });

		expect(result.ok && translatePhrase(result.text)).toBeTruthy();
	});

	it('квадрат: находится один осмысленный текст (в В4 он выходит двумя способами обхода)', () =>
	{
		const { blocks } = prepareRouteText(v.square.decrypt, 4, v.square.pad);
		const outputs = solve(parseGrid(v.square.grid, 4)!).solutions.flatMap((square) => ROUTE_MODES.map((mode) => applyRoute(blocks, square, mode.id).output));

		const readable = outputs.filter((output) => translatePhrase(output));

		expect(readable.length).toBeGreaterThan(0);
		expect(new Set(readable).size).toBe(1);
	});

	it('Виженер', () =>
	{
		const result = autokeyDecrypt(v.vigenere.decrypt, v.vigenere.key, lat, 'plain');

		expect(result.ok && translatePhrase(result.text)).toBeTruthy();
	});

	it('Цезарь: ровно одна строка', () =>
	{
		const table = caesarTable(v.caesar.cipher, lat);

		expect(table.ok && table.rows.filter((row) => translateWord(row.text))).toHaveLength(1);
	});

	it('Плейфер', () =>
	{
		const result = playfairDecrypt(v.playfair.decrypt, v.playfair.key, lat);

		expect(result.ok && translatePhrase(result.result)).toBeTruthy();
	});
});
