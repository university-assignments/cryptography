<script setup lang="ts">
import { computed } from 'vue';
import FieldSelect from '@/components/FieldSelect.vue';
import FieldText from '@/components/FieldText.vue';
import ResetButton from '@/components/ResetButton.vue';
import SequenceLine from '@/components/SequenceLine.vue';
import StepCard from '@/components/StepCard.vue';
import TaskStatement from '@/components/TaskStatement.vue';
import { useQueryParam } from '@/composables/useQueryParam';
import { translateWord } from '@/data/translations';
import type { VariantPreset } from '@/data/work-1/variants';
import {
	ALPHABET_LIST,
	ALPHABETS,
	alphabetGenitive,
	isAlphabetId,
} from '@/lib/alphabet';
import { caesarTable } from '@/lib/caesar';

const props = defineProps<{ preset?: VariantPreset }>();

const KEYS = [ 'alpha', 'cipher' ];

const alpha = useQueryParam('alpha', 'lat');
const cipher = useQueryParam('cipher', () => props.preset?.caesar.cipher ?? '');

const alphabet = computed(() => ALPHABETS[isAlphabetId(alpha.value)
	? alpha.value
	: 'lat']);

const table = computed(() =>
{
	if (!cipher.value.trim()) return null;

	return caesarTable(cipher.value, alphabet.value);
});
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
				title="Найти ключ и расшифровать: x = y − k"
			>
				<p class="seq">
					Y = {{ table.cipher }}
				</p>
				<SequenceLine
					label="y"
					:values="table.y"
				/>
				<div class="overflow-x-auto">
					<table class="font-mono text-sm">
						<tbody>
							<tr
								v-for="row in table.rows"
								:key="row.k"
								:class="translateWord(row.text) ? 'bg-amber-50 font-semibold dark:bg-amber-950/40' : ''"
							>
								<td class="py-0.5 pr-4 pl-1 whitespace-nowrap">
									k = {{ row.k }}
								</td>
								<td class="py-0.5 pr-4 whitespace-nowrap">
									({{ row.indices.join(', ') }})
								</td>
								<td class="py-0.5 pr-4 tracking-widest">
									{{ row.text }}
								</td>
								<td class="py-0.5 pr-2 font-sans whitespace-nowrap">
									<template v-if="translateWord(row.text)">
										— {{ translateWord(row.text) }}
									</template>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</StepCard>
		</template>
	</div>
</template>
