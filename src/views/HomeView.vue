<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { SUBJECT, WORKS } from '@/data/works';
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
			<RouterLink
				v-for="work in WORKS"
				:key="work.id"
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
					{{ work.tasks.length }} заданий · {{ work.variants }} вариантов · свои данные
				</p>
			</RouterLink>
		</section>
	</div>
</template>
