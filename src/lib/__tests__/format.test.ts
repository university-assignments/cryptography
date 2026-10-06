import { describe, expect, it } from 'vitest';
import { rowExpression, sub } from '../format';
import { matVec } from '../matrix';

describe('оформление как в тетради', () =>
{
	it('индексы', () =>
	{
		expect(sub(26)).toBe('₂₆');
		expect(`a${sub(3)}${sub(3)}`).toBe('a₃₃');
	});

	it('строки произведения — как в тетради В6: без нулевых слагаемых и умножения на 1', () =>
	{
		const { rows } = matVec([[ 11, 19, 0 ], [ 4, 19, 25 ], [ 5, 7, 1 ]], [ 3, 8, 4 ], 26);

		expect(rows.map(rowExpression)).toEqual([ '11·3 + 19·8', '4·3 + 19·8 + 25·4', '5·3 + 7·8 + 4' ]);
		expect(rowExpression(matVec([[ 0, 3, 3 ]], [ 14, 0, 0 ], 26).rows[0]!)).toBe('0');
	});
});
