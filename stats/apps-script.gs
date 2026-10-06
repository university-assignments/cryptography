/**
 * Приём статистики с сайта в Google Таблицу.
 *
 * @OnlyCurrentDoc — скрипт получает доступ только к этой таблице, а не ко всему Google Диску.
 *
 * Развёртывание:
 * 0. Лист «Группа»: A — ФИО, B — ID, C — ссылка (по нему «Сводка» подписывает людей).
 * 1. Таблица → Расширения → Apps Script → вставить этот файл целиком → сохранить.
 * 2. Выполнить функцию setup один раз (создаст листы), разрешить доступ.
 * 3. Начать развёртывание → Новое развёртывание → тип «Веб-приложение»:
 *    «Запуск от имени» — Я, «У кого есть доступ» — Все. Скопировать URL (…/exec).
 * 4. URL вставить в src/config.ts (STATS_URL).
 *
 * Посетители сайта могут только дописывать строки через doPost — читать таблицу или
 * что-либо в аккаунте они не могут. Сама таблица остаётся приватной.
 */

const SHEETS = {
	view: { name: 'Просмотры', header: [ 'Время', 'ID', 'Имя', 'Работа', 'Вариант', 'Задание', 'Секунд', 'Адрес', 'ФИО по ID' ] },
	id: { name: 'Смена ID', header: [ 'Время', 'Имя', 'Старый ID', 'Новый ID' ] },
	name: { name: 'Смена имени', header: [ 'Время', 'ID', 'Старое имя', 'Новое имя' ] },
};

const SUMMARY = 'Сводка';

/* Лист со списком группы: A — ФИО, B — ID (md5 имени), C — личная ссылка. */
const GROUP = 'Группа';

function setup()
{
	Object.values(SHEETS).forEach(sheetFor);

	const book = SpreadsheetApp.getActiveSpreadsheet();
	const summary = book.getSheetByName(SUMMARY) || book.insertSheet(SUMMARY);

	/* ФИО (по ID из «Группы») × вариант → сколько секунд провёл. Самое большое число в строке — его вариант. */
	summary.getRange('A1').setFormula(
		'=QUERY(\'Просмотры\'!A2:I, "select I, sum(G) where E is not null and E <> \'custom\' group by I pivot E", 0)',
	);
}

function sheetFor(spec)
{
	const book = SpreadsheetApp.getActiveSpreadsheet();
	let sheet = book.getSheetByName(spec.name);

	if (!sheet)
	{
		sheet = book.insertSheet(spec.name);
		sheet.appendRow(spec.header);
		sheet.setFrozenRows(1);
	}

	return sheet;
}

/* Текст, начинающийся с = + - @, Таблица считает формулой — экранируем. */
function clean(value)
{
	if (typeof value === 'number') return value;

	const text = String(value === undefined || value === null ? '' : value).slice(0, 200);

	return /^[=+\-@]/.test(text)
		? `'${text}`
		: text;
}

/* ФИО по ID из листа «Группа»; если ID нет в списке — сам ID (или «без ID»). */
function personById(id)
{
	if (!id) return 'без ID';

	const group = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(GROUP);

	if (!group) return id;

	const rows = group.getRange(2, 1, Math.max(group.getLastRow() - 1, 1), 2).getValues();
	const found = rows.find((row) => String(row[1]).trim().toLowerCase() === String(id).toLowerCase());

	return found
		? found[0]
		: id;
}

function doPost(e)
{
	let data;

	try
	{
		data = JSON.parse(e.postData.contents);
	}
	catch (error)
	{
		return ContentService.createTextOutput('bad json');
	}

	const spec = SHEETS[data.type];

	if (!spec) return ContentService.createTextOutput('unknown type');

	const now = new Date();
	const rows = {
		view: [ now, data.id, data.name, data.work, data.variant, data.task, Number(data.seconds) || 0, data.path, personById(data.id) ],
		id: [ now, data.name, data.oldId, data.newId ],
		name: [ now, data.id, data.oldName, data.newName ],
	};

	const lock = LockService.getScriptLock();

	lock.waitLock(5000);

	try
	{
		sheetFor(spec).appendRow(rows[data.type].map(clean));
	}
	finally
	{
		lock.releaseLock();
	}

	return ContentService.createTextOutput('ok');
}
