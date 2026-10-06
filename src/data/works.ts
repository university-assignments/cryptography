export type TaskSlug = 'hill' | 'square' | 'vigenere' | 'caesar' | 'playfair';

export interface TaskDef
{
	id: number;
	slug: TaskSlug;
	title: string;
	subtitle: string;
}

export interface WorkDef
{
	id: number;
	title: string;
	subtitle: string;
	variants: number;
	tasks: TaskDef[];
}

export const SUBJECT = {
	short: 'МиСКЗИ',
	full: 'Методы и средства криптографической защиты информации',
	year: '2026/2027',
	teacher: 'Зюляркина Н. Д.',
	form: 'очная',
};

export const WORKS: WorkDef[] = [
	{
		id: 1,
		title: 'Контрольная №1',
		subtitle: 'Классические шифры',
		variants: 6,
		tasks: [
			{ id: 1, slug: 'hill', title: 'Шифр Хилла', subtitle: 'аффинный, матрица 3×3 над Z26' },
			{ id: 2, slug: 'square', title: 'Магический квадрат', subtitle: 'достройка ключа и маршрутная перестановка' },
			{ id: 3, slug: 'vigenere', title: 'Шифр Виженера с обратной связью', subtitle: 'автоключ' },
			{ id: 4, slug: 'caesar', title: 'Шифр Цезаря', subtitle: 'поиск ключа перебором' },
			{ id: 5, slug: 'playfair', title: 'Шифр Плейфера', subtitle: 'таблица 5×5' },
		],
	},
];

export function findWork (id: number): WorkDef | undefined
{
	return WORKS.find((w) => w.id === id);
}

export const CUSTOM_VARIANT = 'custom';
