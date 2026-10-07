import {
	type Grid,
	type Line,
	type Pos,
	type Square,
	analyze,
	cellName,
	lines,
} from './magic-square';

/** Клетка, вычисленная из линии, где осталась одна неизвестная: value = target − minus₁ − minus₂ … */
export interface Derivation
{
	cell: Pos;
	value: number;
	line: Line;

	/** Сумма линии без клеток, известных до перебора (как в уравнениях пар). */
	target: number;

	/** Значения линии, подставленные в этой ветке перебора. */
	minus: number[];
}

export type Conflict
	= | { kind: 'range' | 'used'; step: Derivation }
		| { kind: 'sum'; line: Line; values: number[]; total: number }
		| { kind: 'none'; cells: [Pos, Pos]; target: number };

export interface Branch
{

	/** Что подставили: пара клеток из уравнения или одна клетка. */
	choice: { cell: Pos; value: number }[];
	derived: Derivation[];
	conflict?: Conflict;
	children: Branch[];

	/** Ветка дошла до конца — это одно из значений ключа. */
	square?: Square;

	/** Квадрат этой попытки, как его рисуют в тетради: неподходящее число стоит в своей клетке. */
	state: Grid;

	/** Клетки, из-за которых попытка не подходит. */
	bad: Pos[];
}

/** Попытка до конца: путь веток от первой подстановки до квадрата или отказа. */
export interface Attempt
{
	path: Branch[];
	leaf: Branch;
}

export interface Search
{
	branches: Branch[];
	truncated: boolean;
}

export const MAX_BRANCHES = 200;

const key = (pos: Pos): string => pos.join(',');

/**
 * Перебор так, как его расписывают в тетради: подставляем пару из первого уравнения,
 * досчитываем клетки, которые после этого определяются однозначно, и либо получаем квадрат,
 * либо показываем, почему вариант не подходит. Если однозначных клеток нет — следующая пара.
 */
export function search (input: Grid): Search | null
{
	const analysis = analyze(input);

	if (analysis.error) return null;

	const { n, sum } = analysis;
	const max = n * n;
	const base = analysis.grid;
	const allLines = lines(n);
	const linesByCell = new Map<string, Line[]>();

	for (const line of allLines)
	{
		for (const pos of line.cells) linesByCell.set(key(pos), [ ...linesByCell.get(key(pos)) ?? [], line ]);
	}

	const baseTarget = (line: Line): number => sum - line.cells.reduce((acc, [ r, c ]) => acc + (base[r]![c] ?? 0), 0);
	const unknownOf = (grid: Grid, line: Line): Pos[] => line.cells.filter(([ r, c ]) => grid[r]![c] === null);
	const knownSum = (grid: Grid, line: Line): number => line.cells.reduce((acc, [ r, c ]) => acc + (grid[r]![c] ?? 0), 0);
	const used = (grid: Grid): Set<number> => new Set(grid.flat().filter((v): v is number => v !== null));

	let count = 0;
	let truncated = false;

	/* Заполненная линия через клетку с неверной суммой. */
	const sumConflict = (grid: Grid, pos: Pos): Conflict | undefined =>
	{
		for (const line of linesByCell.get(key(pos))!)
		{
			if (unknownOf(grid, line).length > 0) continue;

			const values = line.cells.map(([ r, c ]) => grid[r]![c]!);
			const total = values.reduce((acc, v) => acc + v, 0);

			if (total !== sum) return { kind: 'sum', line, values, total };
		}

		return undefined;
	};

	const derive = (grid: Grid, line: Line, cell: Pos): Derivation =>
	{
		const minus = line.cells.
			filter((pos) => key(pos) !== key(cell) && base[pos[0]]![pos[1]] === null).
			map(([ r, c ]) => grid[r]![c]!);

		return { cell, value: sum - knownSum(grid, line), line, target: baseTarget(line), minus };
	};

	/* Ветвимся по линии с наименьшим числом неизвестных — так перебор короче всего. */
	/* Снимок квадрата попытки; неподходящее число вписывается в клетку и выделяется. */
	function finish (branch: Branch, grid: Grid): Branch
	{
		const state = grid.map((row) => [ ...row ]);
		const conflict = branch.conflict;

		branch.state = state;

		if (!conflict) return branch;

		switch (conflict.kind)
		{
			case 'range':
			case 'used':
				state[conflict.step.cell[0]]![conflict.step.cell[1]] = conflict.step.value;
				branch.bad = [ conflict.step.cell ];
				break;
			case 'sum':
				branch.bad = conflict.line.cells;
				break;
			case 'none':
				branch.bad = conflict.cells;
				break;
		}

		return branch;
	}

	function choose (grid: Grid): { children: Branch[]; conflict?: Conflict }
	{
		let best: { line: Line; unknown: Pos[] } | null = null;

		for (const line of allLines)
		{
			const unknown = unknownOf(grid, line);

			if (unknown.length >= 2 && (!best || unknown.length < best.unknown.length)) best = { line, unknown };
		}

		if (!best) return { children: [] };

		const target = sum - knownSum(grid, best.line);
		const taken = used(grid);
		const free = [ ...Array(max).keys() ].map((i) => i + 1).filter((v) => !taken.has(v));
		const choices: { cell: Pos; value: number }[][] = [];

		if (best.unknown.length === 2)
		{
			const [ a, b ] = best.unknown as [Pos, Pos];

			for (const p of free)
			{
				const q = target - p;

				if (q !== p && free.includes(q)) choices.push([{ cell: a, value: p }, { cell: b, value: q }]);
			}

			if (choices.length === 0) return { children: [], conflict: { kind: 'none', cells: [ a, b ], target } };
		}
		else
		{
			for (const v of free.filter((value) => value < target)) choices.push([{ cell: best.unknown[0]!, value: v }]);
		}

		const children: Branch[] = [];

		for (const choice of choices)
		{
			if (count >= MAX_BRANCHES)
			{
				truncated = true;
				break;
			}

			children.push(expand(grid, choice));
		}

		return { children };
	}

	function expand (from: Grid, choice: Branch['choice']): Branch
	{
		count += 1;

		const grid = from.map((row) => [ ...row ]);
		const branch: Branch = { choice, derived: [], children: [], state: grid, bad: [] };

		for (const { cell, value } of choice) grid[cell[0]]![cell[1]] = value;

		for (const { cell } of choice)
		{
			branch.conflict ??= sumConflict(grid, cell);
		}

		if (branch.conflict) return finish(branch, grid);

		let progress = true;

		while (progress)
		{
			progress = false;

			for (const line of allLines)
			{
				const unknown = unknownOf(grid, line);

				if (unknown.length !== 1) continue;

				const step = derive(grid, line, unknown[0]!);

				if (step.value < 1 || step.value > max)
				{
					branch.conflict = { kind: 'range', step };

					return finish(branch, grid);
				}

				if (used(grid).has(step.value))
				{
					branch.conflict = { kind: 'used', step };

					return finish(branch, grid);
				}

				grid[step.cell[0]]![step.cell[1]] = step.value;
				branch.derived.push(step);

				branch.conflict = sumConflict(grid, step.cell);
				if (branch.conflict) return finish(branch, grid);

				progress = true;
				break;
			}
		}

		if (grid.every((row) => row.every((v) => v !== null)))
		{
			branch.square = grid.map((row) => row.map((v) => v!));

			return finish(branch, grid);
		}

		const next = choose(grid);

		branch.children = next.children;
		branch.conflict = next.conflict;

		return finish(branch, grid);
	}

	if (base.every((row) => row.every((v) => v !== null))) return { branches: [], truncated };

	const top = choose(base);

	return { branches: top.children, truncated };
}

