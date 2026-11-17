/* Запись соотношений и рядов в TeX — как в тетради. */

function power (variable: string, exponent: string | number): string
{
	if (exponent === 0) return '';
	if (exponent === 1) return variable;

	return `${variable}^{${exponent}}`;
}

function term (coef: number, body: string): string
{
	if (!body) return String(coef);
	if (coef === 1) return body;

	return `${coef}${body}`;
}

/** Сумма ненулевых слагаемых; bodies[i] — то, на что умножается coefs[i]. */
function sum (coefs: number[], bodies: string[], descending = false): string
{
	const terms: string[] = [];

	coefs.forEach((coef, i) =>
	{
		if (coef !== 0) terms.push(term(coef, bodies[i]!));
	});

	if (terms.length === 0) return '0';
	if (descending) terms.reverse();

	return terms.join('+');
}

function memberName (i: number): string
{
	if (i === 0) return 's_{n}';

	return `s_{n+${i}}`;
}

function shiftName (i: number): string
{
	if (i === 0) return 'n';

	return `n+${i}`;
}

/** s_{n+2}=s_{n+1}+2s_{n} по коэффициентам a₀ … a_{k−1}. */
export function recurrenceTex (coefs: number[]): string
{
	return `s_{n+${coefs.length}}=${sum(coefs, coefs.map((_, i) => memberName(i)), true)}`;
}

/** x^{2}=x+2 — то же соотношение для степеней x. */
export function relationTex (coefs: number[], variable = 'x'): string
{
	return `${power(variable, coefs.length)}=${sum(coefs, coefs.map((_, i) => power(variable, i)), true)}`;
}

/** x^{n+3}=x^{n+2}+x^{n} — соотношение до деления на xⁿ. */
export function shiftedRelationTex (coefs: number[], variable = 'x'): string
{
	return `${power(variable, shiftName(coefs.length))}=${sum(coefs, coefs.map((_, i) => power(variable, shiftName(i))), true)}`;
}

/** Многочлен по возрастанию степеней: 2+7x. */
export function ascendingTex (coefs: number[], variable = 'x'): string
{
	return sum(coefs, coefs.map((_, i) => power(variable, i)));
}

/** Σ по m от 0 до ∞ (… + c·x^{Tm+shift+i} + …); нулевые слагаемые не пишутся. */
export function seriesTex (values: number[], period: number, shift: number, variable = 'x'): string
{
	const bodies = values.map((_, i) =>
	{
		const offset = shift + i;

		if (offset === 0) return power(variable, `${period}m`);

		return power(variable, `${period}m+${offset}`);
	});

	return `\\sum_{m=0}^{\\infty}\\left(${sum(values, bodies)}\\right)`;
}

/** s_{0}=0, s_{1}=2 */
export function initialTex (init: number[]): string
{
	return init.map((value, i) => `s_{${i}}=${value}`).join(',\\ ');
}

/** ([0,2,2,6,3,1], 0,2,2,…) — период в квадратных скобках, как в тетради. */
export function periodicTex (period: number[], preperiod: number[] = []): string
{
	const lead = preperiod.map((value) => `${value},`).join('');

	return `(${lead}[${period.join(',')}],\\,${period.join(',')},\\dots)`;
}
