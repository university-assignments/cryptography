/* Префикс: на university-assignments.github.io общий localStorage с другими сайтами (расписание и т. п.). */
const PREFIX = 'cryptography:';

/** Прочитать значение; ключ без префикса (старые версии сайта) переносится под префикс. */
export function readStored (key: string): string
{
	try
	{
		const value = localStorage.getItem(PREFIX + key);

		if (value !== null) return value;

		const legacy = localStorage.getItem(key);

		if (legacy === null) return '';

		localStorage.setItem(PREFIX + key, legacy);
		localStorage.removeItem(key);

		return legacy;
	}
	catch
	{
		return '';
	}
}

/** Сохранить значение; пустая строка удаляет ключ. */
export function writeStored (key: string, value: string): void
{
	try
	{
		if (value) localStorage.setItem(PREFIX + key, value);
		else localStorage.removeItem(PREFIX + key);
	}
	catch
	{

		/* приватный режим — значение живёт до перезагрузки */
	}
}