/** Все квадраты, до которых дошёл перебор, в порядке веток. */
export function leaves (branches: Branch[]): Square[]
{
	return branches.flatMap((branch) =>
	{
		if (branch.square) return [ branch.square ];

		return leaves(branch.children);
	});
}

/** Попытки по порядку — для каждой рисуется свой квадрат. */
export function attempts (branches: Branch[], path: Branch[] = []): Attempt[]
{
	return branches.flatMap((branch) =>
	{
		const next = [ ...path, branch ];

		if (branch.children.length === 0) return [{ path: next, leaf: branch }];

		return attempts(branch.children, next);
	});
}

/* ---------- Текст строк перебора, как его пишут в тетради ---------- */

/** «a₁₁ = 2, a₁₂ = 11 → a₂₁ = 19 − 2 = 17 > 16 — не подходит» */
export function stepText (branch: Branch, n: number): string
{
	const tail = [ derivedText(branch) ];

	if (branch.conflict) tail.push(conflictText(branch.conflict, n));

	const rest = tail.filter((part) => part.length > 0).join(', ');

	if (rest.length === 0) return choiceText(branch);

	return `${choiceText(branch)} → ${rest}`;
}

export function choiceText (branch: Branch): string
{
	return branch.choice.map(({ cell, value }) => `${cellName(cell)} = ${value}`).join(', ');
}

export function derivedText (branch: Branch): string
{
	return branch.derived.map((step) => `${cellName(step.cell)} = ${step.value}`).join(', ');
}

/* Минус в отрицательных числах — типографский, как в остальных выражениях. */
const num = (value: number): string => String(value).replace('-', '−');

function expression (step: Derivation): string
{
	if (step.minus.length === 0) return `${cellName(step.cell)} = ${num(step.value)}`;

	return `${cellName(step.cell)} = ${[ step.target, ...step.minus ].join(' − ')} = ${num(step.value)}`;
}

export function conflictText (conflict: Conflict, n: number): string
{
	switch (conflict.kind)
	{
		case 'range':
			if (conflict.step.value > n * n) return `${expression(conflict.step)} > ${n * n} — не подходит`;

			return `${expression(conflict.step)} < 1 — не подходит`;
		case 'used':
			return `${expression(conflict.step)}, ${conflict.step.value} уже есть — не подходит`;
		case 'sum':
			return `${conflict.line.cells.map(cellName).join(' + ')} = ${conflict.values.join(' + ')} = ${conflict.total} ≠ ${n * (n * n + 1) / 2} — не подходит`;
		case 'none':
			return `${cellName(conflict.cells[0])} + ${cellName(conflict.cells[1])} = ${conflict.target} — нет подходящих чисел, не подходит`;
	}
}
