<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { hasAccess } from '@/composables/useAccess';
import { type WorkDef, SUBJECT, WORKS } from '@/data/works';

/** 1 задание, 3 задания, 5 заданий. */
function plural (count: number, forms: [string, string, string]): string
{
	const tail = count % 100;
	const last = count % 10;

	if (tail >= 11 && tail <= 14) return `${count} ${forms[2]}`;
	if (last === 1) return `${count} ${forms[0]}`;

	return `${count} ${last >= 2 && last <= 4
		? forms[1]
		: forms[2]}`;
}

function summary (work: WorkDef): string
{
	const parts = work.parts
		? `${plural(work.parts.length, [ 'часть', 'части', 'частей' ])} · `
		: '';

	return `${parts}${plural(work.tasks.length, [ 'задание', 'задания', 'заданий' ])} · ${plural(work.variants, [ 'вариант', 'варианта', 'вариантов' ])} · свои данные`;
}
</script>

<template>
	<div class="space-y-6">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">
				{{ SUBJECT.full }}
			</h1>
			<p class="hint mt-1">
				{{ SUBJECT.year }}, {{ SUBJECT.form }} форма, {{ SUBJECT.teacher }}. Решения считаются автоматически и расписываются по шагам — как в тетради.
			</p>
		</div>

		<section class="grid gap-3 sm:grid-cols-2">
			<template
				v-for="work in WORKS"
				:key="work.id"
			>
				<RouterLink
					v-if="hasAccess(work)"
					:to="`/work/${work.id}`"
					class="card transition hover:border-amber-400 hover:shadow-md"
				>
					<p class="text-xs font-medium uppercase tracking-wide text-stone-500">
						{{ work.title }}
					</p>
					<h2 class="mt-1 text-lg font-semibold">
						{{ work.subtitle }}
					</h2>
					<p class="hint mt-2">
						{{ summary(work) }}
					</p>
				</RouterLink>

				<!-- Закрытая работа видна в списке, но не открывается: доступ даёт ссылка с ?work=… -->
				<div
					v-else
					class="card cursor-not-allowed opacity-60"
					aria-disabled="true"
				>
					<p class="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-stone-500">
						<span>{{ work.title }}</span>
						<span class="rounded-full border border-stone-300 px-2 py-0.5 normal-case tracking-normal dark:border-stone-700">🔒 нет доступа</span>
					</p>
					<h2 class="mt-1 text-lg font-semibold">
						{{ work.subtitle }}
					</h2>
					<p class="hint mt-2">
						{{ summary(work) }}
					</p>
					<p class="hint mt-1">
						Открывается по отдельной ссылке.
					</p>
				</div>
			</template>
		</section>
	</div>
</template>
