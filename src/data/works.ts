export type TaskSlug = 'hill' | 'square' | 'vigenere' | 'caesar' | 'playfair' | 'lrs-minimal' | 'lrs-cipher' | 'field-poly';

export interface TaskDef
{
	id: number;
	slug: TaskSlug;
	title: string;
	subtitle: string;

	/** Часть работы и номер задания внутри неё — если работа состоит из частей. */
	part?: number;
	number?: number;
}

export interface PartDef
{
	id: number;
	title: string;
}

export interface WorkDef
{
	id: number;
	title: string;
	subtitle: string;
	variants: number;
	tasks: TaskDef[];

	/** Работа из нескольких частей: у каждой свой лист заданий и своя тетрадь. */
	parts?: PartDef[];

	/**
	 * Код доступа — md5 от «work-<id>». Работа видна в списке всегда, но открывается
	 * только после захода по ссылке ?work=<код> (см. useAccess). Без кода работа открыта всем.
	 */
	access?: string;
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
	{
		id: 2,
		title: 'Контрольная №2',
		subtitle: 'Рекуррентные последовательности и конечные поля',
		variants: 6,
		access: 'f9d3903197e6549593c690a088f9d685',
		parts: [
			{ id: 1, title: 'Часть 1' },
			{ id: 2, title: 'Часть 2' },
		],
		tasks: [
			{ id: 1, part: 1, number: 1, slug: 'lrs-minimal', title: 'Минимальное рекуррентное соотношение', subtitle: 'аннулирующий многочлен над Zp и регистр с обратной связью' },
			{ id: 2, part: 2, number: 1, slug: 'lrs-cipher', title: 'Шифр на рекуррентной последовательности', subtitle: 'ключ — ЛРП над Z3, порядки матрицы и многочлена, период' },
			{ id: 3, part: 2, number: 2, slug: 'field-poly', title: 'Минимальный многочлен в F16', subtitle: 'элемент поля, соотношение и последовательность над Z2' },
		],
	},
];

export function findWork (id: number): WorkDef | undefined
{
	return WORKS.find((w) => w.id === id);
}

/** Ключ работы в localStorage (см. useAccess) и в коде доступа: md5('work-2'). */
export function workKey (work: WorkDef): string
{
	return `work-${work.id}`;
}

/** «Задание 3» или «Часть 2 · Задание 1». */
export function taskLabel (task: TaskDef): string
{
	return task.part
		? `Часть ${task.part} · Задание ${task.number}`
		: `Задание ${task.id}`;
}

/** Короткий номер для кнопок «назад/вперёд»: «3» или «2.1». */
export function taskNumber (task: TaskDef): string
{
	return task.part
		? `${task.part}.${task.number}`
		: String(task.id);
}

export const CUSTOM_VARIANT = 'custom';
