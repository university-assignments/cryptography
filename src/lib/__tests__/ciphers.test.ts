import { describe, expect, it } from 'vitest';
import { ALPHABETS, normalize } from '../alphabet';
import { caesarShift, caesarTable } from '../caesar';
import { cyrb53, nameSeed, pick } from '../hash';
import { modInverse } from '../modmath';
import { buildTable, playfairDecrypt, playfairEncrypt } from '../playfair';
import { autokeyDecrypt, autokeyEncrypt } from '../vigenere';

const lat = ALPHABETS.lat;

/*
 * В тетради в трёх местах арифметические описки, здесь — пересчитанные значения:
 * В1: вторая буква C (число 2 в тетради верное, буква B — нет);
 * В2: позиции 10 и 13 — N и A (в тетради H и U, k₁₃ взят как 7 вместо 13);
 * В5: хвост FXH (в тетради ACH);
 * В4 (шифрование): в тетради ключ вычтен, а не прибавлен — здесь y = x + k.
 */
describe('Виженер с обратной связью — ответы из тетради', () =>
{
	it.each([
		[ 'DOG', 'FORTESFORTUNAADIUVAT', 'ICXYSJYSJYIETUQIUYIN' ],
		[ 'CAT', 'NIHILHABENTINIHILDEEST', 'PIAVTOIMLNUMABPVTKMPVX' ],
		[ 'LEX', 'SIMILIASIMILIBUSCURANTUR', 'DMJATUIDQMATUJFADOJCHKUE' ],
		[ 'HOT', 'MEDICUSCURATNATURASANAT', 'TSWUGXAEOJCNEAMHRTMRNST' ],
		[ 'CAR', 'HOMOPROPONITSEDDEUSDISPONIT', 'JODVDDCEFBXHFMWVIXVHCKSWFXH' ],
		[ 'GOD', 'INVIAVIRTUTINULLAESTVIA', 'OBYQNQQROCKBHNTYUPDTZAT' ],
	])('ключ %s: шифрование', (key, text, cipher) =>
	{
		expect(autokeyEncrypt(text, key, lat, 'plain')).toMatchObject({ cipher });
		expect(autokeyDecrypt(cipher, key, lat, 'plain')).toMatchObject({ text });
	});

	it.each([
		[ 'DOG', 'KISHHGMRLDEIVEJX', 'HUMANUMERRAREEST' ],
		[ 'CAT', 'HAEFXDPBUXIUZIJLQ', 'FALAXSPECIESRERUM' ],
		[ 'LEX', 'RYQZUVTVCTGAITDTU', 'GUTTACAVATLAPIDEM' ],
		[ 'HOT', 'ZQBWPBMNIWTTBMMNXAT', 'SCIENTIAPOTENTIAEST' ],
		[ 'CAR', 'XIEPUIYDWEDJNUAGZSM', 'VINUMVERBAMINISTRAT' ],
		[ 'GOD', 'VOADPQWBTZQRLQVMF', 'PAXOPTIMARERUMEST' ],
	])('ключ %s: расшифрование', (key, cipher, text) =>
	{
		expect(autokeyDecrypt(cipher, key, lat, 'plain')).toMatchObject({ text });
	});

	it('ключевой поток как в тетради (В1)', () =>
	{
		const result = autokeyEncrypt('FORTESFORTUNAADIUVAT', 'DOG', lat, 'plain');

		expect(result).toMatchObject({ k: [ 3, 14, 6, 5, 14, 17, 19, 4, 18, 5, 14, 17, 19, 20, 13, 0, 0, 3, 8, 20 ] });
	});

	it('обратная связь по шифртексту обратима', () =>
	{
		const enc = autokeyEncrypt('ATTACKATDAWN', 'KEY', lat, 'cipher');

		expect(enc.ok).toBe(true);
		if (!enc.ok) return;

		expect(autokeyDecrypt(enc.cipher, 'KEY', lat, 'cipher')).toMatchObject({ text: 'ATTACKATDAWN' });
	});
});

describe('Цезарь — перебор ключей', () =>
{
	it.each([
		[ 'NKLNL', 19, 'URSUS' ],
		[ 'NLYEZC', 11, 'CANTOR' ],
		[ 'NDHVYN', 13, 'AQUILA' ],
		[ 'GOMWU', 20, 'MUSCA' ],
		[ 'XTRJG', 15, 'IECUR' ],
		[ 'WDGDN', 21, 'BILIS' ],
	])('%s → k = %i → %s', (cipher, k, text) =>
	{
		const table = caesarTable(cipher, lat);

		expect(table.ok).toBe(true);
		if (!table.ok) return;

		expect(table.rows).toHaveLength(26);
		expect(table.rows[k]).toMatchObject({ k, text });
		expect(caesarShift(text, k, lat).result).toBe(cipher);
	});

	it('первая строка таблицы — сам шифртекст в числах', () =>
	{
		const table = caesarTable('NKLNL', lat);

		if (!table.ok) return;

		expect(table.rows[0]).toMatchObject({ indices: [ 13, 10, 11, 13, 11 ] });
	});
});

