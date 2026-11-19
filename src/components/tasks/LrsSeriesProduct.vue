<script setup lang="ts">
import { computed } from 'vue';
import StepCard from '@/components/StepCard.vue';
import TexMath from '@/components/TexMath.vue';
import { type MinimalRecurrence, periodProduct } from '@/lib/lrs';
import { ascendingTex, groupedPolynomialTex, seriesTex } from '@/lib/lrs-format';

const props = defineProps<{ solution: MinimalRecurrence }>();

const work = computed(() =>
{
	const { p, period } = props.solution;
	const { shifts, product, first, carry } = periodProduct(props.solution);
	const t = period.length;
	const columns = product.map((_, i) => shifts.map((shift) => shift.product[i] ?? 0));
	const overlap = Array.from({ length: t }, (_, i) => [ first[i] ?? 0, carry[i] ?? 0 ]);
	const sums = new Set(overlap.filter(([ a, b ]) => a || b).map((pair) => pair.join('+')));
	const exponent = t === 1
		? 'm+1'
		: `${t}(m+1)`;
	const head = ascendingTex(first);

	return {
		compact: shifts.length <= 5 && columns.length <= 10,
		rows: shifts.map(({ factor, product: row }) => `${ascendingTex(factor)}P(x)=${ascendingTex(row)}`),
		columns: groupedPolynomialTex(columns),
		product: ascendingTex(product),
		distributed: seriesTex(product, t, 0),
		regrouped: `${head}+\\sum_{m=0}^{\\infty}x^{${exponent}}\\bigl(${groupedPolynomialTex(overlap)}\\bigr)`,
		cancellation: [ ...sums ].map((sum) => `${sum}\\equiv 0\\pmod{${p}}`),
		head,
	};
});
</script>

<template>
	<StepCard title="Умножение ряда">
		<details :open="work.compact">
			<summary class="cursor-pointer text-sm font-medium">
				Сдвиги и сложение по степеням
			</summary>
			<div
				class="mt-2 space-y-1 overflow-x-auto py-0.5"
				tabindex="0"
				role="region"
				aria-label="Умножение многочлена P по степеням"
			>
				<p
					v-for="row in work.rows"
					:key="row"
				>
					<TexMath :tex="row" />
				</p>
				<p>
					<TexMath :tex="`h_{\\min}(x)P(x)=${work.columns}`" />
				</p>
			</div>
		</details>
		<div
			class="space-y-2 overflow-x-auto py-0.5"
			tabindex="0"
			role="region"
			aria-label="Сложение соседних блоков ряда"
		>
			<p>
				<TexMath :tex="`h_{\\min}(x)P(x)=${work.product}`" />
			</p>
			<p>
				<TexMath :tex="`h_{\\min}(x)S(x)=${work.distributed}`" />
			</p>
			<p class="text-sm">
				Совмещаем одинаковые степени соседних блоков.
			</p>
			<p>
				<TexMath :tex="`=${work.regrouped}`" />
			</p>
			<p class="flex flex-wrap gap-x-3 gap-y-1">
				<TexMath
					v-for="sum in work.cancellation"
					:key="sum"
					:tex="sum"
				/>
			</p>
		</div>
		<p class="tex-line answer">
			<TexMath :tex="`h_{\\min}(x)S(x)=${work.head}`" />
		</p>
	</StepCard>
</template>
