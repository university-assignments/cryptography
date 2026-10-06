import {
	type Alphabet,
	fromIndices,
	normalize,
	toIndices,
} from './alphabet';
import {
	type InverseSteps,
	type MatVecResult,
	type Matrix,
	addVec,
	inverseMod,
	isSquare,
	matVec,
	subVec,
} from './matrix';

export interface HillParams
{
	a: Matrix;
	b: number[];
	alphabet: Alphabet;

	/** Буква добивки до длины, кратной размеру матрицы. */
	pad: string;
}

export interface HillBlock
{
	input: number[];

	/** y − B перед умножением (только при расшифровании). */
	shifted?: number[];
	product: MatVecResult;
	output: number[];
}

export interface HillEncrypt
{
	ok: true;
	source: string;
	padded: string;
	padCount: number;
	x: number[];
	blocks: HillBlock[];
	y: number[];
	cipher: string;
}

export interface HillDecrypt
{
	ok: true;
	cipher: string;
	y: number[];
	inverse: InverseSteps;
	blocks: HillBlock[];
	x: number[];
	text: string;
}

export interface Failure
{
	ok: false;
	error: string;
}

function validate (params: HillParams): string | null
{
	const n = params.a.length;

	if (!isSquare(params.a)) return 'Матрица A должна быть квадратной.';
	if (params.b.length !== n) return `Вектор B должен иметь ${n} компонент.`;

	return null;
}

export function hillEncrypt (text: string, params: HillParams): HillEncrypt | Failure
{
	const error = validate(params);

	if (error) return { ok: false, error };

	const { a, b, alphabet } = params;
	const m = alphabet.letters.length;
	const n = a.length;
	const source = normalize(text, alphabet);
	const padLetter = normalize(params.pad, alphabet).slice(0, 1);

	if (source.length === 0) return { ok: false, error: 'Введите открытый текст.' };

	const padCount = (n - source.length % n) % n;

	if (padCount > 0 && padLetter.length === 0) return { ok: false, error: 'Укажите букву добивки из алфавита.' };

	const padded = source + padLetter.repeat(padCount);
	const x = toIndices(padded, alphabet);
	const blocks: HillBlock[] = [];

	for (let i = 0; i < x.length; i += n)
	{
		const input = x.slice(i, i + n);
		const product = matVec(a, input, m);

		blocks.push({ input, product, output: addVec(product.result, b, m) });
	}

	const y = blocks.flatMap((block) => block.output);

	return {
		ok: true,
		source,
		padded,
		padCount,
		x,
		blocks,
		y,
		cipher: fromIndices(y, alphabet),
	};
}

export function hillDecrypt (text: string, params: HillParams): HillDecrypt | Failure
{
	const error = validate(params);

	if (error) return { ok: false, error };

	const { a, b, alphabet } = params;
	const m = alphabet.letters.length;
	const n = a.length;
	const cipher = normalize(text, alphabet);

	if (cipher.length === 0) return { ok: false, error: 'Введите шифртекст.' };
	if (cipher.length % n !== 0) return { ok: false, error: `Длина шифртекста ${cipher.length} не кратна ${n}.` };

	const inverse = inverseMod(a, m);

	if ('error' in inverse) return { ok: false, error: inverse.error };

	const y = toIndices(cipher, alphabet);
	const blocks: HillBlock[] = [];

	for (let i = 0; i < y.length; i += n)
	{
		const input = y.slice(i, i + n);
		const shifted = subVec(input, b, m);
		const product = matVec(inverse.inverse, shifted, m);

		blocks.push({ input, shifted, product, output: product.result });
	}

	const x = blocks.flatMap((block) => block.output);

	return {
		ok: true,
		cipher,
		y,
		inverse,
		blocks,
		x,
		text: fromIndices(x, alphabet),
	};
}
