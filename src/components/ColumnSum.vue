<script setup lang="ts">
export interface SumRow
{

	/** Буква обозначения: X, K, Y. Для строки чисел берётся строчная. */
	name: string;
	letters: string;
	values: number[];
}

defineProps<{
	op: '+' | '−';
	top: SumRow;
	stream: SumRow;
	result: SumRow;

	/** Сколько первых букв ключа — само ключевое слово (выделяются цветом). */
	keyword: number;
}>();

function numberCell (values: number[], i: number): string
{
	const open = i === 0
		? '('
		: '';
	const close = i === values.length - 1
		? ')'
		: ',';

	return `${open}${values[i]}${close}`;
}
</script>

<template>
	<div class="overflow-x-auto">
		<table class="border-collapse font-mono text-sm">
			<tbody>
				<tr>
					<td
						rowspan="4"
						class="pr-2 align-middle text-xl"
					>
						{{ op }}
					</td>
					<th class="pr-2 text-left font-normal whitespace-nowrap">
						{{ top.name }} =
					</th>
					<td
						v-for="(ch, i) in [...top.letters]"
						:key="i"
						class="px-0.5 text-center"
					>
						{{ ch }}
					</td>
				</tr>
				<tr>
					<th class="pr-2 text-left font-normal whitespace-nowrap">
						{{ top.name.toLowerCase() }} =
					</th>
					<td
						v-for="(_, i) in top.values"
						:key="i"
						class="px-0.5 pb-1 text-center whitespace-nowrap"
					>
						{{ numberCell(top.values, i) }}
					</td>
				</tr>
				<tr>
					<th class="pr-2 text-left font-normal whitespace-nowrap">
						{{ stream.name }} =
					</th>
					<td
						v-for="(ch, i) in [...stream.letters]"
						:key="i"
						class="px-0.5 text-center"
						:class="i < keyword ? 'text-amber-600 dark:text-amber-400' : ''"
					>
						{{ ch }}
					</td>
				</tr>
				<tr class="border-b-2 border-current">
					<th class="pr-2 text-left font-normal whitespace-nowrap">
						{{ stream.name.toLowerCase() }} =
					</th>
					<td
						v-for="(_, i) in stream.values"
						:key="i"
						class="px-0.5 pb-1 text-center whitespace-nowrap"
						:class="i < keyword ? 'text-amber-600 dark:text-amber-400' : ''"
					>
						{{ numberCell(stream.values, i) }}
					</td>
				</tr>
				<tr>
					<td />
					<th class="pt-1 pr-2 text-left font-normal whitespace-nowrap">
						{{ result.name.toLowerCase() }} =
					</th>
					<td
						v-for="(_, i) in result.values"
						:key="i"
						class="px-0.5 pt-1 text-center whitespace-nowrap"
					>
						{{ numberCell(result.values, i) }}
					</td>
				</tr>
				<tr class="bg-amber-50 font-semibold dark:bg-amber-950/40">
					<td class="bg-white dark:bg-stone-900" />
					<th class="py-1 pr-2 text-left whitespace-nowrap">
						{{ result.name }} =
					</th>
					<td
						v-for="(ch, i) in [...result.letters]"
						:key="i"
						class="px-0.5 py-1 text-center"
					>
						{{ ch }}
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
