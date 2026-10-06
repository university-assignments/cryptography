<script setup lang="ts">
import { computed } from 'vue';
import FieldSelect from '@/components/FieldSelect.vue';
import FieldText from '@/components/FieldText.vue';
import ResetButton from '@/components/ResetButton.vue';
import SequenceLine from '@/components/SequenceLine.vue';
import StepCard from '@/components/StepCard.vue';
import { useQueryParam } from '@/composables/useQueryParam';
import type { VariantPreset } from '@/data/work-1/variants';
import { ALPHABET_LIST, ALPHABETS, isAlphabetId } from '@/lib/alphabet';
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
const m = computed(() => alphabet.value.letters.length);

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

interface Row
{
	label: string;
	letters: string[];
	values: number[];
	tail?: number;
}

function rows (result: VigenereResult, mode: 'encrypt' | 'decrypt'): Row[]
{
	const keyLetters = result.k.map((v) => alphabet.value.letters[v]!);
	const x = { label: 'x', letters: [ ...result.text ], values: result.x };
	const k = { label: 'k', letters: keyLetters, values: result.k, tail: result.key.length };
	const y = { label: 'y', letters: [ ...result.cipher ], values: result.y };

	return mode === 'encrypt'
		? [ x, k, y ]
		: [ y, k, x ];
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

		<template
			v-for="[title, result, mode, formula] in [
				['а) Зашифровать', encrypted, 'encrypt', 'y = x + k (mod m)'],
				['б) Расшифровать', decrypted, 'decrypt', 'x = y − k (mod m)'],
			] as const"
			:key="title"
		>
			<p
				v-if="result && !result.ok"
				class="error"
			>
				{{ result.error }}
			</p>
			<StepCard
				v-else-if="result"
				:title="`${title}: ${formula}, m = ${m}`"
			>
				<p class="hint">
					Ключевой поток: K = {{ result.key }}, дальше — {{ feedback === 'plain' ? 'открытый текст' : 'шифртекст' }} с начала.
				</p>
				<div class="overflow-x-auto">
					<table class="font-mono text-xs">
						<tbody>
							<tr
								v-for="row in rows(result, mode)"
								:key="row.label"
								class="border-b border-stone-100 last:border-0 dark:border-stone-800"
							>
								<th class="pr-2 text-left font-semibold">
									{{ row.label }}
								</th>
								<td
									v-for="(value, i) in row.values"
									:key="i"
									class="px-1 py-0.5 text-center"
									:class="row.tail !== undefined && i < row.tail ? 'text-amber-700 dark:text-amber-300' : ''"
								>
									<span class="block">{{ row.letters[i] }}</span>
									<span class="block text-stone-500">{{ value }}</span>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
				<SequenceLine
					v-for="row in rows(result, mode)"
					:key="row.label"
					:label="row.label"
					:values="row.values"
				/>
				<p class="answer">
					{{ mode === 'encrypt' ? `Y = ${result.cipher}` : `X = ${result.text}` }}
				</p>
			</StepCard>
		</template>
	</div>
</template>
