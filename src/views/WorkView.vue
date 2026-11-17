<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { type TaskDef, CUSTOM_VARIANT, findWork } from '@/data/works';

const props = defineProps<{ work: string }>();
const work = computed(() => findWork(Number(props.work)));
const variants = computed(() =>
{
	if (work.value) return [ ...Array(work.value.variants).keys() ].map((i) => i + 1);

	return [];
});

/** Задания по частям; работа без частей — одна группа без заголовка. */
const groups = computed<{ title: string; tasks: TaskDef[] }[]>(() =>
{
	if (!work.value) return [];
	if (!work.value.parts) return [{ title: '', tasks: work.value.tasks }];

	return work.value.parts.map((part) => ({ title: part.title, tasks: work.value!.tasks.filter((task) => task.part === part.id) }));
});
</script>

<template>
	<div
		v-if="work"
		class="space-y-6"
	>
		<div>
			<p class="text-xs font-medium uppercase tracking-wide text-stone-500">
				{{ work.title }}
			</p>
			<h1 class="text-2xl font-semibold tracking-tight">
				{{ work.subtitle }}
			</h1>
		</div>

		<section>
			<h2 class="step-title">
				Вариант
			</h2>
			<div class="grid grid-cols-3 gap-3 sm:grid-cols-6">
				<RouterLink
					v-for="variant in variants"
					:key="variant"
					:to="`/work/${work.id}/variant/${variant}`"
					class="card flex aspect-square items-center justify-center text-3xl font-semibold transition hover:border-amber-400 hover:shadow-md"
				>
					{{ variant }}
				</RouterLink>
			</div>
		</section>

		<section>
			<RouterLink
				:to="`/work/${work.id}/variant/${CUSTOM_VARIANT}`"
				class="card block transition hover:border-amber-400 hover:shadow-md"
			>
				<h2 class="text-lg font-semibold">
					Свои данные
				</h2>
				<p class="hint mt-1">
					Те же задания с пустыми полями — все данные условия задаются вручную.
				</p>
			</RouterLink>
		</section>

		<section class="card space-y-2 text-sm">
			<h2 class="step-title">
				Задания
			</h2>
			<template
				v-for="group in groups"
				:key="group.title"
			>
				<h3
					v-if="group.title"
					class="pt-1 text-xs font-medium uppercase tracking-wide text-stone-500"
				>
					{{ group.title }}
				</h3>
				<ol class="list-inside list-decimal space-y-1">
					<li
						v-for="task in group.tasks"
						:key="task.id"
					>
						<span class="font-medium">{{ task.title }}</span>
						<span class="hint"> — {{ task.subtitle }}</span>
					</li>
				</ol>
			</template>
		</section>
	</div>
	<p
		v-else
		class="error"
	>
		Такой работы нет.
	</p>
</template>