describe('Плейфер — ответы из тетради', () =>
{
	it('таблица по ключу CANIS без J', () =>
	{
		const table = buildTable('CANIS', lat);

		expect('table' in table && table.table).toEqual([
			[ 'C', 'A', 'N', 'I', 'S' ],
			[ 'B', 'D', 'E', 'F', 'G' ],
			[ 'H', 'K', 'L', 'M', 'O' ],
			[ 'P', 'Q', 'R', 'T', 'U' ],
			[ 'V', 'W', 'X', 'Y', 'Z' ],
		]);
	});

	it('повторы в ключе схлопываются (CARAGIUS, LUPUS)', () =>
	{
		const table = buildTable('CARAGIUS', lat);

		expect('table' in table && table.table[0]).toEqual([ 'C', 'A', 'R', 'G', 'I' ]);

		const lupus = buildTable('LUPUS', lat);

		expect('table' in lupus && lupus.table[0]).toEqual([ 'L', 'U', 'P', 'S', 'A' ]);
	});

	it.each([
		[ 'CANIS', 'CDRSKGSCNBHOELNZ', 'ABUNODISCEOMNESX' ],
		[ 'CORNIX', 'TXENBXQIXTXEOE', 'MEDIAETREMEDIA' ],
		[ 'AMICUS', 'CBKDELUAOCRFMQFAIW', 'MEDICECURATEIPSUMX' ],
		[ 'CARAGIUS', 'OPCFBABZOPWCMDYP', 'NOVUSREXNOVALEXQ' ],
		[ 'LYNX', 'YFFZZYEDFZZH', 'ACASUADCASUM' ],
		[ 'LUPUS', 'PFHAANRULTOQPY', 'ADMULTOSANNOSX' ],
	])('ключ %s: %s → %s', (key, cipher, text) =>
	{
		expect(playfairDecrypt(cipher, key, lat)).toMatchObject({ result: text });
	});

	it('правила пар подписаны', () =>
	{
		const result = playfairDecrypt('CDRSKGSCNBHOELNZ', 'CANIS', lat);

		if (!result.ok) return;

		expect(result.pairs[0]).toMatchObject({ input: 'CD', output: 'AB', rule: 'rect' });
		expect(result.pairs[3]).toMatchObject({ input: 'SC', output: 'IS', rule: 'row' });
		expect(result.pairs[5]).toMatchObject({ input: 'HO', output: 'OM', rule: 'row' });
	});

	it('шифрование разбивает дубли и добивает X', () =>
	{
		const result = playfairEncrypt('AB UNO DISCE OMNES', 'CANIS', lat, 'X');

		expect(result).toMatchObject({ source: 'ABUNODISCEOMNESX', result: 'CDRSKGSCNBHOELNZ' });
		expect(playfairEncrypt('BALLOON', 'CANIS', lat, 'X')).toMatchObject({ source: 'BALXLOON' });
	});

	it('нечётный шифртекст — ошибка', () =>
	{
		expect(playfairDecrypt('ABC', 'CANIS', lat)).toMatchObject({ ok: false });
	});
});

describe('вспомогательное', () =>
{
	it('normalize: регистр, пробелы, Ё', () =>
	{
		expect(normalize('dum spiro, spero!', lat)).toBe('DUMSPIROSPERO');
		expect(normalize('ёлка', ALPHABETS.ru32)).toBe('ЕЛКА');
		expect(normalize('ёлка', ALPHABETS.ru33)).toBe('ЁЛКА');
	});

	it('modInverse', () =>
	{
		expect(modInverse(19, 26)).toBe(11);
		expect(modInverse(13, 26)).toBeNull();
	});

	it('хеш имени стабилен и не зависит от регистра/пробелов', () =>
	{
		expect(cyrb53('a')).toBe(cyrb53('a'));
		expect(nameSeed('  Слава ')).toBe(nameSeed('слава'));
		expect(pick(nameSeed('Слава'), 2)).toBeLessThan(2);
		expect(pick(7, 0)).toBe(0);
	});
});
