import { createApp } from 'vue';
import App from './App.vue';
import { captureWork, hasAccess } from './composables/useAccess';
import { captureId, useId } from './composables/useId';
import { useName } from './composables/useName';
import { findWork } from './data/works';
import { browserId } from './lib/browser-id';
import { installTracking } from './lib/tracking';
import router from './router';
import './style.css';

/* ID браузера выдаётся в момент первого захода, а не при первом событии статистики. */
browserId();

const { name } = useName();
const { id } = useId();

/*
 * ?id=… и ?work=… запоминаются в браузере и убираются из адреса, чтобы не разойтись дальше вместе со ссылкой.
 * Работа с кодом доступа без отметки в браузере не открывается — возврат к списку работ.
 */
router.beforeEach((to) =>
{
	const hasId = 'id' in to.query;
	const hasWork = 'work' in to.query;

	if (hasId) captureId(to.query.id, name.value);
	if (hasWork) captureWork(to.query.work);

	const work = findWork(Number(to.params.work));

	if (work && !hasAccess(work)) return { path: '/', replace: true };
	if (!hasId && !hasWork) return true;

	const query = { ...to.query };

	delete query.id;
	delete query.work;

	return { path: to.path, query, hash: to.hash, replace: true };
});

installTracking(router, () => ({ id: id.value, name: name.value }));

createApp(App).use(router).
	mount('#app');
