import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	scrollBehavior (to, from, savedPosition)
	{
		if (savedPosition) return savedPosition;
		if (to.path === from.path) return false;

		return { top: 0 };
	},
	routes: [
		{ path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
		{ path: '/work/:work(\\d+)', name: 'work', component: () => import('@/views/WorkView.vue'), props: true },
		{ path: '/work/:work(\\d+)/variant/:variant', name: 'variant', component: () => import('@/views/VariantView.vue'), props: true },
		{ path: '/work/:work(\\d+)/variant/:variant/task/:task(\\d+)', name: 'task', component: () => import('@/views/TaskView.vue'), props: true },
		{ path: '/:pathMatch(.*)*', redirect: '/' },
	],
});

export default router;
