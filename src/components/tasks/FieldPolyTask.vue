<script setup lang="ts">
import { computed } from 'vue';
import FieldSelect from '@/components/FieldSelect.vue';
import FieldText from '@/components/FieldText.vue';
import ResetButton from '@/components/ResetButton.vue';
import StepCard from '@/components/StepCard.vue';
import TaskStatement from '@/components/TaskStatement.vue';
import TexMath from '@/components/TexMath.vue';
import { useQueryParam } from '@/composables/useQueryParam';
import type { Variant2Preset } from '@/data/work-2/variants';
import {
	type PowerStep,
	exponents,
	FIELD_DEGREE,
	FIELD_POLYS,
	fieldPow,
	findFieldPoly,
	maskTex,
	parseElement,
	solveField,
} from '@/lib/gf16';
import { primeDivisors } from '@/lib/lrs-cipher';
import {
	initialTex,
	periodicTex,
	recurrenceTex,
	relationTex,
} from '@/lib/lrs-format';

const props = defineProps<{ preset?: Variant2Preset }>();

const KEYS = [ 'g', 'beta' ];

const gId = useQueryParam('g', () => props.preset?.field.g ?? FIELD_POLYS[0]!.id);
const betaText = useQueryParam('beta', () => props.preset?.field.beta ?? '');

const g = computed(() => findFieldPoly(gId.value).mask);
const beta = computed(() => parseElement(betaText.value, g.value));

const result = computed(() =>
{
	if (!betaText.value.trim()) return null;
	if (beta.value === null) return { ok: false as const, error: 'Не удалось прочитать β. Пример записи: a^3+a+1 (a — это α).' };

	return solveField(g.value, beta.value);
});

const solved = computed(() =>
{
	if (result.value?.ok) return result.value;

	return null;
});

const options = FIELD_POLYS.map((item) => ({
	value: item.id,
	label: exponents(item.mask).map((i) =>
	{
		if (i === 0) return '1';

		return i === 1
			? 'x'
			: `x${'⁰¹²³⁴'[i]}`;
	}).
		join(' + '),
}));

const alpha = (mask: number): string => maskTex(mask);
const inX = (mask: number): string => maskTex(mask, 'x');

/** α⁴ → (α+1): старшие степени подставляются по правилам поля, остальные остаются как есть. */
function substituted (raw: number): string
{
	return exponents(raw).map((i) =>
	{
		if (i >= FIELD_DEGREE) return alpha(solved.value!.rules.find((rule) => rule.power === i)!.value);

		return alpha(1 << i);
	}).
		join('+');
}

function stepTex (step: PowerStep): string
{
	const product = step.left === step.right
		? `\\left(${alpha(step.left)}\\right)^{2}`
		: `\\left(${alpha(step.left)}\\right)\\left(${alpha(step.right)}\\right)`;
	const chain = [ `\\beta^{${step.n}}`, product, alpha(step.raw) ];

	if (step.raw >= 1 << FIELD_DEGREE) chain.push(substituted(step.raw));
	if (chain[chain.length - 1] !== alpha(step.result)) chain.push(alpha(step.result));

	return chain.join('=');
}

/** c₀ + c₁(α²+α) + … — подстановка степеней β. */
const combination = computed(() => solved.value?.powers.map((value, i) =>
{
	if (value === 1) return `c_{${i}}`;

	return exponents(value).length > 1
		? `c_{${i}}\\left(${alpha(value)}\\right)`
		: `c_{${i}}${alpha(value)}`;
}).join('+') ?? '');

const systemTex = computed(() =>
{
	const rows = solved.value?.system.map((equation) => `${equation.terms.map((i) => `c_{${i}}`).join('+')}=0`) ?? [];

	return `\\begin{cases}${rows.join('\\\\')}\\end{cases}`;
});

const solutionTex = computed(() => Array.from({ length: FIELD_DEGREE + 1 }, (_, i) => `c_{${i}}=${solved.value!.h >> i & 1}`).join(',\\ '));

/** h(β): каждая степень β заменяется своим значением — в сумме должно получиться 0. */
function valueAtBeta (poly: number): string
{
	return exponents(poly).map((i) => alpha(solved.value!.powers[i]!)).
		join('+');
}

const parity = (mask: number): number => exponents(mask).length % 2;

const coefs = computed(() =>
{
	if (!solved.value) return [];

	const { init, taps } = solved.value;

	return init.map((_, i) => Number(taps.includes(i)));
});

/** β^(N/q) ≠ 1 для простых q | N — порядок β ровно N. */
const orderChecks = computed(() =>
{
	if (!solved.value) return [];

	const { order } = solved.value;

	return primeDivisors(order).map((q) => order / q).
		filter((n) => n > 1).
		map((n) => `\\beta^{${n}}=${alpha(fieldPow(solved.value!.beta, n, g.value))}\\ne 1`);
});

const periodic = computed(() =>
{
	if (!solved.value) return '';

	return periodicTex(solved.value.sequence.slice(0, solved.value.order));
});
</script>

