import { ref } from 'vue';
import { sendStats } from '@/lib/stats';
import { readStored, writeStored } from '@/lib/storage';

const STORAGE_KEY = 'id';

/* id из ссылки — md5 от имени (32 hex-символа). */
const ID_PATTERN = /^[0-9a-f]{32}$/u;

const id = ref(readStored(STORAGE_KEY));

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
	writeStored(STORAGE_KEY, next);
}
