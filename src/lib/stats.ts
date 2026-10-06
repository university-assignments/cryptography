import { STATS_URL } from '@/config';
import { browserId } from './browser-id';

export interface ViewEvent
{
	type: 'view';
	id: string;
	name: string;
	work: string;
	variant: string;
	task: string;
	seconds: number;
	path: string;
}

export interface IdEvent
{
	type: 'id';
	name: string;

	/** Пусто — человек пришёл по личной ссылке впервые. */
	oldId: string;
	newId: string;
}

export interface NameEvent
{
	type: 'name';
	id: string;
	oldName: string;
	newName: string;
}

export type StatsEvent = ViewEvent | IdEvent | NameEvent;

/*
 * text/plain без лишних заголовков — «простой» запрос без CORS-preflight, который Apps Script не умеет.
 * sendBeacon доходит и при закрытии вкладки; ответ не нужен.
 */
export function sendStats (event: StatsEvent): void
{
	if (!STATS_URL) return;

	const body = JSON.stringify({ ...event, browser: browserId(), ts: new Date().toISOString() });

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
