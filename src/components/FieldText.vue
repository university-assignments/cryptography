<script setup lang="ts">
withDefaults(defineProps<{
	label: string;
	hint?: string;
	multiline?: boolean;
	rows?: number;

	/** Без принудительного верхнего регистра. */
	plain?: boolean;
	placeholder?: string;
}>(), { hint: '', multiline: false, rows: 2, plain: false, placeholder: '' });

const model = defineModel<string>({ required: true });
</script>

<template>
	<label class="block">
		<span class="label">{{ label }}</span>
		<textarea
			v-if="multiline"
			v-model="model"
			:rows="rows"
			:placeholder="placeholder"
			:class="plain ? 'input-plain font-mono' : 'input'"
			spellcheck="false"
			autocapitalize="off"
		/>
		<input
			v-else
			v-model="model"
			type="text"
			:placeholder="placeholder"
			:class="plain ? 'input-plain font-mono' : 'input'"
			spellcheck="false"
			autocapitalize="off"
		>
		<span
			v-if="hint"
			class="hint mt-1 block"
		>{{ hint }}</span>
	</label>
</template>
