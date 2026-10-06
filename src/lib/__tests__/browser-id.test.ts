import {
	beforeEach, describe, expect, it, vi,
} from 'vitest';

function memoryStorage (): Storage
{
	const map = new Map<string, string>();

	return {
		get length ()
		{
			return map.size;
		},
		clear: () => map.clear(),
		getItem: (key) => map.get(key) ?? null,
		key: (index) => [ ...map.keys() ][index] ?? null,
		removeItem: (key) => map.delete(key),
		setItem: (key, value) => map.set(key, String(value)),
	} as Storage;
}

/* browserId запоминает значение в модуле — для каждого теста модуль грузится заново. */
describe('browserId', () =>
{
	beforeEach(() =>
	{
		vi.resetModules();
		vi.stubGlobal('localStorage', memoryStorage());
	});

	it('выдаёт ID «дата-время-4 символа» и кладёт его под cryptography:browser:id', async () =>
	{
		const { browserId } = await import('@/lib/browser-id');
		const id = browserId();

		expect(id).toMatch(/^\d{8}-\d{6}-[0-9a-z]{4}$/u);
		expect(localStorage.getItem('cryptography:browser:id')).toBe(id);
		expect(browserId()).toBe(id);
	});

	it('берёт уже сохранённый ID', async () =>
	{
		localStorage.setItem('cryptography:browser:id', '20260101-000000-abcd');

		const { browserId } = await import('@/lib/browser-id');

		expect(browserId()).toBe('20260101-000000-abcd');
	});
});
