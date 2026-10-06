export type AlphabetId = 'lat' | 'ru33' | 'ru32';

export interface Alphabet
{
	id: AlphabetId;
	label: string;
	letters: string;

	/** Замены букв, которых нет в алфавите, на ближайшие (Ё → Е). */
	fold: Record<string, string>;
}

export const ALPHABETS: Record<AlphabetId, Alphabet> = {
	lat: {
		id: 'lat',
		label: 'Латинский, Z26',
		letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
		fold: {},
	},
	ru33: {
		id: 'ru33',
		label: 'Русский с Ё, Z33',
		letters: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
		fold: {},
	},
	ru32: {
		id: 'ru32',
		label: 'Русский без Ё, Z32',
		letters: 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
		fold: { Ё: 'Е' },
	},
};

export const ALPHABET_LIST: Alphabet[] = Object.values(ALPHABETS);

export function isAlphabetId (value: string): value is AlphabetId
{
	return value in ALPHABETS;
}

/** Название алфавита в формулировке условия: «для латинского алфавита». */
export function alphabetGenitive (alphabet: Alphabet): string
{
	if (alphabet.id === 'lat') return 'латинского';

	return 'русского';
}

/** Верхний регистр и только буквы алфавита; остальное (пробелы, знаки) выбрасывается. */
export function normalize (text: string, alphabet: Alphabet): string
{
	let result = '';

	for (const raw of text.toUpperCase())
	{
		const ch = alphabet.fold[raw] ?? raw;

		if (alphabet.letters.includes(ch)) result += ch;
	}

	return result;
}

export function toIndices (text: string, alphabet: Alphabet): number[]
{
	return [ ...text ].map((ch) => alphabet.letters.indexOf(ch));
}

export function fromIndices (indices: number[], alphabet: Alphabet): string
{
	const m = alphabet.letters.length;

	return indices.map((i) => alphabet.letters[(i % m + m) % m]).join('');
}

/** Буква → её номер и обратно, для подписей в решении. */
export function letterIndex (ch: string, alphabet: Alphabet): number
{
	return alphabet.letters.indexOf(ch);
}
