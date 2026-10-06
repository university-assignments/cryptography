export function mod (a: number, m: number): number
{
	return (a % m + m) % m;
}

/** Расширенный алгоритм Евклида: g = gcd(a, b) = a·x + b·y. */
export function egcd (a: number, b: number): { g: number; x: number; y: number }
{
	let [ oldR, r ] = [ a, b ];
	let [ oldS, s ] = [ 1, 0 ];
	let [ oldT, t ] = [ 0, 1 ];

	while (r !== 0)
	{
		const q = Math.floor(oldR / r);

		[ oldR, r ] = [ r, oldR - q * r ];
		[ oldS, s ] = [ s, oldS - q * s ];
		[ oldT, t ] = [ t, oldT - q * t ];
	}

	return { g: oldR, x: oldS, y: oldT };
}

export function gcd (a: number, b: number): number
{
	return egcd(Math.abs(a), Math.abs(b)).g;
}

/** Обратный элемент по модулю или null, если gcd(a, m) ≠ 1. */
export function modInverse (a: number, m: number): number | null
{
	const { g, x } = egcd(mod(a, m), m);

	return g === 1
		? mod(x, m)
		: null;
}
