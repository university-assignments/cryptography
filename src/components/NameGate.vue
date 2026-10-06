<script setup lang="ts">
import { ref } from 'vue';
import { useName } from '@/composables/useName';
import { SUBJECT } from '@/data/works';

const { setName } = useName();
const draft = ref('');

const submit = (): void =>
{
	if (draft.value.trim()) setName(draft.value);
};
</script>

<template>
	<div class="flex min-h-screen items-center justify-center px-4">
		<form
			class="card w-full max-w-md space-y-4"
			@submit.prevent="submit"
		>
			<div>
				<p class="text-xs font-medium uppercase tracking-wide text-stone-500">
					{{ SUBJECT.year }} · {{ SUBJECT.short }}
				</p>
				<h1 class="mt-1 text-xl font-semibold tracking-tight">
					{{ SUBJECT.full }}
				</h1>
				<p class="hint mt-1">
					{{ SUBJECT.form }}, {{ SUBJECT.teacher }}
				</p>
			</div>

			<div>
				<label
					for="name"
					class="label"
				>Ваше имя</label>
				<input
					id="name"
					v-model="draft"
					class="input-plain"
					type="text"
					autocomplete="name"
					autofocus
					required
				>
				<p class="hint mt-2">
					Ваше имя используется для создания псевдорандома решения задач, которые можно решить несколькими способами.
				</p>
			</div>

			<button
				type="submit"
				class="btn w-full"
				:disabled="!draft.trim()"
			>
				Войти
			</button>
		</form>
	</div>
</template>
