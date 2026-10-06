<script setup lang="ts">
import { computed } from 'vue';
import FieldSelect from '@/components/FieldSelect.vue';
import FieldText from '@/components/FieldText.vue';
import GridEditor from '@/components/GridEditor.vue';
import GridView from '@/components/GridView.vue';
import MatrixView from '@/components/MatrixView.vue';
import ResetButton from '@/components/ResetButton.vue';
import StepCard from '@/components/StepCard.vue';
import TaskStatement from '@/components/TaskStatement.vue';
import TranslationLine from '@/components/TranslationLine.vue';
import TexMath from '@/components/TexMath.vue';
import { useName } from '@/composables/useName';
import { useQueryParam } from '@/composables/useQueryParam';
import { translatePhrase } from '@/data/translations';
import type { VariantPreset } from '@/data/work-1/variants';
import { sub } from '@/lib/format';
import { pick } from '@/lib/hash';
import {
	type PairEquation,
	type RouteMode,
	type RouteResult,
	type SingleStep,
	type Square,
	analyze,
	applyRoute,
	cellName,
	parseGrid,
	prepareRouteText,
	ROUTE_MODES,
	serializeGrid,
	solve,
} from '@/lib/magic-square';

const props = defineProps<{ preset?: VariantPreset }>();

const KEYS = [ 'n', 'grid', 'text', 'cipher', 'pad' ];
const SIZES = [ 3, 4 ].map((v) => ({ value: String(v), label: `${v}×${v}` }));

const { seed } = useName();

const nText = useQueryParam('n', '4');
const n = computed(() =>
{
	if (nText.value === '3') return 3;

	return 4;
});
const gridText = useQueryParam('grid', () => props.preset?.square.grid ?? serializeGrid(Array.from({ length: n.value }, () => Array(n.value).fill(null))));
const text = useQueryParam('text', () => props.preset?.square.encrypt ?? '');
const cipher = useQueryParam('cipher', () => props.preset?.square.decrypt ?? '');
const pad = useQueryParam('pad', () => props.preset?.square.pad ?? 'А');

const grid = computed(() => parseGrid(gridText.value, n.value));
const analysis = computed(() =>
{
	if (grid.value) return analyze(grid.value);

	return null;
});
const solution = computed(() =>
{
	if (grid.value) return solve(grid.value);

	return { solutions: [] as Square[], error: 'Введите известные клетки квадрата.' };
});
const squares = computed(() => solution.value.solutions);
const chosen = computed(() => pick(seed.value, squares.value.length));

const encryptBlocks = computed(() =>
{
	if (text.value.trim()) return prepareRouteText(text.value, n.value, pad.value);

	return null;
});

/* Способ обхода для а) тоже выбирается по имени — у разных людей разные решения. */
const primaryMode = computed(() => pick(Math.floor(seed.value / 2), ROUTE_MODES.length));
const encryptRoutes = computed<RouteResult[]>(() =>
{
	const square = squares.value[chosen.value];

	if (!square || !encryptBlocks.value || encryptBlocks.value.error) return [];

	const order = [ primaryMode.value, ...ROUTE_MODES.keys() ].filter((v, i, all) => all.indexOf(v) === i);

	return order.map((index) => applyRoute(encryptBlocks.value!.blocks, square, ROUTE_MODES[index]!.id));
});

const decryptBlocks = computed(() =>
{
	if (cipher.value.trim()) return prepareRouteText(cipher.value, n.value, pad.value);

	return null;
});
const decryptRoutes = computed(() =>
{
	if (!decryptBlocks.value || decryptBlocks.value.error) return [];

	return squares.value.map((square, index) => ({
		index,
		square,
		routes: ROUTE_MODES.map((mode) => applyRoute(decryptBlocks.value!.blocks, square, mode.id)),
	}));
});

/* Вариант расшифровки, который совпал с известной фразой, — он и есть ответ. */
const readable = computed(() => decryptRoutes.value.
	flatMap((entry) => entry.routes.map((route) => route.output)).
	find((output) => translatePhrase(output) !== undefined));

