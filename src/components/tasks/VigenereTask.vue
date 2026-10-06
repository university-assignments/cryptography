<script setup lang="ts">
import { computed } from 'vue';
import ColumnSum from '@/components/ColumnSum.vue';
import FieldSelect from '@/components/FieldSelect.vue';
import FieldText from '@/components/FieldText.vue';
import ResetButton from '@/components/ResetButton.vue';
import RingName from '@/components/RingName.vue';
import StepCard from '@/components/StepCard.vue';
import TaskStatement from '@/components/TaskStatement.vue';
import { useQueryParam } from '@/composables/useQueryParam';
import type { VariantPreset } from '@/data/work-1/variants';
import {
	ALPHABET_LIST,
	ALPHABETS,
	alphabetGenitive,
	isAlphabetId,
} from '@/lib/alphabet';
import {
	type Feedback,
	type VigenereResult,
	autokeyDecrypt,
	autokeyEncrypt,
	FEEDBACKS,
} from '@/lib/vigenere';

const props = defineProps<{ preset?: VariantPreset }>();

const KEYS = [ 'alpha', 'key', 'text', 'cipher', 'fb' ];

const alpha = useQueryParam('alpha', 'lat');
const key = useQueryParam('key', () => props.preset?.vigenere.key ?? '');
const text = useQueryParam('text', () => props.preset?.vigenere.encrypt ?? '');
const cipher = useQueryParam('cipher', () => props.preset?.vigenere.decrypt ?? '');
const fb = useQueryParam('fb', 'plain');

const alphabet = computed(() => ALPHABETS[isAlphabetId(alpha.value)
	? alpha.value
	: 'lat']);
const feedback = computed<Feedback>(() =>
{
	if (fb.value === 'cipher') return 'cipher';

	return 'plain';
});

const encrypted = computed(() =>
{
	if (text.value.trim()) return autokeyEncrypt(text.value, key.value, alphabet.value, feedback.value);

	return null;
});
const decrypted = computed(() =>
{
	if (cipher.value.trim()) return autokeyDecrypt(cipher.value, key.value, alphabet.value, feedback.value);

	return null;
});

function keyLetters (result: VigenereResult): string
{
	return result.k.map((v) => alphabet.value.letters[v]!).join('');
}
</script>

<template>
	<div class="space-y-4">
		<section class="card grid gap-3 sm:grid-cols-2">
			<FieldText
				v-model="key"
				label="Ключевое слово K"
				placeholder="DOG"
			/>
			<div class="grid grid-cols-2 gap-3">
				<FieldSelect
					v-model="alpha"
					label="Алфавит"
					:options="ALPHABET_LIST.map((item) => ({ value: item.id, label: item.label }))"
				/>
				<FieldSelect
					v-model="fb"
					label="Обратная связь"
					:options="FEEDBACKS.map((item) => ({ value: item.id, label: item.label }))"
				/>
			</div>
			<FieldText
				v-model="text"
				label="а) Зашифровать"
				placeholder="FORTESFORTUNAADIUVAT"
			/>
			<FieldText
				v-model="cipher"
				label="б) Расшифровать"
				placeholder="KISHHGMRLDEIVEJX"
			/>
			<div class="sm:col-span-2">
				<ResetButton :keys="KEYS" />
			</div>
		</section>

		<TaskStatement>
			Используется шифр Виженера с обратной связью для {{ alphabetGenitive(alphabet) }} алфавита с ключевым словом K={{ key.toUpperCase() }}
			<span
				v-if="text.trim()"
				class="block"
			>а) зашифровать {{ text }}</span>
			<span
				v-if="cipher.trim()"
				class="block"
			>b) расшифровать {{ cipher }}</span>
		</TaskStatement>

		<StepCard>
			<p class="seq flex items-center gap-6">
				<span>K = {{ key.toUpperCase() }}</span>
				<RingName :alphabet="alphabet" />
			</p>
		</StepCard>

		<template v-if="encrypted">
			<p
				v-if="!encrypted.ok"
				class="error"
			>
				{{ encrypted.error }}
			</p>
			<StepCard
				v-else
				title="а) Зашифровать: y = x + k"
			>
				<ColumnSum
					op="+"
					:top="{ name: 'X', letters: encrypted.text, values: encrypted.x }"
					:stream="{ name: 'K', letters: keyLetters(encrypted), values: encrypted.k }"
					:result="{ name: 'Y', letters: encrypted.cipher, values: encrypted.y }"
					:keyword="encrypted.key.length"
				/>
			</StepCard>
		</template>

		<template v-if="decrypted">
			<p
				v-if="!decrypted.ok"
				class="error"
			>
				{{ decrypted.error }}
			</p>
			<StepCard
				v-else
				title="б) Расшифровать: x = y − k"
			>
				<ColumnSum
					op="−"
					:top="{ name: 'Y', letters: decrypted.cipher, values: decrypted.y }"
					:stream="{ name: 'K', letters: keyLetters(decrypted), values: decrypted.k }"
					:result="{ name: 'X', letters: decrypted.text, values: decrypted.x }"
					:keyword="decrypted.key.length"
				/>
			</StepCard>
		</template>
	</div>
</template>
