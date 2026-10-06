import { ref } from 'vue';
import { sendStats } from '@/lib/stats';

const STORAGE_KEY = 'id';

/* id из ссылки — md5 от имени (32 hex-символа). */
const ID_PATTERN = /^[0-9a-f]{32}$/u;

function readStored (): string
{
	try
	{
		return localStorage.getItem(STORAGE_KEY) ?? '';
	}
	catch
	{
		return '';
	}
}

const id = ref(readStored());

export function useId ()
{
	return { id };
}

/** Запомнить id из ссылки. Если раньше был другой — отправить пару «старый → новый». */
export function captureId (raw: unknown, name: string): void
{
	if (typeof raw !== 'string') return;

	const next = raw.trim().toLowerCase();

	if (!ID_PATTERN.test(next) || next === id.value) return;

	sendStats({ type: 'id', name, oldId: id.value, newId: next });
	id.value = next;

	try
	{
		localStorage.setItem(STORAGE_KEY, next);
	}
	catch
	{

		/* приватный режим — id живёт до перезагрузки */
	}
}
