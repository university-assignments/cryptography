<script setup lang="ts">
import { type Component, computed } from 'vue';
import { RouterLink } from 'vue-router';
import CaesarTask from '@/components/tasks/CaesarTask.vue';
import HillTask from '@/components/tasks/HillTask.vue';
import PlayfairTask from '@/components/tasks/PlayfairTask.vue';
import SquareTask from '@/components/tasks/SquareTask.vue';
import VigenereTask from '@/components/tasks/VigenereTask.vue';
import { findVariant } from '@/data/work-1/variants';
import { CUSTOM_VARIANT, findWork, type TaskSlug } from '@/data/works';

const props = defineProps<{ work: string; variant: string; task: string }>();

const work = computed(() => findWork(Number(props.work)));
const task = computed(() => work.value?.tasks.find((t) => t.id === Number(props.task)));
const isCustom = computed(() => props.variant === CUSTOM_VARIANT);
const preset = computed(() =>
{
	if (isCustom.value) return undefined;

	return findVariant(Number(props.variant));
});
const valid = computed(() => Boolean(work.value && task.value && (isCustom.value || preset.value)));

const components: Record<TaskSlug, Component> = {
	hill: HillTask,
	square: SquareTask,
	vigenere: VigenereTask,
	caesar: CaesarTask,
	playfair: PlayfairTask,
};

const siblings = computed(() =>
{
	if (!work.value || !task.value) return { prev: undefined, next: undefined };

	const index = work.value.tasks.findIndex((t) => t.id === task.value!.id);

	return { prev: work.value.tasks[index - 1], next: work.value.tasks[index + 1] };
});
</script>

<template>
	<div
		v-if="valid && work && task"
		class="space-y-6"
	>
		<div>
			<p class="text-xs font-medium uppercase tracking-wide text-stone-500">
				{{ isCustom ? 'Свои данные' : `Вариант ${variant}` }} · Задание {{ task.id }}
			</p>
			<h1 class="text-2xl font-semibold tracking-tight">
				{{ task.title }}
			</h1>
			<p class="note mt-1">
				так помечены пояснения сайта — их не переписывают
			</p>
		</div>

		<component
			:is="components[task.slug]"
			:key="`${variant}-${task.id}`"
			:preset="preset"
		/>

		<nav class="flex justify-between gap-3 text-sm">
			<RouterLink
				v-if="siblings.prev"
				:to="`/work/${work.id}/variant/${variant}/task/${siblings.prev.id}`"
				class="btn-secondary"
			>
				← {{ siblings.prev.id }}. {{ siblings.prev.title }}
			</RouterLink>
			<span v-else />
			<RouterLink
				v-if="siblings.next"
				:to="`/work/${work.id}/variant/${variant}/task/${siblings.next.id}`"
				class="btn-secondary"
			>
				{{ siblings.next.id }}. {{ siblings.next.title }} →
			</RouterLink>
		</nav>
	</div>
	<p
		v-else
		class="error"
	>
		Такого задания нет.
	</p>
</template>
