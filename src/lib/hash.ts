/** cyrb53 — быстрый 53-битный хеш строки; детерминированный «рандом» по имени. */
export function cyrb53 (text: string, seed = 0): number
{
	let h1 = 0xDEADBEEF ^ seed;
	let h2 = 0x41C6CE57 ^ seed;

	for (const ch of text)
	{
		const code = ch.codePointAt(0)!;

		h1 = Math.imul(h1 ^ code, 2654435761);
		h2 = Math.imul(h2 ^ code, 1597334677);
	}

	h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507);
	h1 ^= Math.imul(h2 ^ h2 >>> 13, 3266489909);
	h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507);
	h2 ^= Math.imul(h1 ^ h1 >>> 13, 3266489909);

	return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** Имя приводится к нижнему регистру без лишних пробелов, чтобы «Слава» и «слава » давали одно и то же. */
export function nameSeed (name: string): number
{
	return cyrb53(name.trim().toLowerCase().
		replace(/\s+/gu, ' '));
}

export function pick (seed: number, count: number): number
{
	return count > 0
		? seed % count
		: 0;
}
