<script setup lang="ts">
defineProps<{
	label: string;
	options: { value: string; label: string }[];
}>();

const model = defineModel<string>({ required: true });
</script>

<template>
	<label class="block">
		<span class="label">{{ label }}</span>
		<select
			v-model="model"
			class="input-plain"
		>
			<option
				v-for="option in options"
				:key="option.value"
				:value="option.value"
			>
				{{ option.label }}
			</option>
		</select>
	</label>
</template>
