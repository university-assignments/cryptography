export interface Photo
{
	src: string;
	thumb: string;
	width: number;
	height: number;
	caption: string;
}

const BASE = `${import.meta.env.BASE_URL}photos/work-1`;

function photo (variant: number, file: string, width: number, height: number, caption: string): Photo
{
	return {
		src: `${BASE}/v${variant}/${file}.webp`,
		thumb: `${BASE}/v${variant}/${file}.thumb.webp`,
		width,
		height,
		caption,
	};
}

/** Фото условия и тетради по вариантам; В4 и В6 — пока только условие. */
const PHOTOS: Record<number, Photo[]> = {
	1: [
		photo(1, 'sheet', 960, 518, 'Условие (лист заданий)'),
		photo(1, 'p1', 960, 1280, 'Тетрадь, стр. 1'),
		photo(1, 'p2', 960, 1280, 'Тетрадь, стр. 2'),
		photo(1, 'p3', 960, 1280, 'Тетрадь, стр. 3'),
		photo(1, 'p4', 960, 1280, 'Тетрадь, стр. 4'),
		photo(1, 'p5', 960, 1280, 'Тетрадь, стр. 5'),
		photo(1, 'p6', 960, 1280, 'Тетрадь, стр. 6'),
	],
	2: [
		photo(2, 'sheet', 960, 634, 'Условие (лист заданий)'),
		photo(2, 'p1', 960, 1280, 'Тетрадь, стр. 1'),
		photo(2, 'p2', 960, 1280, 'Тетрадь, стр. 2'),
		photo(2, 'p3', 960, 1280, 'Тетрадь, стр. 3'),
		photo(2, 'p4', 960, 1280, 'Тетрадь, стр. 4'),
		photo(2, 'p5', 960, 1280, 'Тетрадь, стр. 5'),
	],
	3: [
		photo(3, 'sheet', 960, 550, 'Условие (лист заданий)'),
		photo(3, 'p1', 960, 1280, 'Тетрадь, стр. 1'),
		photo(3, 'p2', 960, 1280, 'Тетрадь, стр. 2'),
		photo(3, 'p3', 960, 1280, 'Тетрадь, стр. 3'),
		photo(3, 'p4', 960, 1280, 'Тетрадь, стр. 4'),
		photo(3, 'p5', 960, 1280, 'Тетрадь, стр. 5'),
		photo(3, 'p6', 960, 1280, 'Тетрадь, стр. 6'),
	],
	4: [ photo(4, 'sheet', 960, 570, 'Условие (лист заданий)') ],
	5: [
		photo(5, 'sheet', 960, 576, 'Условие (лист заданий)'),
		photo(5, 'p1', 960, 1280, 'Тетрадь, стр. 1'),
		photo(5, 'p2', 960, 1280, 'Тетрадь, стр. 2'),
		photo(5, 'p3', 960, 1280, 'Тетрадь, стр. 3'),
		photo(5, 'p4', 960, 1280, 'Тетрадь, стр. 4'),
		photo(5, 'p5', 960, 1280, 'Тетрадь, стр. 5'),
	],
	6: [ photo(6, 'sheet', 960, 570, 'Условие (лист заданий)') ],
};

export function photosOf (variant: number): Photo[]
{
	return PHOTOS[variant] ?? [];
}
