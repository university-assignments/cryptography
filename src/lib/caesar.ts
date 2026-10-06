import {
	type Alphabet,
	fromIndices,
	normalize,
	toIndices,
} from './alphabet';
import { mod } from './modmath';

export interface CaesarRow
{
	k: number;
	indices: number[];
	text: string;
}

export interface CaesarTable
{
	ok: true;
	cipher: string;
	y: number[];
	rows: CaesarRow[];
}

export interface Failure
{
	ok: false;
	error: string;
}

/** Все сдвиги: x = y − k (mod m) для k = 0 … m−1. */
export function caesarTable (text: string, alphabet: Alphabet): CaesarTable | Failure
{
	const m = alphabet.letters.length;
	const cipher = normalize(text, alphabet);

	if (cipher.length === 0) return { ok: false, error: 'Введите шифртекст.' };

	const y = toIndices(cipher, alphabet);
	const rows: CaesarRow[] = [];

	for (let k = 0; k < m; k++)
	{
		const indices = y.map((v) => mod(v - k, m));

		rows.push({ k, indices, text: fromIndices(indices, alphabet) });
	}

	return { ok: true, cipher, y, rows };
}

export function caesarShift (text: string, k: number, alphabet: Alphabet): { source: string; x: number[]; y: number[]; result: string }
{
	const m = alphabet.letters.length;
	const source = normalize(text, alphabet);
	const x = toIndices(source, alphabet);
	const y = x.map((v) => mod(v + k, m));

	return { source, x, y, result: fromIndices(y, alphabet) };
}
