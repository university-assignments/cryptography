<script setup lang="ts">
import { computed } from 'vue';
import FieldSelect from '@/components/FieldSelect.vue';
import FieldText from '@/components/FieldText.vue';
import LrsSeriesProduct from '@/components/tasks/LrsSeriesProduct.vue';
import RegisterDiagram from '@/components/RegisterDiagram.vue';
import ResetButton from '@/components/ResetButton.vue';
import StepCard from '@/components/StepCard.vue';
import TaskStatement from '@/components/TaskStatement.vue';
import TexMath from '@/components/TexMath.vue';
import { useQueryParam } from '@/composables/useQueryParam';
import { type Variant2Preset, parseList } from '@/data/work-2/variants';
import { sub } from '@/lib/format';
import {
	generate,
	linearDivisorWitness,
	minimalRecurrence,
} from '@/lib/lrs';
import {
	ascendingTex,
	initialTex,
	recurrenceTex,
	relationTex,
	seriesTex,
} from '@/lib/lrs-format';
import { type Factorization, degree, polyTex } from '@/lib/poly';

const props = defineProps<{ preset?: Variant2Preset }>();

const KEYS = [ 'p', 'seq', 'type' ];

const SUBTYPES = [
	{ value: 'shift', label: 'Минимальный регистр сдвига' },
	{ value: 'feedback', label: 'Линейный регистр с обратной связью' },
];

const subtype = useQueryParam('type', () => 'shift');
const isShift = computed(() => subtype.value !== 'feedback');
const registerTitle = computed(() =>
{
	return isShift.value
		? SUBTYPES[0]!.label
		: SUBTYPES[1]!.label;
});

const modulus = useQueryParam('p', () => String(props.preset?.minimal.p ?? ''));
const seq = useQueryParam('seq', () => props.preset?.minimal.period ?? '');

const p = computed(() => Number(modulus.value.trim()));
const period = computed(() => parseList(seq.value));

const result = computed(() =>
{
	if (!modulus.value.trim() || !seq.value.trim()) return null;

	return minimalRecurrence(period.value, p.value);
});

const solved = computed(() =>
{
	if (result.value?.ok) return result.value;

	return null;
});

const linearCheck = computed(() =>
{
	const base = solved.value;

	if (!base) return null;

	const witness = linearDivisorWitness(base);

	if (!witness) return null;

	const { index, current, previous, difference } = witness;
	const exponent = index === 0
		? `${base.period.length}m`
		: `${base.period.length}m+${index}`;
	const coefficient = `[x^{${exponent}}]`;
	const start = `m\\ge ${Number(index === 0)}`;

	if (previous === 0)
	{
		return {
			form: 'q\\mid D\\ \\Rightarrow\\ q(0)\\ne 0,\\quad q(x)=1+ax',
			start,
			tex: `${coefficient}(1+ax)S(x)=${current}+a\\cdot 0=${current}\\ne 0`,
		};
	}

	if (current === 0)
	{
		return {
			form: 'q(x)=x+a',
			start,
			tex: `${coefficient}(x+a)S(x)=${previous}+a\\cdot 0=${previous}\\ne 0`,
		};
	}

	return {
		form: '',
		start,
		tex: `${coefficient}(1-x)S(x)=${current}-${previous}\\equiv ${difference}\\not\\equiv 0\\pmod{${base.p}}`,
	};
});

function factorizationTex (factorization: Factorization): string
{
	const unit = factorization.unit === 1
		? ''
		: String(factorization.unit);

	return unit + factorization.factors.map(({ poly, power }) => `(${polyTex(poly)})${power > 1
		? `^{${power}}`
		: ''}`).join('');
}

const minimumTex = computed(() =>
{
	const base = solved.value;

	if (!base) return '';

	const { complete, factors } = base.candidateFactors;
	const polynomial = polyTex(base.candidate);

	if (!complete || factors.length === 1 && factors[0]!.power === 1) return polynomial;

	return `${factorizationTex(base.candidateFactors)}=${polynomial}`;
});

const check = computed(() =>
{
	if (!solved.value) return [];

	return generate(solved.value.coefs, solved.value.init, solved.value.p, period.value.length * 2);
});
</script>

