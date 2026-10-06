<script setup lang="ts">
import { computed, ref } from 'vue';
import FieldSelect from '@/components/FieldSelect.vue';
import FieldText from '@/components/FieldText.vue';
import GridView from '@/components/GridView.vue';
import ResetButton from '@/components/ResetButton.vue';
import StepCard from '@/components/StepCard.vue';
import { useQueryParam } from '@/composables/useQueryParam';
import type { VariantPreset } from '@/data/work-1/variants';
import { ALPHABETS, isAlphabetId } from '@/lib/alphabet';
import {
	type PlayfairPair,
	type PlayfairResult,
	PAIR_RULE_LABELS,
	playfairDecrypt,
	playfairEncrypt,
} from '@/lib/playfair';

const props = defineProps<{ preset?: VariantPreset }>();

const KEYS = [ 'alpha', 'key', 'cipher', 'text', 'filler' ];
const ALPHA_OPTIONS = [ 'lat', 'ru32' ].map((id) => ({ value: id, label: ALPHABETS[id as 'lat' | 'ru32'].label }));

const alpha = useQueryParam('alpha', 'lat');
const key = useQueryParam('key', () => props.preset?.playfair.key ?? '');
const cipher = useQueryParam('cipher', () => props.preset?.playfair.decrypt ?? '');
const text = useQueryParam('text', '');
const filler = useQueryParam('filler', 'X');

const alphabet = computed(() => ALPHABETS[isAlphabetId(alpha.value) && alpha.value !== 'ru33'
	? alpha.value
	: 'lat']);

const decrypted = computed(() =>
{
	if (cipher.value.trim()) return playfairDecrypt(cipher.value, key.value, alphabet.value);

	return null;
});
const encrypted = computed(() =>
{
	if (text.value.trim()) return playfairEncrypt(text.value, key.value, alphabet.value, filler.value);

	return null;
});

const hovered = ref<PlayfairPair | null>(null);

function highlight (result: PlayfairResult): Set<string>
{
	const keys = new Set<string>();

	if (!hovered.value) return keys;

	for (const ch of hovered.value.input + hovered.value.output)
	{
		result.table.table.forEach((row, r) =>
		{
			const c = row.indexOf(ch);

			if (c >= 0) keys.add(`${r},${c}`);
		});
	}

	return keys;
}

const direction = (mode: 'encrypt' | 'decrypt', rule: PlayfairPair['rule']): string =>
{
	if (rule === 'rect') return 'меняем столбцы';
	if (rule === 'row') return mode === 'decrypt'
		? 'сдвиг влево'
		: 'сдвиг вправо';

	return mode === 'decrypt'
		? 'сдвиг вверх'
		: 'сдвиг вниз';
};
</script>

<template>
	<div class="space-y-4">
		<section class="card grid gap-3 sm:grid-cols-2">
			<FieldText
				v-model="key"
				label="Ключевое слово K"
				placeholder="CANIS"
			/>
			<div class="grid grid-cols-2 gap-3">
				<FieldSelect
					v-model="alpha"
					label="Алфавит"
					:options="ALPHA_OPTIONS"
				/>
				<FieldText
					v-model="filler"
					label="Разделитель"
					hint="Для шифрования."
				/>
			</div>
			<FieldText
				v-model="cipher"
				label="Расшифровать Y"
				placeholder="CDRSKGSCNBHOELNZ"
			/>
			<FieldText
				v-model="text"
				label="Зашифровать X (необязательно)"
				placeholder="AB UNO DISCE OMNES"
			/>
			<div class="sm:col-span-2">
				<ResetButton :keys="KEYS" />
			</div>
		</section>

		<template
			v-for="[title, result, mode] in [
				['Расшифровать', decrypted, 'decrypt'],
				['Зашифровать', encrypted, 'encrypt'],
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
				:title="title"
			>
				<div class="flex flex-wrap items-start gap-6">
					<div class="space-y-1">
						<p class="seq">
							K = {{ result.table.key }}<span
								v-if="result.table.layout.merged"
								class="text-stone-500"
							>, {{ result.table.layout.merged.from }} → {{ result.table.layout.merged.to }}</span>
						</p>
						<GridView
							:cells="result.table.table"
							:highlight="highlight(result)"
						/>
					</div>
					<ul class="seq space-y-0.5">
						<li
							v-for="(pair, i) in result.pairs"
							:key="i"
							class="cursor-default rounded px-1 hover:bg-stone-100 dark:hover:bg-stone-800"
							@mouseenter="hovered = pair"
							@mouseleave="hovered = null"
							@click="hovered = hovered === pair ? null : pair"
						>
							{{ pair.input }} → <span class="font-semibold">{{ pair.output }}</span>
							<span class="text-stone-500"> — {{ PAIR_RULE_LABELS[pair.rule] }}, {{ direction(mode, pair.rule) }}</span>
						</li>
					</ul>
				</div>
				<p
					v-if="mode === 'encrypt'"
					class="seq"
				>
					Биграммы: {{ result.source.match(/.{2}/gu)?.join(' ') }}
				</p>
				<p class="answer">
					{{ mode === 'decrypt' ? 'X' : 'Y' }} = {{ result.result }}
				</p>
			</StepCard>
		</template>
	</div>
</template>
