import { ref } from 'vue';
import { type WorkDef, workKey, WORKS } from '@/data/works';
import { readOwn, writeStored } from '@/lib/storage';

/* localStorage['cryptography:works'] = {"work-2":true} — какие закрытые работы открыты в этом браузере. */
const STORAGE_KEY = 'works';

type Granted = Record<string, boolean>;

function load (): Granted
{
	try
	{
		const parsed: unknown = JSON.parse(readOwn(STORAGE_KEY) || '{}');

		return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
			? parsed as Granted
			: {};
	}
	catch
	{
		return {};
	}
}

const granted = ref<Granted>(load());

/** Код из ссылки: md5 в виде uuid (8-4-4-4-12) или 32 hex-символа подряд. */
export function normalizeCode (raw: unknown): string
{
	return typeof raw === 'string'
		? raw.trim().toLowerCase().
			replace(/-/gu, '')
		: '';
}

/** Работа без кода доступа открыта всем; с кодом — только после захода по ссылке ?work=<код>. */
export function hasAccess (work: WorkDef): boolean
{
	return !work.access || granted.value[workKey(work)] === true;
}

/** Запомнить работу, чей код пришёл в ссылке. */
export function captureWork (raw: unknown): void
{
	const code = normalizeCode(raw);
	const work = WORKS.find((item) => item.access && item.access === code);

	if (!work || hasAccess(work)) return;

	granted.value = { ...granted.value, [workKey(work)]: true };
	writeStored(STORAGE_KEY, JSON.stringify(granted.value));
}
