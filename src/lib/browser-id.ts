import { readStored, writeStored } from './storage';

/* localStorage['cryptography:browser:id'] — префикс добавляет storage.ts. */
const BROWSER_KEY = 'browser:id';

let browser = '';

/**
 * Случайный ID браузера: дата и время первого захода + 4 случайных символа (20261007-013757-k3f9).
 * Не зависит от имени — видно, что под одним именем заходили с разных браузеров.
 */
export function browserId (): string
{
	if (browser) return browser;

	browser = readStored(BROWSER_KEY);

	if (browser) return browser;

	const stamp = new Date().toISOString().
		slice(0, 19).
		replace(/[-:]/gu, '').
		replace('T', '-');
	const random = Math.random().toString(36).
		slice(2, 6).
		padEnd(4, '0');

	browser = `${stamp}-${random}`;
	writeStored(BROWSER_KEY, browser);

	return browser;
}
