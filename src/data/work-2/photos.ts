import type { Photo, PhotoNote } from '@/data/work-1/photos';

export interface PartPhotos
{
	part: number;
	photos: Photo[];
}

const BASE = `${import.meta.env.BASE_URL}photos/work-2`;
const PAGE = { width: 960, height: 1280 };

/** Маршруты заданий: часть 1 — задание 1; часть 2 — задания 2 и 3. */
const task = (variant: number, id: number): string => `/work/2/variant/${variant}/task/${id}`;

function photo (variant: number, part: number, file: string, width: number, height: number, caption: string, note?: PhotoNote): Photo
{
	return {
		src: `${BASE}/v${variant}/sub${part}/${file}.webp`,
		thumb: `${BASE}/v${variant}/sub${part}/${file}.thumb.webp`,
		width,
		height,
		caption,
		note,
	};
}

/** Условие (обрезка общего листа заданий) и страницы тетради одной части. */
function part (variant: number, id: number, sheetHeight: number, pages: number, notes: Record<number, PhotoNote> = {}): PartPhotos
{
	return {
		part: id,
		photos: [
			photo(variant, id, 'sheet', 960, sheetHeight, `Часть ${id}: условие`),
			...Array.from({ length: pages }, (_, i) => photo(variant, id, `p${i + 1}`, PAGE.width, PAGE.height, `Часть ${id}: тетрадь, стр. ${i + 1}`, notes[i + 1])),
		],
	};
}

/** Фото по вариантам: у каждой части свой лист заданий и своя тетрадь. Пометки — найденные в тетрадях ошибки. */
const PHOTOS: Record<number, PartPhotos[]> = {
	1: [
		part(1, 1, 195, 3),
		part(1, 2, 418, 3, {
			1: {
				text: 'а) в тетради пропущена буква: зашифровано VIVERESTCOGITARE, а на листе VIVEREESTCOGITARE — ответ Y = WKYIXNRKUNRBOBNGF. в) шестая тройка: 1,1,1 − 1,0,0 = 0,1,1 (E), а не 0,2,2 (I) — X = DIVIDEETIMPERA.',
				to: task(1, 2),
			},
			2: {
				text: 'Решение не дописано: f(2) = 0, значит f(x) приводим, но ord f(x) = |A| = 8 и минимальный период равен 8.',
				to: task(1, 2),
			},
		}),
	],
	2: [
		part(2, 1, 188, 3, {
			1: {
				text: 'Описка в промежуточной строке: (1+10x)·S(x) = 2 + Σ(…), а не 2x + Σ(…). На вывод не влияет.',
				to: task(2, 1),
			},
		}),
		part(2, 2, 425, 4, {
			2: {
				text: 'Решение не дописано: f(2) = 0, значит f(x) приводим, но ord f(x) = |A| = 8 и минимальный период равен 8.',
				to: task(2, 2),
			},
		}),
	],
	3: [
		part(3, 1, 188, 3, {
			1: {
				text: 'Описка в промежуточной строке: (1+6x)·S(x) = 2 + Σ(x^(6m+1) + 4x^(6m+3) + 5x^(6m+4) + 3x^(6m+5) + x^(6m+6)). На вывод не влияет.',
				to: task(3, 1),
			},
			2: {
				text: 'Описка в промежуточной строке: в (x+5)·S(x) последнее слагаемое 4x^(6m+6), а не 3x^(6m+6). На вывод не влияет.',
				to: task(3, 1),
			},
		}),
		part(3, 2, 431, 3, {
			2: {
				text: 'в) тринадцатая тройка: 1,2,0 − 1,0,1 = 0,2,2 (I), а не 0,0,2 (C). По шифртексту с листа получается X = SOLOMNIBUSLUIET — на листе опечатка в одной букве.',
				to: task(3, 2),
			},
		}),
	],
	4: [
		part(4, 1, 188, 3),
		part(4, 2, 405, 3, {
			2: {
				text: 'A⁴ и A⁸ посчитаны неверно: A⁴ = (0 2 1; 2 1 1; 1 2 1), A⁸ = (2 1 0; 0 1 1; 2 0 1). Остальные степени и вывод |A| = 26 верны.',
				to: task(4, 2),
			},
		}),
	],
	5: [
		part(5, 1, 208, 2),
		part(5, 2, 411, 4),
	],
	6: [
		part(6, 1, 208, 2),
		part(6, 2, 430, 4, {
			3: {
				text: 'Ошибка в β³: (α³+α²+1)(α³+α²+α) = α⁶+α²+α = α³+α, а не α²+1. Из-за неё неверны β⁴, система и ответ.',
				to: task(6, 3),
			},
			4: {
				text: 'Ответ неверный из-за ошибки в β³: минимальный многочлен f(x) = x⁴+x³+1, соотношение s(n+4) = s(n+3) + s(n).',
				to: task(6, 3),
			},
		}),
	],
};

export function photosOf2 (variant: number): PartPhotos[]
{
	return PHOTOS[variant] ?? [];
}
