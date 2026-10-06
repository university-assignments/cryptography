import {
	type Alphabet,
	fromIndices,
	normalize,
	toIndices,
} from './alphabet';
import { mod } from './modmath';

/** Откуда берётся продолжение ключа: из открытого текста или из шифртекста. */
export type Feedback = 'plain' | 'cipher';

export const FEEDBACKS: { id: Feedback; label: string }[] = [
	{ id: 'plain', label: 'ключ продолжается открытым текстом' },
	{ id: 'cipher', label: 'ключ продолжается шифртекстом' },
];

export interface VigenereResult
{
	ok: true;
	key: string;
	x: number[];
	k: number[];
	y: number[];
	text: string;
	cipher: string;
}

export interface Failure
{
	ok: false;
	error: string;
}

export function autokeyEncrypt (text: string, keyword: string, alphabet: Alphabet, feedback: Feedback): VigenereResult | Failure
{
	const m = alphabet.letters.length;
	const key = normalize(keyword, alphabet);
	const source = normalize(text, alphabet);

	if (key.length === 0) return { ok: false, error: 'Введите ключевое слово.' };
	if (source.length === 0) return { ok: false, error: 'Введите открытый текст.' };

	const x = toIndices(source, alphabet);
	const k = toIndices(key, alphabet);
	const y: number[] = [];

	for (let i = 0; i < x.length; i++)
	{
		if (i >= k.length) k.push(feedback === 'plain'
			? x[i - key.length]!
			: y[i - key.length]!);

		y.push(mod(x[i]! + k[i]!, m));
	}

	return { ok: true, key, x, k: k.slice(0, x.length), y, text: source, cipher: fromIndices(y, alphabet) };
}

export function autokeyDecrypt (text: string, keyword: string, alphabet: Alphabet, feedback: Feedback): VigenereResult | Failure
{
	const m = alphabet.letters.length;
	const key = normalize(keyword, alphabet);
	const cipher = normalize(text, alphabet);

	if (key.length === 0) return { ok: false, error: 'Введите ключевое слово.' };
	if (cipher.length === 0) return { ok: false, error: 'Введите шифртекст.' };

	const y = toIndices(cipher, alphabet);
	const k = toIndices(key, alphabet);
	const x: number[] = [];

	for (let i = 0; i < y.length; i++)
	{
		if (i >= k.length) k.push(feedback === 'plain'
			? x[i - key.length]!
			: y[i - key.length]!);

		x.push(mod(y[i]! - k[i]!, m));
	}

	return { ok: true, key, x, k: k.slice(0, y.length), y, text: fromIndices(x, alphabet), cipher };
}
