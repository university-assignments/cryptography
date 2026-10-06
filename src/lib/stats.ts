import { STATS_URL } from '@/config';

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

/* С префиксом: localStorage общий для всех сайтов на university-assignments.github.io. */
const BROWSER_KEY = 'cryptography:browser:id';

let browser = '';

/**
 * Случайный ID браузера: дата и время первого захода + 4 случайных символа (20261007-013757-k3f9).
 * Не зависит от имени — видно, что под одним именем заходили с разных браузеров.
 */
export function browserId (): string
{
	if (browser) return browser;

	try
	{
		browser = localStorage.getItem(BROWSER_KEY) ?? '';
	}
	catch
	{

		/* приватный режим — ID живёт до перезагрузки */
	}

	if (browser) return browser;

	const stamp = new Date().toISOString().
		slice(0, 19).
		replace(/[-:]/gu, '').
		replace('T', '-');
	const random = Math.random().toString(36).
		slice(2, 6).
		padEnd(4, '0');

	browser = `${stamp}-${random}`;

	try
	{
		localStorage.setItem(BROWSER_KEY, browser);
	}
	catch
	{

		/* приватный режим — ID живёт до перезагрузки */
	}

	return browser;
}

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