<template>
	<div class="space-y-4">
		<section class="card grid gap-3 sm:grid-cols-2">
			<FieldSelect
				v-model="gId"
				label="Многочлен g(x), которым построено поле"
				:options="options"
			/>
			<FieldText
				v-model="betaText"
				label="Элемент поля"
				placeholder="a^2+a"
				hint="Многочлен от α: пишите a вместо α, степень — a^3 или a3"
				plain
			/>
			<div class="sm:col-span-2">
				<ResetButton :keys="KEYS" />
			</div>
		</section>

		<TaskStatement>
			Поле F₁₆ построено с помощью многочлена
			<TexMath :tex="`g(x)=${inX(g)},\\ g(\\alpha)=0`" />.
			Характеристическим многочленом линейной рекуррентной последовательности над Z₂ является минимальный многочлен элемента
			<TexMath :tex="beta === null ? '\\beta' : alpha(beta)" />.
			Сгенерировать последовательность с данным характеристическим многочленом, имеющую максимально возможный минимальный период.
		</TaskStatement>

		<p
			v-if="result && !result.ok"
			class="error"
		>
			{{ result.error }}
		</p>

		<template v-if="solved">
			<StepCard>
				<p class="tex-line">
					<TexMath tex="F_{16}" />
					<TexMath :tex="`\\qquad g(x)=${inX(solved.g)}`" />
					<TexMath tex="\qquad g(\alpha)=0" />
				</p>
				<p class="tex-line">
					<TexMath tex="Z_{2}" />
					<TexMath :tex="`\\qquad \\beta=${alpha(solved.beta)}`" />
					<TexMath :tex="`\\qquad \\alpha^{4}=${alpha(solved.rules[0]!.value)}`" />
				</p>
				<p class="note">
					дальше понадобятся
					<TexMath :tex="solved.rules.slice(1).map((rule) => `\\alpha^{${rule.power}}=${alpha(rule.value)}`).join(',\\ ')" />
				</p>
			</StepCard>

			<StepCard title="Степени β">
				<p class="tex-line">
					<TexMath :tex="`\\beta=${alpha(solved.beta)}`" />
				</p>
				<p
					v-for="step in solved.steps"
					:key="step.n"
					class="tex-line"
				>
					<TexMath :tex="stepTex(step)" />
				</p>
			</StepCard>

			<StepCard title="Линейная зависимость степеней β">
				<p class="tex-line">
					<TexMath tex="\beta^{0}c_{0}+\beta^{1}c_{1}+\beta^{2}c_{2}+\beta^{3}c_{3}+\beta^{4}c_{4}=0" />
				</p>
				<p class="tex-line">
					<TexMath :tex="`${combination}=0`" />
				</p>
				<p class="tex-line">
					<TexMath :tex="systemTex" />
					<TexMath :tex="`\\qquad ${solutionTex}`" />
				</p>
				<p class="note">
					уравнения — коэффициенты при
					<TexMath :tex="solved.system.map((equation) => alpha(1 << equation.power)).join(',\\ ')" />;
					{{ solved.exponent > 1 ? 'система оставляет свободные неизвестные — взято решение с c₄ = 1' : 'c₄ = 1, остальные находятся однозначно' }}
				</p>
			</StepCard>

			<StepCard title="Минимальный многочлен">
				<p class="tex-line">
					<TexMath :tex="`h(x)=${inX(solved.h)}${solved.exponent > 1 ? `=\\left(${inX(solved.minimal)}\\right)^{${solved.exponent}}` : ''}`" />
					<template v-if="solved.exponent === 1">
						<TexMath :tex="`\\qquad h(0)=${solved.h & 1}`" />
						<TexMath :tex="`\\qquad h(1)=${parity(solved.h)}`" />
					</template>
				</p>
				<template v-if="solved.exponent > 1">
					<p class="tex-line">
						<TexMath :tex="`h_{1}(x)=${inX(solved.minimal)}`" />
					</p>
					<p class="tex-line">
						<TexMath :tex="`h_{1}(\\beta)=${valueAtBeta(solved.minimal)}=0`" />
					</p>
				</template>
				<template v-else>
					<p class="tex-line">
						<TexMath :tex="`h(\\beta)=${valueAtBeta(solved.h)}=0`" />
					</p>
					<p class="note">
						корней у h(x) нет, и на x² + x + 1 он не делится — многочлен неприводим
					</p>
				</template>
				<p class="tex-line answer">
					<TexMath :tex="`f(x)=${inX(solved.minimal)}`" />
				</p>
			</StepCard>

			<StepCard title="Соотношение и последовательность">
				<p class="tex-line">
					<TexMath :tex="relationTex(coefs)" />
					<TexMath :tex="`\\qquad ${recurrenceTex(coefs)}`" />
				</p>
				<p class="tex-line">
					<TexMath
						v-for="(check, i) in orderChecks"
						:key="i"
						:tex="`${check},\\quad`"
					/>
					<TexMath :tex="`\\beta^{${solved.order}}=1\\ \\Rightarrow\\ \\operatorname{ord} f(x)=${solved.order}`" />
				</p>
				<p class="note">
					f(x) неприводим, поэтому любое ненулевое начальное заполнение даёт наибольший период — он равен ord f(x)
				</p>
				<p class="tex-line">
					<TexMath :tex="initialTex(solved.init)" />
				</p>
				<p class="tex-line">
					<TexMath :tex="`s=${periodic}`" />
				</p>
				<p class="tex-line answer">
					<TexMath :tex="`r_{0\\,min}=${solved.order}`" />
				</p>
			</StepCard>
		</template>
	</div>
</template>
