<script setup lang="ts">
import { computed } from 'vue';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const props = defineProps<{ tex: string; display?: boolean }>();

/* Формулы задаёт только код сайта, не пользователь: throwOnError=false, trust=false. */
const html = computed(() => katex.renderToString(props.tex, {
	displayMode: props.display ?? false,
	throwOnError: false,
	trust: false,
}));
</script>

<template>
	<!-- eslint-disable-next-line vue/no-v-html -- разметка KaTeX из строки, заданной кодом -->
	<span v-html="html" />
</template>
