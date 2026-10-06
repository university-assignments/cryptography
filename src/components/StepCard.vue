<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<template>
	<section class="card space-y-3">
		<h3 class="step-title">
			{{ title }}
		</h3>
		<slot />
	</section>
</template>
