<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import NameGate from '@/components/NameGate.vue';
import { useName } from '@/composables/useName';
import { CUSTOM_VARIANT, findWork, SUBJECT } from '@/data/works';

const { name, hasName, setName } = useName();
const route = useRoute();

interface Crumb
{
	label: string;
	to?: string;
}

const crumbs = computed<Crumb[]>(() =>
{
	const list: Crumb[] = [];
	const workId = Number(route.params.work);
	const work = findWork(workId);

	if (!work) return list;

	list.push({ label: work.title, to: `/work/${work.id}` });

	const variant = route.params.variant;

	if (typeof variant !== 'string') return list;

	const variantLabel = variant === CUSTOM_VARIANT
		? 'Свои данные'
		: `Вариант ${variant}`;

	list.push({ label: variantLabel, to: `/work/${work.id}/variant/${variant}` });

	const task = work.tasks.find((t) => t.id === Number(route.params.task));

	if (task) list.push({ label: `Задание ${task.id}` });

	return list;
});

const changeName = (): void =>
{
	setName('');
};
</script>

<template>
	<NameGate v-if="!hasName" />
	<div
		v-else
		class="flex min-h-screen flex-col"
	>
		<header class="border-b border-stone-200 bg-white/80 backdrop-blur dark:border-stone-800 dark:bg-stone-900/80">
			<div class="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
				<nav class="flex min-w-0 items-center gap-1 text-sm">
					<RouterLink
						to="/"
						class="shrink-0 font-semibold tracking-tight hover:text-amber-600"
					>
						{{ SUBJECT.short }}
					</RouterLink>
					<template
						v-for="crumb in crumbs"
						:key="crumb.label"
					>
						<span class="text-stone-400">/</span>
						<RouterLink
							v-if="crumb.to"
							:to="crumb.to"
							class="truncate hover:text-amber-600"
						>
							{{ crumb.label }}
						</RouterLink>
						<span
							v-else
							class="truncate text-stone-500"
						>{{ crumb.label }}</span>
					</template>
				</nav>
				<button
					type="button"
					class="shrink-0 rounded-full border border-stone-300 px-3 py-1 text-xs text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
					title="Сменить имя"
					@click="changeName"
				>
					{{ name }}
				</button>
			</div>
		</header>

		<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
			<RouterView />
		</main>

		<footer class="mx-auto w-full max-w-5xl px-4 py-6 text-xs text-stone-500 dark:text-stone-500">
			{{ SUBJECT.year }} · {{ SUBJECT.full }} ({{ SUBJECT.form }}, {{ SUBJECT.teacher }})
		</footer>
	</div>
</template>
