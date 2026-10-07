import { describe, expect, it } from 'vitest';
import { VARIANTS } from '@/data/work-1/variants';
import {
	type Branch, choiceText, conflictText, derivedText, leaves, search,
} from '../magic-search';
import { parseGrid, solve } from '../magic-square';

const sorted = (squares: number[][][]): string[] => squares.map((square) => square.flat().join(',')).sort();

function lines (branches: Branch[], depth = 0): string[]
{
	return branches.flatMap((branch) =>
	{
		const tail = [
			derivedText(branch), branch.conflict
				? conflictText(branch.conflict, 4)
				: '',
		].filter(Boolean).join(', ');

		return [ `${'  '.repeat(depth)}${choiceText(branch)} → ${tail}`, ...lines(branch.children, depth + 1) ];
	});
}

describe('магический квадрат — перебор с объяснением', () =>
{
	it.each(VARIANTS.map((v) => [ v.id, v.square.grid ] as const))('вариант %i: перебор приходит ровно к тем же квадратам, что и solve', (_, text) =>
	{
		const grid = parseGrid(text, 4)!;
		const result = search(grid)!;

		expect(result.truncated).toBe(false);
		expect(leaves(result.branches)).toEqual(solve(grid).solutions);
	});

	it('вариант 4: каждый неподходящий вариант с причиной', () =>
	{
		const result = search(parseGrid('.,.,5,.;.,.,10,3;14,7,.,.;1,12,.,.', 4)!)!;

		expect(lines(result.branches)).toEqual([
			'a₁₁ = 2, a₁₂ = 11 → a₂₁ = 19 − 2 = 17 > 16 — не подходит',
			'a₁₁ = 4, a₁₂ = 9 → a₂₁ = 15, a₂₂ = 6',
			'  a₃₃ = 2, a₃₄ = 11 → a₄₃ = 19 − 2 = 17 > 16 — не подходит',
			'  a₃₃ = 11, a₃₄ = 2 → a₄₃ = 8, a₄₄ = 13',
			'a₁₁ = 9, a₁₂ = 4 → a₂₁ = 19 − 9 = 10, 10 уже есть — не подходит',
			'a₁₁ = 11, a₁₂ = 2 → a₂₁ = 8, a₂₂ = 13',
			'  a₃₃ = 4, a₃₄ = 9 → a₄₃ = 15, a₄₄ = 6',
			'  a₃₃ = 9, a₃₄ = 4 → a₄₃ = 19 − 9 = 10, 10 уже есть — не подходит',
		]);
	});

	it('отрицательное значение пишется с типографским минусом', () =>
	{
		const result = search(parseGrid('12,6,.,.;13,3,.,.;.,.,.,11;.,.,4,14', 4)!)!;

		expect(lines(result.branches)).toContain('  a₃₁ = 10, a₃₂ = 8 → a₄₁ = 9 − 10 = −1 < 1 — не подходит');
	});

	it('3×3 с центром 5: восемь квадратов, лишние ветки отсечены с причиной', () =>
	{
		const grid = parseGrid('.,.,.;.,5,.;.,.,.', 3)!;
		const result = search(grid)!;

		expect(sorted(leaves(result.branches))).toEqual(sorted(solve(grid).solutions));
		expect(lines(result.branches).join('\n')).toMatch(/не подходит/u);
	});

	it('пустой 3×3: пар нет — ветвление по одной клетке, длинный перебор обрезается', () =>
	{
		const result = search(parseGrid('.,.,.;.,.,.;.,.,.', 3)!)!;

		expect(result.branches[0]!.choice).toHaveLength(1);
		expect(result.truncated).toBe(true);
	});
});
