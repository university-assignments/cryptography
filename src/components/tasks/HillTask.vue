<script setup lang="ts">
import { computed } from 'vue';
import FieldSelect from '@/components/FieldSelect.vue';
import ExprColumn from '@/components/ExprColumn.vue';
import FieldText from '@/components/FieldText.vue';
import MatrixView from '@/components/MatrixView.vue';
import ParenGroup from '@/components/ParenGroup.vue';
import ResetButton from '@/components/ResetButton.vue';
import RingName from '@/components/RingName.vue';
import SequenceLine from '@/components/SequenceLine.vue';
import StepCard from '@/components/StepCard.vue';
import TaskStatement from '@/components/TaskStatement.vue';
import TranslationLine from '@/components/TranslationLine.vue';
import VectorView from '@/components/VectorView.vue';
import { useQueryParam } from '@/composables/useQueryParam';
import type { VariantPreset } from '@/data/work-1/variants';
import {
	ALPHABET_LIST,
	ALPHABETS,
	alphabetGenitive,
	isAlphabetId,
} from '@/lib/alphabet';
import { rowExpression } from '@/lib/format';
import { type HillBlock, hillDecrypt, hillEncrypt } from '@/lib/hill';
import { modMatrix, parseMatrix, parseVector } from '@/lib/matrix';

const props = defineProps<{ preset?: VariantPreset }>();

const KEYS = [ 'alpha', 'a', 'b', 'text', 'cipher', 'pad' ];

const alpha = useQueryParam('alpha', 'lat');
const aText = useQueryParam('a', () =>
{
	if (props.preset) return props.preset.hill.a.map((row) => row.join(' ')).join('\n');

	return '';
});
const bText = useQueryParam('b', () =>
{
	if (props.preset) return props.preset.hill.b.join(' ');

	return '';
});
const text = useQueryParam('text', () => props.preset?.hill.encrypt ?? '');
const cipher = useQueryParam('cipher', () => props.preset?.hill.decrypt ?? '');
const pad = useQueryParam('pad', () => props.preset?.hill.pad ?? 'X');

const alphabet = computed(() => ALPHABETS[isAlphabetId(alpha.value)
	? alpha.value
	: 'lat']);
const m = computed(() => alphabet.value.letters.length);

const params = computed(() =>
{
	const a = parseMatrix(aText.value);

	if (!a) return { error: 'Матрица A: по строке на линию, числа через пробел или запятую.' };
	if (a.some((row) => row.length !== a.length)) return { error: 'Матрица A должна быть квадратной.' };

	const b = bText.value.trim()
		? parseVector(bText.value)
		: Array<number>(a.length).fill(0);

	if (!b) return { error: 'Вектор B: числа через пробел.' };
	if (b.length !== a.length) return { error: `Вектор B должен содержать ${a.length} чисел.` };

	return { a, b, alphabet: alphabet.value, pad: pad.value };
});

const encrypted = computed(() =>
{
	if ('error' in params.value || !text.value.trim()) return null;

	return hillEncrypt(text.value, params.value);
});
const decrypted = computed(() =>
{
	if ('error' in params.value || !cipher.value.trim()) return null;

	return hillDecrypt(cipher.value, params.value);
});

const blockSize = computed(() =>
{
	if ('error' in params.value) return 1;

	return params.value.a.length;
});

function encryptRows (block: HillBlock, b: number[]): string[]
{
	return block.product.rows.map((row, r) =>
	{
		const expression = rowExpression(row);

		if (!b[r]) return expression;

		return `${expression} + ${b[r]}`;
	});
}

function tuple (values: number[]): string
{
	return `(${values.join(', ')})`;
}

function blockTitle (block: HillBlock): string
{
	return `${tuple(block.input)} → ${tuple(block.output)}`;
}
</script>