<template>
	<div class="space-y-4">
		<section class="card grid gap-3 sm:grid-cols-2">
			<div class="sm:col-span-2">
				<FieldSelect
					v-model="subtype"
					label="Подтип задания"
					:options="SUBTYPES"
				/>
			</div>
			<FieldText
				v-model="modulus"
				label="Модуль p (простое число)"
				placeholder="7"
				plain
			/>
			<FieldText
				v-model="seq"
				label="Период последовательности"
				placeholder="0,2,2,6,3,1"
				hint="Один период, числа через запятую"
				plain
			/>
			<div class="sm:col-span-2">
				<ResetButton :keys="KEYS" />
			</div>
		</section>

		<TaskStatement>
			Найти минимальное линейное однородное рекуррентное соотношение над Z{{ sub(modulus.trim()) }}, задающее последовательность
			({{ period.join(',') }}, {{ period.join(',') }}…)<template v-if="isShift">. Построить минимальный регистр сдвига, реализующий данную последовательность.</template>
			<span
				v-else
				class="block"
			>Построить линейный регистр с обратной связью, реализующий на выходе данную последовательность.</span>
		</TaskStatement>

		<p
			v-if="result && !result.ok"
			class="error"
		>
			{{ result.error }}
		</p>

		<StepCard
			v-if="solved && solved.numerator.length === 0"
			title="Умножение ряда"
		>
			<p class="tex-line">
				<TexMath :tex="`S(x)=\\sum_{m=0}^{\\infty}0\\cdot x^{${solved.period.length}m}=0`" />
				<TexMath tex="h_{\min}(x)=1,\quad \deg h_{\min}=0" />
			</p>
			<p class="tex-line answer">
				<TexMath tex="h_{\min}(x)S(x)=1\cdot0=0,\quad s_n=0" />
			</p>
		</StepCard>

		<template v-else-if="solved">
			<StepCard title="Производящая функция">
				<p class="tex-line">
					<TexMath :tex="`\\mathbb{Z}_{${solved.p}},\\quad T=${solved.period.length}`" />
				</p>
				<p class="tex-line">
					<TexMath :tex="`S(x)=${seriesTex(solved.period, solved.period.length, 0)}`" />
				</p>
				<p class="tex-line">
					<TexMath :tex="`P(x)=${ascendingTex(solved.numerator)}`" />
					<TexMath :tex="`D(x)=1-x^{${solved.period.length}}`" />
				</p>
				<p class="tex-line">
					<TexMath :tex="`S(x)=P(x)(1+x^{${solved.period.length}}+x^{${2 * solved.period.length}}+\\dots)=\\frac{P(x)}{D(x)}`" />
				</p>
			</StepCard>

			<StepCard title="Минимальный аннулирующий многочлен">
				<div
					v-if="linearCheck"
					class="space-y-1 border-b border-stone-200 pb-3 dark:border-stone-800"
				>
					<p
						v-if="linearCheck.form"
						class="tex-line"
					>
						<span class="text-sm">Линейный делитель после нормировки</span>
						<TexMath :tex="linearCheck.form" />
					</p>
					<p class="tex-line">
						<TexMath :tex="linearCheck.tex" />
						<TexMath :tex="linearCheck.start" />
					</p>
					<p class="text-sm">
						<template v-if="linearCheck.form">
							Хвост ненулевой при любом <TexMath tex="a" />. Линейные делители отпадают.
						</template>
						<template v-else>
							Хвост ненулевой, поэтому <TexMath tex="1-x" /> отпадает.
						</template>
					</p>
				</div>
				<p class="tex-line">
					<TexMath :tex="`C(x)=\\text{НОД}(D(x),P(x))=${polyTex(solved.common)}`" />
				</p>
				<p class="tex-line">
					<TexMath :tex="`P_{*}(x)=P(x)/C(x)=${ascendingTex(solved.reducedNumerator)}`" />
					<TexMath :tex="`D_{*}(x)=D(x)/C(x)=${polyTex(solved.reducedDenominator)}`" />
				</p>
				<p class="tex-line">
					<TexMath tex="\gcd(P_{*},D_{*})=1" />
					<TexMath :tex="`qS=\\frac{qP_{*}}{D_{*}}\\in\\mathbb{Z}_{${solved.p}}[x]\\quad\\Longleftrightarrow\\quad D_{*}\\mid q`" />
				</p>
				<p class="tex-line answer">
					<TexMath :tex="`h_{\\min}(x)=${minimumTex},\\quad \\deg h_{\\min}=${degree(solved.candidate)}`" />
				</p>
				<p class="text-sm">
					Пропускаем степени меньше {{ degree(solved.candidate) }} и делители без всех множителей <TexMath tex="D_{*}" /> с нужными кратностями.
				</p>
			</StepCard>

			<LrsSeriesProduct :solution="solved" />

			<StepCard title="Характеристический многочлен и соотношение">
				<p class="tex-line">
					<TexMath :tex="`g(x)=${solved.scale}\\cdot h_{\\min}(x)=${polyTex(solved.g)},\\quad g(0)=1`" />
				</p>
				<p class="tex-line">
					<TexMath :tex="`f(x)=x^{${degree(solved.g)}}g\\left(\\frac{1}{x}\\right)=${polyTex(solved.f)}`" />
				</p>
				<p class="tex-line">
					<TexMath :tex="`${relationTex(solved.coefs)}\\qquad (x^i\\to s_{n+i})`" />
				</p>
				<p class="tex-line answer">
					<TexMath :tex="recurrenceTex(solved.coefs)" />
					<TexMath :tex="initialTex(solved.init)" />
				</p>
			</StepCard>

			<StepCard :title="registerTitle">
				<RegisterDiagram
					:coefs="solved.coefs"
					:init="solved.init"
				/>
				<p class="seq">
					Из регистра получаем {{ check.join(', ') }}, …
				</p>
			</StepCard>
		</template>
	</div>
</template>
