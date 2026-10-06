<script setup lang="ts">
import { computed } from 'vue';
import { translatePhrase } from '@/data/translations';

const props = defineProps<{ text: string }>();
const translation = computed(() => translatePhrase(props.text));
</script>

<template>
	<p
		v-if="translation"
		class="text-base italic"
	>
		„{{ translation }}“
	</p>
</template>
