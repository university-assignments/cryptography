import { createApp } from 'vue';
import App from './App.vue';
import { captureCode, useCode } from './composables/useCode';
import { useName } from './composables/useName';
import { installTracking } from './lib/tracking';
import router from './router';
import './style.css';

const { name } = useName();
const { code } = useCode();

/* ?code=… запоминается в браузере и убирается из адреса, чтобы не разойтись дальше вместе со ссылкой. */
router.beforeEach((to) =>
{
	if (!('code' in to.query)) return true;

	captureCode(to.query.code, name.value);

	const query = { ...to.query };

	delete query.code;

	return { path: to.path, query, hash: to.hash, replace: true };
});

installTracking(router, () => ({ code: code.value, name: name.value }));

createApp(App).use(router).
	mount('#app');
