<script setup lang="ts">
import { useQueryReset } from '@/composables/useQueryParam';

const props = defineProps<{ keys: string[] }>();
const { dirty, reset } = useQueryReset(props.keys);
</script>

<template>
	<button
		v-if="dirty"
		type="button"
		class="btn-secondary"
		@click="reset"
	>
		Сбросить к условию
	</button>
</template>
