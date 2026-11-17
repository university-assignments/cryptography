<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import PhotoGallery from '@/components/PhotoGallery.vue';
import TexMath from '@/components/TexMath.vue';
import { type Photo, photosOf } from '@/data/work-1/photos';
import { findVariant, type VariantPreset } from '@/data/work-1/variants';
import { photosOf2 } from '@/data/work-2/photos';
import {
	type Variant2Preset,
	findVariant2,
	parseCoefs,
	parseList,
} from '@/data/work-2/variants';
import {
	type TaskDef,
	CUSTOM_VARIANT,
	findWork,
	taskLabel,
} from '@/data/works';
import { findFieldPoly, maskTex, parseElement } from '@/lib/gf16';
import { recurrenceTex } from '@/lib/lrs-format';

const props = defineProps<{ work: string; variant: string }>();
const work = computed(() => findWork(Number(props.work)));
const isCustom = computed(() => props.variant === CUSTOM_VARIANT);
const isSecond = computed(() => work.value?.id === 2);

const preset = computed(() =>
{
	if (isCustom.value || isSecond.value) return undefined;

	return findVariant(Number(props.variant));
});
const preset2 = computed(() =>
{
	if (isCustom.value || !isSecond.value) return undefined;

	return findVariant2(Number(props.variant));
});
const found = computed(() => isCustom.value || Boolean(preset.value ?? preset2.value));

interface Group
{

	/** Номер части; 0 — работа без частей. */
	part: number;
	title: string;
	tasks: TaskDef[];
	photos: Photo[];
}

/** Задания и фото по частям: у каждой части свой лист заданий и своя тетрадь. */
const groups = computed<Group[]>(() =>
{
	if (!work.value) return [];

	const number = Number(props.variant);

	if (!work.value.parts)
	{
		return [
			{
				part: 0,
				title: '',
				tasks: work.value.tasks,
				photos: isCustom.value
					? []
					: photosOf(number),
			},
		];
	}

	const photos = isCustom.value
		? []
		: photosOf2(number);

	return work.value.parts.map((part) => ({
		part: part.id,
		title: part.title,
		tasks: work.value!.tasks.filter((task) => task.part === part.id),
		photos: photos.find((item) => item.part === part.id)?.photos ?? [],
	}));
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
		default:
			return task.subtitle;
	}
}

/** Краткое условие задания второй работы — формулой. */
function summary2 (task: TaskDef, p: Variant2Preset): { tex: string; text: string }
{
	switch (task.slug)
	{
		case 'lrs-minimal':
			return { tex: `Z_{${p.minimal.p}}:\\ (${parseList(p.minimal.period).join(',')},\\dots)`, text: '' };
		case 'lrs-cipher':
			return { tex: recurrenceTex(parseCoefs(p.stream.coefs)), text: `${p.stream.encrypt} · ${p.stream.decrypt}` };
		case 'field-poly':
		{
			const g = findFieldPoly(p.field.g).mask;

			return { tex: `g(x)=${maskTex(g, 'x')},\\ \\beta=${maskTex(parseElement(p.field.beta, g) ?? 0)}`, text: '' };
		}
		default:
			return { tex: '', text: task.subtitle };
	}
}
</script>

<template>
	<div
		v-if="work && found"
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

		<div
			v-for="group in groups"
			:key="group.part"
			class="space-y-4"
		>
			<h2
				v-if="group.title"
				class="border-b border-stone-200 pb-1 text-lg font-semibold dark:border-stone-800"
			>
				{{ group.title }}
			</h2>

			<section class="grid gap-3 sm:grid-cols-2">
				<RouterLink
					v-for="task in group.tasks"
					:key="task.id"
					:to="`/work/${work.id}/variant/${variant}/task/${task.id}`"
					class="card transition hover:border-amber-400 hover:shadow-md"
				>
					<p class="text-xs font-medium uppercase tracking-wide text-stone-500">
						{{ group.part ? `Задание ${task.number}` : taskLabel(task) }}
					</p>
					<h3 class="mt-1 font-semibold">
						{{ task.title }}
					</h3>
					<p
						v-if="preset"
						class="seq mt-2 text-stone-600 dark:text-stone-400"
					>
						{{ summary(task, preset) }}
					</p>
					<div
						v-else-if="preset2"
						class="mt-2 space-y-1 text-stone-600 dark:text-stone-400"
					>
						<p
							v-if="summary2(task, preset2).tex"
							class="overflow-x-auto text-sm"
						>
							<TexMath :tex="summary2(task, preset2).tex" />
						</p>
						<p
							v-if="summary2(task, preset2).text"
							class="seq"
						>
							{{ summary2(task, preset2).text }}
						</p>
					</div>
					<p
						v-else
						class="hint mt-2"
					>
						{{ task.subtitle }}
					</p>
				</RouterLink>
			</section>

			<section
				v-if="group.photos.length"
				class="space-y-2"
			>
				<h3 class="step-title">
					Условие и тетрадь
				</h3>
				<PhotoGallery
					:photos="group.photos"
					:gallery-id="`variant-${variant}-part-${group.part}`"
				/>
			</section>
		</div>
	</div>
	<p
		v-else
		class="error"
	>
		Такого варианта нет.
	</p>
</template>
