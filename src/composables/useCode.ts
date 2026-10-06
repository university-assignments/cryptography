import { ref } from 'vue';
import { sendStats } from '@/lib/stats';

const STORAGE_KEY = 'code';

/* Код из ссылки — md5 от имени (32 hex-символа). */
const CODE_PATTERN = /^[0-9a-f]{32}$/u;

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

const code = ref(readStored());

export function useCode ()
{
	return { code };
}

/** Запомнить код из ссылки. Если раньше был другой — отправить пару «старый → новый». */
export function captureCode (raw: unknown, name: string): void
{
	if (typeof raw !== 'string') return;

	const next = raw.trim().toLowerCase();

	if (!CODE_PATTERN.test(next) || next === code.value) return;

	sendStats({ type: 'code', name, oldCode: code.value, newCode: next });
	code.value = next;

	try
	{
		localStorage.setItem(STORAGE_KEY, next);
	}
	catch
	{

		/* приватный режим — код живёт до перезагрузки */
	}
}
