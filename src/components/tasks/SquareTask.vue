<script setup lang="ts">
import { computed } from 'vue';
import FieldSelect from '@/components/FieldSelect.vue';
import FieldText from '@/components/FieldText.vue';
import GridEditor from '@/components/GridEditor.vue';
import GridView from '@/components/GridView.vue';
import PermutationView from '@/components/PermutationView.vue';
import ResetButton from '@/components/ResetButton.vue';
import StepCard from '@/components/StepCard.vue';
import { useName } from '@/composables/useName';
import { useQueryParam } from '@/composables/useQueryParam';
import type { VariantPreset } from '@/data/work-1/variants';
import { pick } from '@/lib/hash';
import {
	type PairEquation,
	type RouteResult,
	type SingleStep,
	type Square,
	analyze,
	applyRoute,
	cellName,
	invertPermutation,
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
const encryptRoutes = computed<RouteResult[]>(() =>
{
	const square = squares.value[chosen.value];

	if (!square || !encryptBlocks.value || encryptBlocks.value.error) return [];

	return ROUTE_MODES.map((mode) => applyRoute(encryptBlocks.value!.blocks, square, mode.id));
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

const sub = (i: number): string => String(i + 1).replace(/\d/gu, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)]!);

function single (step: SingleStep): string
{
	const known = step.known.join(' − ');

	return `${step.line.name}: ${cellName(step.cell)} = ${analysis.value?.sum} − ${known} = ${step.value}`;
}

function pair (eq: PairEquation): string
{
	const candidates = eq.candidates.length
		? eq.candidates.map(([ p, q ]) => `${p}+${q}`).join(', ')
		: 'нет подходящих пар';

	return `${cellName(eq.cells[0])} + ${cellName(eq.cells[1])} = ${eq.target}: ${candidates}`;
}

function modeLabel (id: string): string
{
	return ROUTE_MODES.find((mode) => mode.id === id)?.label ?? id;
}
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

		<p
			v-if="!grid"
			class="error"
		>
			В клетках должны быть целые числа или пусто.
		</p>

		<template v-else-if="analysis">
			<StepCard title="Достройка магического квадрата">
				<p class="seq">
					n = {{ n }}, S = (n² + 1)·n / 2 = ({{ n }}² + 1)·{{ n }} / 2 = {{ analysis.sum }}
				</p>
				<div class="flex flex-wrap items-start gap-4">
					<GridView :cells="grid" />
					<div class="space-y-1">
						<p
							v-for="(step, i) in analysis.singles"
							:key="i"
							class="seq"
						>
							{{ single(step) }}
						</p>
						<p
							v-if="analysis.singles.length"
							class="hint"
						>
							Линии с одной неизвестной определяются сразу.
						</p>
					</div>
				</div>
				<p
					v-if="analysis.error"
					class="error"
				>
					{{ analysis.error }}
				</p>
				<template v-else>
					<div
						v-if="analysis.pairs.length"
						class="space-y-1"
					>
						<p class="hint">
							Линии с двумя неизвестными — кандидаты из оставшихся чисел {{ analysis.available.join(', ') }}:
						</p>
						<p
							v-for="(eq, i) in analysis.pairs"
							:key="i"
							class="seq"
						>
							{{ pair(eq) }}
						</p>
					</div>
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
						class="space-y-2"
					>
						<p class="font-medium">
							Все возможные значения ключа: {{ squares.length }}
						</p>
						<div class="flex flex-wrap gap-4">
							<div
								v-for="(square, i) in squares"
								:key="i"
								class="space-y-1"
							>
								<p class="seq font-semibold">
									A{{ sub(i) }}<span
										v-if="i === chosen && squares.length > 1"
										class="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-normal text-amber-900 dark:bg-amber-900/50 dark:text-amber-100"
									>для шифрования — по вашему имени</span>
								</p>
								<GridView :cells="square" />
							</div>
						</div>
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
					:title="`а) Зашифровать квадратом A${sub(chosen)}`"
				>
					<p class="seq">
						X = {{ encryptBlocks.blocks.join(' | ') }}
						<span
							v-if="encryptBlocks.padCount"
							class="text-stone-500"
						>(добивка {{ encryptBlocks.padCount }} зн.)</span>
					</p>
					<details
						v-for="route in encryptRoutes"
						:key="route.mode"
						class="group rounded-lg border border-stone-200 dark:border-stone-800"
						open
					>
						<summary class="cursor-pointer px-3 py-2 text-sm">
							<span class="font-medium">{{ modeLabel(route.mode) }}</span>
							<span class="answer mt-1 block">Y = {{ route.output }}</span>
						</summary>
						<div class="space-y-3 border-t border-stone-200 px-3 py-3 dark:border-stone-800">
							<div class="flex flex-wrap gap-4">
								<div
									v-for="(block, i) in route.blocks"
									:key="i"
									class="space-y-2"
								>
									<div class="flex items-center gap-3">
										<GridView :cells="squares[chosen]!" compact />
										<GridView :cells="block.grid" />
									</div>
									<p class="seq">→ {{ block.output }}</p>
								</div>
							</div>
							<PermutationView
								:perm="route.perm"
								label="Перестановка — ключ шифра: буква позиции «берём» встаёт на позицию «позиция»"
							/>
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
					title="в) Расшифровать: все квадраты и способы обхода"
				>
					<p class="hint">
						Y = {{ decryptBlocks.blocks.join(' | ') }}. Осмысленный текст выдаёт один из вариантов ниже — его перестановка и есть ключ.
					</p>
					<div
						v-for="entry in decryptRoutes"
						:key="entry.index"
						class="space-y-2"
					>
						<p class="seq font-semibold">
							Квадрат A{{ sub(entry.index) }}
						</p>
						<details
							v-for="route in entry.routes"
							:key="route.mode"
							class="rounded-lg border border-stone-200 dark:border-stone-800"
						>
							<summary class="cursor-pointer px-3 py-2 text-sm">
								<span class="hint">{{ modeLabel(route.mode) }}</span>
								<span class="answer mt-1 block">X = {{ route.output }}</span>
							</summary>
							<div class="space-y-3 border-t border-stone-200 px-3 py-3 dark:border-stone-800">
								<div class="flex flex-wrap gap-4">
									<div
										v-for="(block, i) in route.blocks"
										:key="i"
										class="space-y-2"
									>
										<div class="flex items-center gap-3">
											<GridView :cells="entry.square" compact />
											<GridView :cells="block.grid" />
										</div>
										<p class="seq">→ {{ block.output }}</p>
									</div>
								</div>
								<PermutationView
									:perm="route.perm"
									label="Применённая перестановка σ (расшифрование)"
								/>
								<PermutationView
									:perm="invertPermutation(route.perm)"
									label="Ключ шифра π = σ⁻¹ (так текст был зашифрован)"
								/>
							</div>
						</details>
					</div>
				</StepCard>
			</template>
		</template>
	</div>
</template>
