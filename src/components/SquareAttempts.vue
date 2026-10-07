<script setup lang="ts">
import MatrixView from '@/components/MatrixView.vue';
import { sub } from '@/lib/format';
import {
	type Attempt, type Branch, attempts, stepText,
} from '@/lib/magic-search';
import type { Square } from '@/lib/magic-square';
import { computed } from 'vue';

const props = defineProps<{ branches: Branch[]; squares: Square[]; n: number }>();

const list = computed<Attempt[]>(() => attempts(props.branches));

/* Номер квадрата — как в расшифровке (A₁, A₂). */
function label (square: Square): string
{
	const index = props.squares.findIndex((s) => s.flat().join(',') === square.flat().join(','));

	return `A${sub(index + 1)} =`;
}

const highlight = (attempt: Attempt): Set<string> => new Set(attempt.leaf.bad.map((pos) => pos.join(',')));
</script>

<template>
	<div class="space-y-5">
		<div
			v-for="(attempt, i) in list"
			:key="i"
			class="flex flex-wrap items-center gap-x-6 gap-y-2"
		>
			<span class="inline-flex items-center gap-2 text-sm">
				<template v-if="attempt.leaf.square">{{ label(attempt.leaf.square) }}</template>
				<MatrixView
					:rows="attempt.leaf.state"
					:highlight="highlight(attempt)"
				/>
			</span>
			<div class="space-y-0.5 text-sm">
				<p
					v-for="(branch, j) in attempt.path"
					:key="j"
				>
					{{ stepText(branch, n) }}
				</p>
			</div>
		</div>
	</div>
</template>
