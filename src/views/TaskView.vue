<script setup lang="ts">
import { type Component, computed } from 'vue';
import { RouterLink } from 'vue-router';
import CaesarTask from '@/components/tasks/CaesarTask.vue';
import FieldPolyTask from '@/components/tasks/FieldPolyTask.vue';
import HillTask from '@/components/tasks/HillTask.vue';
import LrsCipherTask from '@/components/tasks/LrsCipherTask.vue';
import LrsMinimalTask from '@/components/tasks/LrsMinimalTask.vue';
import PlayfairTask from '@/components/tasks/PlayfairTask.vue';
import SquareTask from '@/components/tasks/SquareTask.vue';
import VigenereTask from '@/components/tasks/VigenereTask.vue';
import { findVariant } from '@/data/work-1/variants';
import { ISSUED_TASK_NUMBERS, issuedSheetOf } from '@/data/work-2/photos';
import { findVariant2 } from '@/data/work-2/variants';
import {
	type TaskSlug,
	CUSTOM_VARIANT,
	findWork,
	taskLabel,
	taskNumber,
} from '@/data/works';

const props = defineProps<{ work: string; variant: string; task: string }>();

const work = computed(() => findWork(Number(props.work)));
const task = computed(() => work.value?.tasks.find((t) => t.id === Number(props.task)));
const isCustom = computed(() => props.variant === CUSTOM_VARIANT);
const preset = computed(() =>
{
	if (isCustom.value) return undefined;

	/* Условия вариантов у каждой работы свои. */
	return work.value?.id === 2
		? findVariant2(Number(props.variant))
		: findVariant(Number(props.variant));
});
const valid = computed(() => Boolean(work.value && task.value && (isCustom.value || preset.value)));
const issuedNumber = computed(() =>
{
	if (work.value?.id !== 2 || !task.value || !issuedSheetOf(Number(props.variant))) return undefined;

	return ISSUED_TASK_NUMBERS[task.value.id];
});

const components: Record<TaskSlug, Component> = {
	hill: HillTask,
	square: SquareTask,
	vigenere: VigenereTask,
	caesar: CaesarTask,
	playfair: PlayfairTask,
	'lrs-minimal': LrsMinimalTask,
	'lrs-cipher': LrsCipherTask,
	'field-poly': FieldPolyTask,
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
				{{ isCustom ? 'Свои данные' : `Вариант ${variant}` }} · {{ taskLabel(task) }}
				<template v-if="issuedNumber">
					· <RouterLink
						:to="`/work/2/variant/${variant}`"
						class="underline underline-offset-2"
					>№ {{ issuedNumber }} на выданном листе</RouterLink>
				</template>
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
			:key="`${work.id}-${variant}-${task.id}`"
			:preset="preset"
		/>

		<nav class="flex justify-between gap-3 text-sm">
			<RouterLink
				v-if="siblings.prev"
				:to="`/work/${work.id}/variant/${variant}/task/${siblings.prev.id}`"
				class="btn-secondary"
			>
				← {{ taskNumber(siblings.prev) }}. {{ siblings.prev.title }}
			</RouterLink>
			<span v-else />
			<RouterLink
				v-if="siblings.next"
				:to="`/work/${work.id}/variant/${variant}/task/${siblings.next.id}`"
				class="btn-secondary"
			>
				{{ taskNumber(siblings.next) }}. {{ siblings.next.title }} →
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
