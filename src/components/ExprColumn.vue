<script setup lang="ts">
defineProps<{ rows: string[] }>();
</script>

<template>
	<span class="inline-flex items-stretch align-middle">
		<span class="w-1.5 rounded-l border-y border-l border-current" />
		<span class="flex flex-col gap-y-0.5 px-1.5 py-0.5 font-mono text-sm">
			<span
				v-for="(row, i) in rows"
				:key="i"
				class="whitespace-nowrap text-center"
			>{{ row }}</span>
		</span>
		<span class="w-1.5 rounded-r border-y border-r border-current" />
	</span>
</template>
