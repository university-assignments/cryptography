import { describe, expect, it } from 'vitest';
import { ALPHABETS } from '../alphabet';
import { hillDecrypt, hillEncrypt } from '../hill';
import { inverseMod } from '../matrix';

const lat = ALPHABETS.lat;
const A1 = [[ 0, 3, 3 ], [ 11, 1, 1 ], [ 1, 4, 5 ]];
const A1inv = [[ 11, 19, 0 ], [ 4, 19, 25 ], [ 5, 7, 1 ]];
const A3 = [[ 1, 9, 10 ], [ 3, 6, 9 ], [ 8, 2, 11 ]];
const A3inv = [[ 20, 5, 25 ], [ 13, 7, 25 ], [ 2, 14, 1 ]];
const A4 = A3inv;
const zero = [ 0, 0, 0 ];

describe('шифр Хилла — ответы из тетради', () =>
{
	it('A⁻¹ mod 26 совпадает с тетрадью', () =>
	{
		expect(inverseMod(A1, 26)).toMatchObject({ inverse: A1inv });
		expect(inverseMod(A1inv, 26)).toMatchObject({ inverse: A1 });
		expect(inverseMod(A3, 26)).toMatchObject({ inverse: A3inv });
	});

	it('вариант 1', () =>
	{
		expect(hillEncrypt('DUMSPIROSPERO', { a: A1, b: zero, alphabet: lat, pad: 'A' })).toMatchObject({ padded: 'DUMSPIROSPEROAA', cipher: 'SNNRNOSLHLEMAYO' });
		expect(hillDecrypt('HLSUMCLABAWOMGCSXPLHRMJH', { a: A1, b: zero, alphabet: lat, pad: 'A' })).toMatchObject({ text: 'ALAGUERRECOMMEALAGUERREA' });
	});

	it('вариант 2', () =>
	{
		expect(hillEncrypt('OSANCTASIMPLICITAS', { a: A1inv, b: zero, alphabet: lat, pad: 'X' })).toMatchObject({ padCount: 0, cipher: 'CIOZTUEWEBKUWKKBGJ' });
		expect(hillDecrypt('NNIDICQICBTHZRYFXADOWHZV', { a: A1inv, b: zero, alphabet: lat, pad: 'X' })).toMatchObject({ text: 'LIBERTEEGALITEFRATERNITE' });
	});

	it('вариант 3', () =>
	{
		expect(hillEncrypt('INSAECULASAECULORUM', { a: A3, b: zero, alphabet: lat, pad: 'X' })).toMatchObject({ padded: 'INSAECULASAECULORUMXX', cipher: 'TECEQEPWAGMGGRVDMCHRF' });
		expect(hillDecrypt('TGZDKFJEEADCBYIEDCMXFZBH', { a: A3, b: zero, alphabet: lat, pad: 'X' })).toMatchObject({ text: 'VERBAVOLANTSCRIPTAMANENT' });
	});

	it('вариант 4', () =>
	{
		expect(hillEncrypt('VOXPOPULIVOXDEI', { a: A4, b: zero, alphabet: lat, pad: 'X' })).toMatchObject({ padCount: 0, cipher: 'ZKBRSHFRUZKBUHS' });
		expect(hillDecrypt('ZUDIDQNJUIGMLRWHNRYKC', { a: A4, b: zero, alphabet: lat, pad: 'X' })).toMatchObject({ text: 'BONNEMINEAMAUVAISJEUA' });
	});

	it('вариант 5', () =>
	{
		expect(hillEncrypt('CORRUPTIOOPTIMIPESSIMA', { a: A1, b: zero, alphabet: lat, pad: 'X' })).toMatchObject({ cipher: 'PBNBOQOXRYGNIESOFRIKGIUZ' });
		expect(hillDecrypt('AZTLTILXFPPWKVDHDP', { a: A1, b: zero, alphabet: lat, pad: 'X' })).toMatchObject({ text: 'HOMOHOMINILUPUSEST' });
	});

	it('пробелы и регистр в тексте игнорируются, B прибавляется', () =>
	{
		const plain = hillEncrypt('dum spiro spero', { a: A1, b: [ 1, 2, 3 ], alphabet: lat, pad: 'A' });

		expect(plain).toMatchObject({ ok: true });
		if (!plain.ok) return;

		expect(hillDecrypt(plain.cipher, { a: A1, b: [ 1, 2, 3 ], alphabet: lat, pad: 'A' })).toMatchObject({ text: 'DUMSPIROSPEROAA' });
	});

	it('необратимая матрица — ошибка, а не тихий мусор', () =>
	{
		expect(hillDecrypt('ABCDEF', { a: [[ 2, 4 ], [ 1, 2 ]], b: [ 0, 0 ], alphabet: lat, pad: 'X' })).toMatchObject({ ok: false });
		expect(hillDecrypt('ABCDE', { a: A1, b: zero, alphabet: lat, pad: 'X' })).toMatchObject({ ok: false });
	});
});