function lineEquation (step: SingleStep): string
{
	return `${step.line.cells.map(cellName).join(' + ')} = ${analysis.value?.sum}`;
}

function pairEquation (eq: PairEquation): string
{
	return `${cellName(eq.cells[0])} + ${cellName(eq.cells[1])} = ${eq.target}`;
}

function unpadded (prepared: { blocks: string[]; padCount: number }): string
{
	const chars = [ ...prepared.blocks.join('') ];

	return chars.slice(0, chars.length - prepared.padCount).join('');
}

function padTail (prepared: { blocks: string[]; padCount: number }): string
{
	const chars = [ ...prepared.blocks.join('') ];

	return chars.slice(chars.length - prepared.padCount).join('');
}

function modeLabel (id: RouteMode): string
{
	return ROUTE_MODES.find((mode) => mode.id === id)?.label ?? id;
}

/* Известные клетки для формулировки условия: «a₁₁ = 12, a₁₂ = 6, …». */
const givens = computed(() =>
{
	if (!grid.value) return '';

	const items: string[] = [];

	grid.value.forEach((row, r) => row.forEach((value, c) =>
	{
		if (value !== null) items.push(`${cellName([ r, c ])} = ${value}`);
	}));

	return items.join(', ');
});
</script>

<template>
	<div class="space-y-4">
		<section class="card grid gap-4 sm:grid-cols-2">
			<div>
				<span class="label">Известные клетки</span>
				<GridEditor
					v-model="gridText"
					:n="n"
				/>
			</div>
			<div class="space-y-3">
				<div class="grid grid-cols-2 gap-3">
					<FieldSelect
						v-model="nText"
						label="Размер"
						:options="SIZES"
					/>
					<FieldText
						v-model="pad"
						label="Добивка"
						hint="Символ до n² знаков."
					/>
				</div>
				<FieldText
					v-model="text"
					label="а) Зашифровать"
					placeholder="КАРАБАС БАРАБАС"
				/>
				<FieldText
					v-model="cipher"
					label="в) Расшифровать"
					placeholder="SERSCIIICEMLNHOI"
				/>
			</div>
			<div class="sm:col-span-2">
				<ResetButton :keys="KEYS" />
			</div>
		</section>

		<TaskStatement>
			Ключом в перестановочном шифре является магический квадрат A размера {{ n }} × {{ n }}, в котором {{ givens }}.
			Найти все возможные значения ключа.
			<span
				v-if="text.trim()"
				class="block"
			>а) зашифровать {{ text }}</span>
			<span
				v-if="cipher.trim()"
				class="block"
			>в) расшифровать {{ cipher }}</span>
			<span class="block">Найти перестановку, являющуюся ключом данного шифра.</span>
		</TaskStatement>

		<p
			v-if="!grid"
			class="error"
		>
			В клетках должны быть целые числа или пусто.
		</p>

		<template v-else-if="analysis">
			<StepCard title="Достройка магического квадрата">
				<div class="flex flex-wrap items-start gap-6">
					<span class="inline-flex items-center gap-2 text-sm">A = <MatrixView :rows="grid" /></span>
					<TexMath :tex="`S = \\dfrac{(n^2 + 1)\\,n}{2} = \\dfrac{(${n}^2 + 1)\\cdot ${n}}{2} = ${analysis.sum}`" />
				</div>
				<table
					v-if="analysis.singles.length"
					class="text-sm"
				>
					<tbody>
						<tr
							v-for="(step, i) in analysis.singles"
							:key="i"
						>
							<td class="py-0.5 pr-10">
								{{ lineEquation(step) }}
							</td>
							<td class="py-0.5">
								{{ cellName(step.cell) }} = {{ step.value }}
							</td>
						</tr>
					</tbody>
				</table>
				<p
					v-if="analysis.error"
					class="error"
				>
					{{ analysis.error }}
				</p>
				<template v-else>
					<table
						v-if="analysis.pairs.length"
						class="text-sm"
					>
						<tbody>
							<tr
								v-for="(eq, i) in analysis.pairs"
								:key="i"
							>
								<td class="py-0.5 pr-10">
									{{ pairEquation(eq) }}
								</td>
								<td
									v-for="([p, q], j) in eq.candidates"
									:key="j"
									class="py-0.5 pr-8"
								>
									{{ q }}+{{ p }}
								</td>
							</tr>
						</tbody>
					</table>
					<p
						v-if="solution.error"
						class="error"
					>
						{{ solution.error }}
					</p>
					<p
						v-else-if="squares.length === 0"
						class="error"
					>
						Ни один квадрат не удовлетворяет условиям.
					</p>
					<div
						v-else
						class="flex flex-wrap gap-6"
					>
						<span
							v-for="(square, i) in squares"
							:key="i"
							class="inline-flex items-center gap-2 text-sm"
						>A{{ sub(i + 1) }} = <MatrixView :rows="square" /></span>
					</div>
				</template>
			</StepCard>

			<template v-if="encryptBlocks && squares[chosen]">
				<p
					v-if="encryptBlocks.error"
					class="error"
				>
					{{ encryptBlocks.error }}
				</p>
				<StepCard
					v-else
					:title="`а) Зашифровать (A${sub(chosen + 1)})`"
				>
					<p class="note">
						квадрат и способ обхода выбраны по вашему имени
					</p>
					<p class="seq">
						X = {{ unpadded(encryptBlocks) }}<span class="pad">{{ padTail(encryptBlocks) }}</span>
					</p>
					<div
						v-for="(route, index) in encryptRoutes.slice(0, 1)"
						:key="index"
						class="space-y-3"
					>
						<div class="flex flex-wrap items-center gap-6">
							<GridView
								v-for="(block, b) in route.blocks"
								:key="b"
								:cells="block.grid"
								plain
							/>
							<span class="answer">Y = {{ route.output }}</span>
						</div>
					</div>
					<details class="rounded-lg border border-dashed border-stone-300 dark:border-stone-700">
						<summary class="note cursor-pointer px-3 py-2 not-italic">
							другие способы обхода
						</summary>
						<div class="space-y-4 border-t border-dashed border-stone-300 px-3 py-3 dark:border-stone-700">
							<div
								v-for="route in encryptRoutes.slice(1)"
								:key="route.mode"
								class="space-y-2"
							>
								<p class="note">
									{{ modeLabel(route.mode) }}
								</p>
								<div class="flex flex-wrap items-center gap-6">
									<GridView
										v-for="(block, b) in route.blocks"
										:key="b"
										:cells="block.grid"
								plain
									/>
									<span class="seq">Y = {{ route.output }}</span>
								</div>
							</div>
						</div>
					</details>
				</StepCard>
			</template>

			<template v-if="decryptBlocks && squares.length">
				<p
					v-if="decryptBlocks.error"
					class="error"
				>
					{{ decryptBlocks.error }}
				</p>
				<StepCard
					v-else
					title="в) Расшифровать"
				>
					<p class="seq">
						Y = {{ decryptBlocks.blocks.join(' ') }}
					</p>
					<template v-if="readable">
						<p class="answer">
							X = {{ readable }}
						</p>
						<TranslationLine :text="readable" />
					</template>
					<div
						v-for="entry in decryptRoutes"
						:key="entry.index"
						class="space-y-3"
					>
						<p class="seq font-semibold">
							A{{ sub(entry.index + 1) }}
						</p>
						<div class="grid gap-4 sm:grid-cols-2">
							<div
								v-for="route in entry.routes"
								:key="route.mode"
								class="space-y-1"
							>
								<p class="note">
									{{ modeLabel(route.mode) }}
								</p>
								<div class="flex flex-wrap items-center gap-4">
									<GridView
										v-for="(block, b) in route.blocks"
										:key="b"
										:cells="block.grid"
								plain
									/>
									<span
										class="seq"
										:class="translatePhrase(route.output) ? 'answer' : ''"
									>X = {{ route.output }}</span>
								</div>
							</div>
						</div>
					</div>
				</StepCard>
			</template>
		</template>
	</div>
</template>
