<script setup lang="ts">
import {
	type Branch, choiceText, conflictText, derivedText,
} from '@/lib/magic-search';
import { sub } from '@/lib/format';
import type { Square } from '@/lib/magic-square';

const props = defineProps<{ branches: Branch[]; squares: Square[]; n: number }>();

/* Номер квадрата — как в списке A₁, A₂ ниже. */
function label (square: Square): string
{
	const index = props.squares.findIndex((s) => s.flat().join(',') === square.flat().join(','));

	return `A${sub(index + 1)}`;
}

function tail (branch: Branch): string
{
	const parts = [ derivedText(branch) ];

	if (branch.conflict) parts.push(conflictText(branch.conflict, props.n));

	return parts.filter((part) => part.length > 0).join(', ');
}
</script>

<template>
	<ul class="space-y-0.5">
		<li
			v-for="(branch, i) in branches"
			:key="i"
		>
			<p class="text-sm">
				{{ choiceText(branch) }}<template v-if="tail(branch)">
					→ {{ tail(branch) }}
				</template><template v-if="branch.square">
					→ <span class="font-semibold">{{ label(branch.square) }}</span>
				</template>
			</p>
			<SquareBranches
				v-if="branch.children.length"
				class="ml-6"
				:branches="branch.children"
				:squares="squares"
				:n="n"
			/>
		</li>
	</ul>
</template>
