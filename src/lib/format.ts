import type { RowProduct } from './matrix';

const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉';

/** 26 → «₂₆», для индексов как в тетради: Z₂₆, a₃₃, A₁. */
export function sub (value: number | string): string
{
	return String(value).replace(/\d/gu, (d) => SUBSCRIPTS[Number(d)]!);
}

/** Строка произведения как в тетради: нулевые слагаемые не пишутся, умножение на 1 опускается. */
export function rowExpression (row: RowProduct): string
{
	const terms = row.terms.
		filter(([ coef, value ]) => coef !== 0 && value !== 0).
		map(([ coef, value ]) =>
		{
			if (coef === 1) return String(value);
			if (value === 1) return String(coef);

			return `${coef}·${value}`;
		});

	if (terms.length === 0) return '0';

	return terms.join(' + ');
}
