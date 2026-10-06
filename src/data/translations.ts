/*
 * Переводы ответов — как их подписывали в тетради. Ключ — ответ буквами без пробелов;
 * совпадение ищется с учётом добивки в конце (до двух лишних букв: X, A).
 */
const PHRASES: Record<string, string> = {
	ALAGUERRECOMMEALAGUERRE: 'На войне как на войне',
	SCIOMENIHILSCIRE: 'Я знаю, что ничего не знаю',
	HUMANUMERRAREEST: 'Человеку свойственно ошибаться',
	ABUNODISCEOMNES: 'По одному суди о других',
	LIBERTEEGALITEFRATERNITE: 'Свобода, равенство, братство',
	PANEMETCIRCENSES: 'Хлеба и зрелищ',

	/* В2: в шифртексте на листе вместо I стоит C — так получается и в тетради. */
	PANEMETCCRCENSES: 'Хлеба и зрелищ',
	FALAXSPECIESRERUM: 'Наружность вещей обманчива',
	MEDIAETREMEDIA: 'Способы и средства',
	VERBAVOLANTSCRIPTAMANENT: 'Слова улетают, написанное остаётся',
	LABOROMNIAVINCIT: 'Труд побеждает всё',
	GUTTACAVATLAPIDEM: 'Вода камень точит',
	MEDICECURATEIPSUM: 'Исцели сам себя',
	BONNEMINEAMAUVAISJEU: 'Делать хороший вид при плохой игре',
	PERASPERAADASTRA: 'Через тернии к звёздам',
	SCIENTIAPOTENTIAEST: 'Знание — сила',
	NOVUSREXNOVALEX: 'Новый царь, новый закон',
	HOMOHOMINILUPUSEST: 'Человек человеку волк',
	ADVOCATUSDIABOLI: 'Адвокат дьявола',
	VINUMVERBAMINISTRAT: 'Вино развязывает язык',
	ACASUADCASUM: 'От случая к случаю',
	OMNIAMEAMECUMPORTO: 'Всё своё ношу с собой',
	'OTEMPORA!OMORES!': 'О времена! О нравы!',
	PAXOPTIMARERUMEST: 'Мир — самая ценная вещь',
	ADMULTOSANNOS: 'На долгие годы',
};

/* Слова из заданий на шифр Цезаря — в тетради подписаны через тире. */
const WORDS: Record<string, string> = {
	URSUS: 'медведь',
	CANTOR: 'певец',
	AQUILA: 'орёл',
	MUSCA: 'муха',
	IECUR: 'печень',
	BILIS: 'жёлчь',
};

const MAX_TAIL = 2;

function lookup (dictionary: Record<string, string>, text: string): string | undefined
{
	for (const [ key, value ] of Object.entries(dictionary))
	{
		if (text.startsWith(key) && text.length - key.length <= MAX_TAIL) return value;
	}

	return undefined;
}

export function translatePhrase (text: string): string | undefined
{
	return lookup(PHRASES, text);
}

export function translateWord (text: string): string | undefined
{
	return WORDS[text];
}
