<script setup lang="ts">
import { computed } from 'vue';

/*
 * Линейный регистр с обратной связью — как рисуют в тетради: ячейки с начальным заполнением,
 * выход слева, отводы вниз через умножители ×c в сумматор, сумматор — обратно в последнюю ячейку.
 */
const props = defineProps<{

	/** s(n+k) = coefs[k−1]·s(n+k−1) + … + coefs[0]·s(n). */
	coefs: number[];

	/** Заполнение ячеек: s₀ … s_{k−1}. */
	init: number[];
}>();

const CELL_W = 44;
const CELL_H = 28;
const GAP = 64;
const LEFT = 56;
const WIRE_Y = 30;
const MULT_TOP = 52;
const MULT_H = 30;
const LEVEL_TOP = 104;
const LEVEL_STEP = 18;

const layout = computed(() =>
{
	const k = props.coefs.length;
	const cells = props.init.slice(0, k).map((value, i) => ({ value, x: LEFT + i * (CELL_W + GAP) }));
	const taps = props.coefs.
		map((coef, i) => ({ coef, x: LEFT + i * (CELL_W + GAP) - GAP / 2 })).
		filter((tap) => tap.coef !== 0);
	const lastRight = LEFT + (k - 1) * (CELL_W + GAP) + CELL_W;
	const adder = taps.length > 1;

	/* Самый левый отвод идёт ниже всех — линии не пересекаются. */
	const levels = taps.map((tap, i) => ({ ...tap, y: LEVEL_TOP + (taps.length - 1 - i) * LEVEL_STEP }));
	const adderX = Math.max(lastRight - CELL_W, (levels[levels.length - 1]?.x ?? 0) + 36);
	const adderTop = LEVEL_TOP - 12;
	const adderBottom = LEVEL_TOP + (taps.length - 1) * LEVEL_STEP + 12;
	const adderMid = (adderTop + adderBottom) / 2;
	const adderTip = adderX + 40;
	const feedbackX = Math.max(lastRight + 36, adderTip + 24);

	return {
		cells,
		levels,
		adder,
		adderX,
		adderTop,
		adderBottom,
		adderMid,
		adderTip,
		feedbackX,
		lastRight,
		width: feedbackX + 16,
		height: (adder
			? adderBottom
			: LEVEL_TOP) + 16,
	};
});
</script>

<template>
	<div class="overflow-x-auto">
		<svg
			:width="layout.width"
			:height="layout.height"
			:viewBox="`0 0 ${layout.width} ${layout.height}`"
			class="text-stone-800 dark:text-stone-200"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			role="img"
			aria-label="Линейный регистр с обратной связью"
		>
			<defs>
				<marker
					id="register-arrow"
					viewBox="0 0 10 10"
					refX="9"
					refY="5"
					markerWidth="7"
					markerHeight="7"
					orient="auto-start-reverse"
				>
					<path
						d="M0 1 L9 5 L0 9"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					/>
				</marker>
			</defs>

			<!-- выход: из первой ячейки влево -->
			<line
				:x1="layout.cells[0]!.x"
				:y1="WIRE_Y"
				x2="6"
				:y2="WIRE_Y"
				marker-end="url(#register-arrow)"
			/>

			<template
				v-for="(cell, i) in layout.cells"
				:key="`cell-${i}`"
			>
				<rect
					:x="cell.x"
					:y="WIRE_Y - CELL_H / 2"
					:width="CELL_W"
					:height="CELL_H"
				/>
				<text
					:x="cell.x + CELL_W / 2"
					:y="WIRE_Y + 5"
					text-anchor="middle"
					fill="currentColor"
					stroke="none"
					font-size="14"
					font-family="ui-monospace, monospace"
				>{{ cell.value }}</text>

				<!-- сдвиг: из ячейки справа в эту -->
				<line
					v-if="i < layout.cells.length - 1"
					:x1="cell.x + CELL_W + GAP"
					:y1="WIRE_Y"
					:x2="cell.x + CELL_W"
					:y2="WIRE_Y"
					marker-end="url(#register-arrow)"
				/>
			</template>

			<template
				v-for="tap in layout.levels"
				:key="`tap-${tap.x}`"
			>
				<template v-if="tap.coef === 1">
					<line
						:x1="tap.x"
						:y1="WIRE_Y"
						:x2="tap.x"
						:y2="tap.y"
					/>
				</template>
				<template v-else>
					<line
						:x1="tap.x"
						:y1="WIRE_Y"
						:x2="tap.x"
						:y2="MULT_TOP"
					/>
					<path :d="`M${tap.x - 20} ${MULT_TOP} L${tap.x + 20} ${MULT_TOP} L${tap.x} ${MULT_TOP + MULT_H} Z`" />
					<text
						:x="tap.x"
						:y="MULT_TOP + 13"
						text-anchor="middle"
						fill="currentColor"
						stroke="none"
						font-size="11"
						font-family="ui-monospace, monospace"
					>×{{ tap.coef }}</text>
					<line
						:x1="tap.x"
						:y1="MULT_TOP + MULT_H"
						:x2="tap.x"
						:y2="tap.y"
					/>
				</template>

				<!-- в сумматор или, если отвод один, сразу в обратную связь -->
				<line
					v-if="layout.adder"
					:x1="tap.x"
					:y1="tap.y"
					:x2="layout.adderX"
					:y2="tap.y"
					marker-end="url(#register-arrow)"
				/>
				<path
					v-else
					:d="`M${tap.x} ${tap.y} L${layout.feedbackX} ${tap.y} L${layout.feedbackX} ${WIRE_Y} L${layout.lastRight} ${WIRE_Y}`"
					marker-end="url(#register-arrow)"
				/>
			</template>

			<template v-if="layout.adder">
				<path :d="`M${layout.adderX} ${layout.adderTop} L${layout.adderX} ${layout.adderBottom} L${layout.adderTip} ${layout.adderMid} Z`" />
				<text
					:x="layout.adderX + 13"
					:y="layout.adderMid + 5"
					text-anchor="middle"
					fill="currentColor"
					stroke="none"
					font-size="14"
				>+</text>
				<path
					:d="`M${layout.adderTip} ${layout.adderMid} L${layout.feedbackX} ${layout.adderMid} L${layout.feedbackX} ${WIRE_Y} L${layout.lastRight} ${WIRE_Y}`"
					marker-end="url(#register-arrow)"
				/>
			</template>
		</svg>
	</div>
</template>
