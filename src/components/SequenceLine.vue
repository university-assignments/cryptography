<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
	label: string;
	values: number[];

	/** Размер блока — между блоками ставится «|». */
	group?: number;

	/** Буквы, соответствующие числам (показываются той же строкой ниже). */
	letters?: string;
}>();

const text = computed(() =>
{
	const { group } = props;

	if (!group || group <= 0) return props.values.join(', ');

	const chunks: string[] = [];

	for (let i = 0; i < props.values.length; i += group) chunks.push(props.values.slice(i, i + group).join(', '));

	return chunks.join(' | ');
});
</script>

<template>
	<div class="seq">
		<span class="font-semibold">{{ label }}</span> = ({{ text }})
		<span
			v-if="letters"
			class="block text-stone-500 dark:text-stone-400"
		>{{ label.toUpperCase() }} = {{ letters }}</span>
	</div>
</template>
