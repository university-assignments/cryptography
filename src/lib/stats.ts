import { STATS_URL } from '@/config';

export interface ViewEvent
{
	type: 'view';
	code: string;
	name: string;
	work: string;
	variant: string;
	task: string;
	seconds: number;
	path: string;
}

export interface CodeEvent
{
	type: 'code';
	name: string;

	/** Пусто — человек пришёл с кодом впервые. */
	oldCode: string;
	newCode: string;
}

export interface NameEvent
{
	type: 'name';
	code: string;
	oldName: string;
	newName: string;
}

export type StatsEvent = ViewEvent | CodeEvent | NameEvent;

/*
 * text/plain без лишних заголовков — «простой» запрос без CORS-preflight, который Apps Script не умеет.
 * sendBeacon доходит и при закрытии вкладки; ответ не нужен.
 */
export function sendStats (event: StatsEvent): void
{
	if (!STATS_URL) return;

	const body = JSON.stringify({ ...event, ts: new Date().toISOString() });

	try
	{
		if (navigator.sendBeacon(STATS_URL, body)) return;
	}
	catch
	{

		/* старый браузер — ниже fetch */
	}

	fetch(STATS_URL, { method: 'POST', mode: 'no-cors', body, keepalive: true }).catch(() => undefined);
}
