<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { CUSTOM_VARIANT, findWork } from '@/data/works';

const props = defineProps<{ work: string }>();
const work = computed(() => findWork(Number(props.work)));
const variants = computed(() =>
{
	if (work.value) return [ ...Array(work.value.variants).keys() ].map((i) => i + 1);

	return [];
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
					Те же задания с пустыми полями: матрица, ключи, тексты, алфавит — всё задаётся вручную.
				</p>
			</RouterLink>
		</section>

		<section class="card space-y-2 text-sm">
			<h2 class="step-title">
				Задания
			</h2>
			<ol class="list-inside list-decimal space-y-1">
				<li
					v-for="task in work.tasks"
					:key="task.id"
				>
					<span class="font-medium">{{ task.title }}</span>
					<span class="hint"> — {{ task.subtitle }}</span>
				</li>
			</ol>
		</section>
	</div>
	<p
		v-else
		class="error"
	>
		Такой работы нет.
	</p>
</template>
