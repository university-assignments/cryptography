<script setup lang="ts">
import { computed } from 'vue';
import FieldSelect from '@/components/FieldSelect.vue';
import FieldText from '@/components/FieldText.vue';
import ResetButton from '@/components/ResetButton.vue';
import SequenceLine from '@/components/SequenceLine.vue';
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
import { caesarShift, caesarTable } from '@/lib/caesar';

const props = defineProps<{ preset?: VariantPreset }>();

const KEYS = [ 'alpha', 'cipher', 'text', 'k', 'pick' ];

const alpha = useQueryParam('alpha', 'lat');
const cipher = useQueryParam('cipher', () => props.preset?.caesar.cipher ?? '');
const text = useQueryParam('text', '');
const kText = useQueryParam('k', '');
const picked = useQueryParam('pick', '');

const alphabet = computed(() => ALPHABETS[isAlphabetId(alpha.value)
	? alpha.value
	: 'lat']);
const m = computed(() => alphabet.value.letters.length);

const table = computed(() =>
{
	if (!cipher.value.trim()) return null;

	return caesarTable(cipher.value, alphabet.value);
});

const k = computed(() =>
{
	const value = Number(kText.value);

	return Number.isInteger(value)
		? (value % m.value + m.value) % m.value
		: 0;
});
const encrypted = computed(() =>
{
	if (!text.value.trim()) return null;

	return caesarShift(text.value, k.value, alphabet.value);
});

const pickedRow = computed(() =>
{
	if (!table.value?.ok || picked.value === '') return undefined;

	return table.value.rows[Number(picked.value)];
});

const choose = (index: number): void =>
{
	picked.value = picked.value === String(index)
		? ''
		: String(index);
};
</script>

<template>
	<div class="space-y-4">
		<section class="card grid gap-3 sm:grid-cols-2">
			<FieldText
				v-model="cipher"
				label="Найти ключ и расшифровать Y"
				placeholder="NKLNL"
			/>
			<FieldSelect
				v-model="alpha"
				label="Алфавит"
				:options="ALPHABET_LIST.map((item) => ({ value: item.id, label: item.label }))"
			/>
			<FieldText
				v-model="text"
				label="Зашифровать с ключом k (необязательно)"
				placeholder="URSUS"
			/>
			<FieldText
				v-model="kText"
				label="k"
				plain
				placeholder="19"
			/>
			<div class="sm:col-span-2">
				<ResetButton :keys="KEYS" />
			</div>
		</section>

		<TaskStatement>
			Используется шифр Цезаря для {{ alphabetGenitive(alphabet) }} алфавита. Найти ключ и расшифровать сообщение
			<span class="block">Y={{ cipher }}</span>
		</TaskStatement>

		<template v-if="table">
			<p
				v-if="!table.ok"
				class="error"
			>
				{{ table.error }}
			</p>
			<StepCard
				v-else
				:title="`Перебор ключей: x = y − k`"
			>
				<SequenceLine
					label="y"
					:values="table.y"
					:letters="table.cipher"
				/>
				<p class="note">
					нажмите на строку с осмысленным словом — она станет ответом
				</p>
				<div class="overflow-x-auto">
					<table class="w-full font-mono text-sm">
						<tbody>
							<tr
								v-for="row in table.rows"
								:key="row.k"
								class="cursor-pointer border-b border-stone-100 hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-800/60"
								:class="pickedRow?.k === row.k ? 'bg-amber-50 font-semibold dark:bg-amber-950/40' : ''"
								@click="choose(row.k)"
							>
								<td class="whitespace-nowrap py-1 pr-3">
									k = {{ row.k }}
								</td>
								<td class="whitespace-nowrap py-1 pr-3 text-stone-500">
									({{ row.indices.join(', ') }})
								</td>
								<td class="py-1 tracking-widest">
									{{ row.text }}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
				<p
					v-if="pickedRow"
					class="answer"
				>
					k = {{ pickedRow.k }}, X = {{ pickedRow.text }}
				</p>
			</StepCard>
		</template>

		<StepCard
			v-if="encrypted"
			:title="`Зашифровать: y = x + ${k}`"
		>
			<SequenceLine
				label="x"
				:values="encrypted.x"
				:letters="encrypted.source"
			/>
			<SequenceLine
				label="y"
				:values="encrypted.y"
			/>
			<p class="answer">
				Y = {{ encrypted.result }}
			</p>
		</StepCard>
	</div>
</template>
