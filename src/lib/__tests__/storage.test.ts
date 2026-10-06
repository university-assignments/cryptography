import {
	beforeEach, describe, expect, it, vi,
} from 'vitest';
import { readStored, writeStored } from '@/lib/storage';

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

describe('storage', () =>
{
	beforeEach(() => vi.stubGlobal('localStorage', memoryStorage()));

	it('пишет и читает под префиксом cryptography:', () =>
	{
		writeStored('name', 'kotonai');

		expect(localStorage.getItem('cryptography:name')).toBe('kotonai');
		expect(localStorage.getItem('name')).toBeNull();
		expect(readStored('name')).toBe('kotonai');
	});

	it('пустая строка удаляет ключ', () =>
	{
		writeStored('name', 'kotonai');
		writeStored('name', '');

		expect(localStorage.getItem('cryptography:name')).toBeNull();
		expect(readStored('name')).toBe('');
	});

	it('переносит старый ключ без префикса и не трогает чужие', () =>
	{
		localStorage.setItem('id', '1e539a4e6007e3375aa5fefb5863dc0a');
		localStorage.setItem('schedule:group:v1', '"my"');

		expect(readStored('id')).toBe('1e539a4e6007e3375aa5fefb5863dc0a');
		expect(localStorage.getItem('cryptography:id')).toBe('1e539a4e6007e3375aa5fefb5863dc0a');
		expect(localStorage.getItem('id')).toBeNull();
		expect(localStorage.getItem('schedule:group:v1')).toBe('"my"');
	});

	it('новый ключ важнее старого', () =>
	{
		localStorage.setItem('name', 'старое');
		localStorage.setItem('cryptography:name', 'новое');

		expect(readStored('name')).toBe('новое');
	});

	it('без localStorage (приватный режим) не падает', () =>
	{
		vi.stubGlobal('localStorage', undefined);

		expect(readStored('name')).toBe('');
		expect(() => writeStored('name', 'x')).not.toThrow();
	});
});