<template>
	<div class="space-y-4">
		<section class="card grid gap-3 sm:grid-cols-2">
			<FieldText
				v-model="aText"
				label="Матрица A"
				multiline
				:rows="3"
				plain
				placeholder="0 3 3&#10;11 1 1&#10;1 4 5"
				hint="По строке на линию."
			/>
			<div class="space-y-3">
				<FieldText
					v-model="bText"
					label="Вектор B"
					plain
					placeholder="0 0 0"
					hint="Пусто — нули."
				/>
				<div class="grid grid-cols-2 gap-3">
					<FieldSelect
						v-model="alpha"
						label="Алфавит"
						:options="ALPHABET_LIST.map((item) => ({ value: item.id, label: item.label }))"
					/>
					<FieldText
						v-model="pad"
						label="Добивка"
						hint="Буква до длины, кратной размеру A."
					/>
				</div>
			</div>
			<FieldText
				v-model="text"
				label="а) Зашифровать"
				placeholder="DUMSPIROSPERO"
			/>
			<FieldText
				v-model="cipher"
				label="б) Расшифровать"
				placeholder="HLSUMCLABAWOMGCSXPLHRMJH"
			/>
			<div class="sm:col-span-2">
				<ResetButton :keys="KEYS" />
			</div>
		</section>

		<p
			v-if="'error' in params"
			class="error"
		>
			{{ params.error }}
		</p>

		<template v-else>
			<TaskStatement>
				Задан шифр Хилла с ключом
				A = <MatrixView :rows="params.a" />,
				B = <VectorView :values="params.b" />
				для {{ alphabetGenitive(alphabet) }} алфавита.
				<span
					v-if="text.trim()"
					class="block"
				>а) Зашифровать {{ text }}</span>
				<span
					v-if="cipher.trim()"
					class="block"
				>b) Расшифровать {{ cipher }}</span>
			</TaskStatement>

			<StepCard>
				<div class="flex flex-wrap items-center gap-6 text-sm">
					<RingName :alphabet="alphabet" />
					<span class="inline-flex items-center gap-2">A = <MatrixView :rows="params.a" /></span>
					<span class="inline-flex items-center gap-2">B = <VectorView :values="params.b" /></span>
				</div>
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
					title="а) Зашифровать: Y = A·X + B"
				>
					<p class="seq">
						X = {{ encrypted.source }}<span class="pad">{{ encrypted.padded.slice(encrypted.source.length) }}</span>
					</p>
					<SequenceLine
						label="X"
						:values="encrypted.x"
						:group="blockSize"
					/>
					<div
						v-for="(block, i) in encrypted.blocks"
						:key="i"
						class="space-y-1 border-t border-stone-100 pt-3 dark:border-stone-800"
					>
						<p class="seq">
							{{ blockTitle(block) }}
						</p>
						<div class="flex flex-wrap items-center gap-2 overflow-x-auto">
							<MatrixView :rows="params.a" />
							<span>·</span>
							<VectorView :values="block.input" />
							<span>+</span>
							<VectorView :values="params.b" />
							<span>=</span>
							<ExprColumn :rows="encryptRows(block, params.b)" />
							<span>=</span>
							<VectorView :values="block.output" />
						</div>
					</div>
					<SequenceLine
						label="Y"
						:values="encrypted.y"
					/>
					<p class="answer">
						Y = {{ encrypted.cipher }}
					</p>
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
					title="б) Расшифровать: X = A⁻¹·(Y − B)"
				>
					<p class="seq">
						Y = {{ decrypted.cipher }}
					</p>
					<SequenceLine
						label="Y"
						:values="decrypted.y"
						:group="blockSize"
					/>
					<div class="space-y-2 text-sm">
						<p class="seq">
							det A = {{ decrypted.inverse.detMod }}
						</p>
						<div class="flex flex-wrap items-center gap-6 overflow-x-auto">
							<span class="inline-flex items-center gap-2">Ã = <MatrixView :rows="modMatrix(decrypted.inverse.adjugate, m)" /></span>
							<span class="inline-flex items-center gap-2">A⁻¹ = {{ decrypted.inverse.detInverse }} · Ã = <MatrixView :rows="decrypted.inverse.inverse" /></span>
						</div>
					</div>
					<div
						v-for="(block, i) in decrypted.blocks"
						:key="i"
						class="space-y-1 border-t border-stone-100 pt-3 dark:border-stone-800"
					>
						<p class="seq">
							{{ blockTitle(block) }}
						</p>
						<div class="flex flex-wrap items-center gap-2 overflow-x-auto">
							<MatrixView :rows="decrypted.inverse.inverse" />
							<span>·</span>
							<ParenGroup>
								<VectorView :values="block.input" />
								<span>−</span>
								<VectorView :values="params.b" />
							</ParenGroup>
							<span>=</span>
							<ExprColumn :rows="block.product.rows.map(rowExpression)" />
							<span>=</span>
							<VectorView :values="block.output" />
						</div>
					</div>
					<SequenceLine
						label="X"
						:values="decrypted.x"
					/>
					<p class="answer">
						X = {{ decrypted.text }}
					</p>
					<TranslationLine :text="decrypted.text" />
				</StepCard>
			</template>
		</template>
	</div>
</template>
