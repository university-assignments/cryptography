export interface MinimalPreset
{

	/** Модуль: последовательность над Z_p. */
	p: number;

	/** Один период последовательности. */
	period: string;
}

export interface StreamPreset
{

	/** Коэффициенты соотношения s(n+3) = a₂·s(n+2) + a₁·s(n+1) + a₀·s(n) — в порядке a₂, a₁, a₀. */
	coefs: string;

	/** Начальные условия s₀, s₁, s₂. */
	init: string;
	encrypt: string;
	decrypt: string;
}

export interface FieldPreset
{

	/** Многочлен g(x), которым построено поле: коэффициенты от x⁴ до 1 (см. FIELD_POLYS). */
	g: string;

	/** Элемент поля — многочлен от α (a). */
	beta: string;
}

export interface Variant2Preset
{
	id: number;
	minimal: MinimalPreset;
	stream: StreamPreset;
	field: FieldPreset;
}

const INIT = '0,0,1';
const G_X4_X_1 = '10011';
const G_X4_X3_1 = '11001';

/** Условия с листов заданий: часть 1 — один лист, часть 2 — два листа. */
export const VARIANTS_2: Variant2Preset[] = [
	{
		id: 1,
		minimal: { p: 7, period: '0,2,2,6,3,1' },
		stream: { coefs: '1,0,1', init: INIT, encrypt: 'VIVEREESTCOGITARE', decrypt: 'EKYAJNRLG+JIXJ' },

		/* Выданный лист и тетрадь: g(x) = x⁴ + x + 1. В архивном условии пропущен «+». */
		field: { g: G_X4_X_1, beta: 'a^2+a' },
	},
	{
		id: 2,
		minimal: { p: 11, period: '2,9,7,9,2,4' },
		stream: { coefs: '0,2,1', init: INIT, encrypt: 'SILENTLEGESINTERARMA', decrypt: 'TDGCNJXNPDMPA' },
		field: { g: G_X4_X3_1, beta: 'a^2+a+1' },
	},
	{
		id: 3,
		minimal: { p: 7, period: '2,3,3,0,5,1' },
		stream: { coefs: '2,0,1', init: INIT, encrypt: 'VIMVIREPELLERELICET', decrypt: 'TIG+VUEOXXTMPFN' },
		field: { g: G_X4_X_1, beta: 'a^3+a+1' },
	},
	{
		id: 4,
		minimal: { p: 7, period: '3,1,5,4,6,2' },
		stream: { coefs: '0,1,2', init: INIT, encrypt: 'VITABREVISARSLONGA', decrypt: 'EQNIWXTOXVPOZTZ' },
		field: { g: G_X4_X_1, beta: 'a^2+1' },
	},
	{
		id: 5,
		minimal: { p: 5, period: '1,2,1,4,3,4' },
		stream: { coefs: '0,1,1', init: INIT, encrypt: 'VINCEINBONOMALUM', decrypt: 'DIIVRXOAZQFTQBE' },
		field: { g: G_X4_X3_1, beta: 'a^3+1' },
	},
	{
		id: 6,
		minimal: { p: 3, period: '0,1,1,0,2,2' },
		stream: { coefs: '1,0,2', init: INIT, encrypt: 'SIVISPACEMPARABELLUM', decrypt: 'ELVNCCGOZGLNCTA' },

		/* Новый лист: β = α³ + α + 1; на старом листе (и в тетради) было α³ + α² + 1 — ответ тот же. */
		field: { g: G_X4_X_1, beta: 'a^3+a+1' },

	},
];

export function findVariant2 (id: number): Variant2Preset | undefined
{
	return VARIANTS_2.find((v) => v.id === id);
}

/** «1,0,1» (a₂, a₁, a₀) → [a₀, a₁, a₂] — в порядке возрастания индекса, как ждёт ядро. */
export function parseCoefs (text: string): number[]
{
	return parseList(text).reverse();
}

export function parseList (text: string): number[]
{
	return text.split(/[\s,;]+/u).filter((v) => v.length > 0).
		map(Number);
}
