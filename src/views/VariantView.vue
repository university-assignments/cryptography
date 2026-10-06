<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import PhotoGallery from '@/components/PhotoGallery.vue';
import { photosOf } from '@/data/work-1/photos';
import { findVariant, type VariantPreset } from '@/data/work-1/variants';
import { CUSTOM_VARIANT, findWork, type TaskDef } from '@/data/works';

const props = defineProps<{ work: string; variant: string }>();
const work = computed(() => findWork(Number(props.work)));
const isCustom = computed(() => props.variant === CUSTOM_VARIANT);
const preset = computed(() =>
{
	if (isCustom.value) return undefined;

	return findVariant(Number(props.variant));
});
const photos = computed(() =>
{
	if (isCustom.value) return [];

	return photosOf(Number(props.variant));
});

function summary (task: TaskDef, p: VariantPreset): string
{
	switch (task.slug)
	{
		case 'hill':
			return `${p.hill.encrypt} · ${p.hill.decrypt}`;
		case 'square':
			return `${p.square.encrypt} · ${p.square.decrypt}`;
		case 'vigenere':
			return `K = ${p.vigenere.key} · ${p.vigenere.encrypt} · ${p.vigenere.decrypt}`;
		case 'caesar':
			return `Y = ${p.caesar.cipher}`;
		case 'playfair':
			return `K = ${p.playfair.key} · ${p.playfair.decrypt}`;
	}
}
</script>

<template>
	<div
		v-if="work && (isCustom || preset)"
		class="space-y-6"
	>
		<div>
			<p class="text-xs font-medium uppercase tracking-wide text-stone-500">
				{{ work.title }} · {{ work.subtitle }}
			</p>
			<h1 class="text-2xl font-semibold tracking-tight">
				{{ isCustom ? 'Свои данные' : `Вариант ${variant}` }}
			</h1>
		</div>

		<section class="grid gap-3 sm:grid-cols-2">
			<RouterLink
				v-for="task in work.tasks"
				:key="task.id"
				:to="`/work/${work.id}/variant/${variant}/task/${task.id}`"
				class="card transition hover:border-amber-400 hover:shadow-md"
			>
				<p class="text-xs font-medium uppercase tracking-wide text-stone-500">
					Задание {{ task.id }}
				</p>
				<h2 class="mt-1 font-semibold">
					{{ task.title }}
				</h2>
				<p
					v-if="preset"
					class="seq mt-2 text-stone-600 dark:text-stone-400"
				>
					{{ summary(task, preset) }}
				</p>
				<p
					v-else
					class="hint mt-2"
				>
					{{ task.subtitle }}
				</p>
			</RouterLink>
		</section>

		<section
			v-if="photos.length"
			class="space-y-2"
		>
			<h2 class="step-title">
				Условие и тетрадь
			</h2>
			<PhotoGallery
				:photos="photos"
				:gallery-id="`variant-${variant}`"
			/>
		</section>
	</div>
	<p
		v-else
		class="error"
	>
		Такого варианта нет.
	</p>
</template>
