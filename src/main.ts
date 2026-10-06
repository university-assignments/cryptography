import { createApp } from 'vue';
import App from './App.vue';
import { captureId, useId } from './composables/useId';
import { useName } from './composables/useName';
import { browserId } from './lib/stats';
import { installTracking } from './lib/tracking';
import router from './router';
import './style.css';

/* ID браузера выдаётся в момент первого захода, а не при первом событии статистики. */
browserId();

const { name } = useName();
const { id } = useId();

/* ?id=… запоминается в браузере и убирается из адреса, чтобы не разойтись дальше вместе со ссылкой. */
router.beforeEach((to) =>
{
	if (!('id' in to.query)) return true;

	captureId(to.query.id, name.value);

	const query = { ...to.query };

	delete query.id;

	return { path: to.path, query, hash: to.hash, replace: true };
});

installTracking(router, () => ({ id: id.value, name: name.value }));

createApp(App).use(router).
	mount('#app');
