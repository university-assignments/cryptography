<script setup lang="ts">
import { computed } from 'vue';
import FieldText from '@/components/FieldText.vue';
import RegisterDiagram from '@/components/RegisterDiagram.vue';
import ResetButton from '@/components/ResetButton.vue';
import StepCard from '@/components/StepCard.vue';
import TaskStatement from '@/components/TaskStatement.vue';
import TexMath from '@/components/TexMath.vue';
import { useQueryParam } from '@/composables/useQueryParam';
import { type Variant2Preset, parseList } from '@/data/work-2/variants';
import { sub } from '@/lib/format';
import { type SeriesProduct, generate, minimalRecurrence } from '@/lib/lrs';
import {
	ascendingTex,
	initialTex,
	periodicTex,
	recurrenceTex,
	relationTex,
	seriesTex,
} from '@/lib/lrs-format';
import {
	type Factorization,
	type Poly,
	degree,
	polyTex,
} from '@/lib/poly';

const props = defineProps<{ preset?: Variant2Preset }>();

const KEYS = [ 'p', 'seq' ];

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

/** (x+1)(x+2)^{2} — произведение неприводимых множителей. */
function factorsTex (factorization: Factorization): string
{
	const unit = factorization.unit === 1
		? ''
		: String(factorization.unit);

	return unit + factorization.factors.map(({ poly, power }) => `(${polyTex(poly)})${power > 1
		? `^{${power}}`
		: ''}`).join('');
}

/** Слагаемые q(x)·S(x): каждый коэффициент q даёт свой сдвинутый ряд — как расписано в тетради. */
function shiftedSeries (factor: Poly): string[]
{
	const t = period.value.length;

	const series: string[] = [];

	factor.forEach((coef, shift) =>
	{
		if (coef !== 0) series.push(seriesTex(period.value.map((v) => v * coef % p.value), t, shift));
	});

	return series;
}

/** Итог произведения: многочлен в начале и периодический хвост. */
function productTex (test: SeriesProduct): string
{
	const head = ascendingTex(test.head);

	if (test.annihilating) return head;

	const tail = seriesTex(test.tail, period.value.length, degree(test.factor));

	return test.head.some((v) => v !== 0)
		? `${head}+${tail}`
		: tail;
}

/** x²·(5/x² + 6/x + 1) — переход от g(x) к характеристическому f(x). */
function reciprocalTex (g: Poly): string
{
	const k = degree(g);
	const terms = g.map((coef, i) =>
	{
		if (coef === 0) return '';
		if (i === 0) return String(coef);

		return `\\frac{${coef}}{${i === 1
			? 'x'
			: `x^{${i}}`}}`;
	}).filter(Boolean).
		reverse();

	return `${k === 1
		? 'x'
		: `x^{${k}}`}\\cdot\\left(${terms.join('+')}\\right)`;
}

const check = computed(() =>
{
	if (!solved.value) return [];

	return generate(solved.value.coefs, solved.value.init, solved.value.p, period.value.length * 2);
});

const candidateIsFactor = computed(() => solved.value?.candidateFactors.factors.length === 1 && solved.value.candidateFactors.factors[0]!.power === 1);
</script>

<template>
	<div class="space-y-4">
		<section class="card grid gap-3 sm:grid-cols-2">
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
			({{ period.join(',') }}, {{ period.join(',') }}…)
			<span class="block">Построить линейный регистр с обратной связью, реализующий на выходе данную последовательность.</span>
		</TaskStatement>

		<p
			v-if="result && !result.ok"
			class="error"
		>
			{{ result.error }}
		</p>

		<template v-if="solved">
			<StepCard title="Аннулирующий многочлен по периоду">
				<p class="tex-line">
					<TexMath :tex="`Z_{${solved.p}}`" />
					<TexMath :tex="`\\qquad S=${periodicTex(solved.period)}`" />
				</p>
				<p class="tex-line">
					<TexMath :tex="`s_{n+${solved.period.length}}=s_{n}`" />
					<TexMath tex="\qquad s_{i}\to x^{i}" />
				</p>
				<p class="tex-line">
					<TexMath :tex="`x^{n+${solved.period.length}}=x^{n}\\ \\big|:x^{n}`" />
				</p>
				<p class="tex-line">
					<TexMath :tex="`x^{${solved.period.length}}=1`" />
					<TexMath :tex="`\\qquad ${polyTex(solved.periodPoly)}=0`" />
				</p>
				<p class="tex-line">
					<TexMath :tex="`f(x)=${polyTex(solved.periodPoly)}`" />
					<TexMath :tex="`\\qquad g(x)=${polyTex(solved.g0)}`" />
				</p>
				<p class="tex-line">
					<TexMath :tex="`${polyTex(solved.g0)}=1-x^{${solved.period.length}}=${factorsTex(solved.factorization)}`" />
				</p>
				<p
					v-if="!solved.factorization.complete"
					class="note"
				>
					разложение оборвано: степени слишком большие для перебора, последний множитель может раскладываться дальше
				</p>
			</StepCard>

			<StepCard title="Производящая функция">
				<p class="tex-line">
					<TexMath :tex="`S(x)=${seriesTex(solved.period, solved.period.length, 0)}`" />
				</p>
				<p class="tex-line">
					<TexMath :tex="`(${polyTex(solved.g0)})\\cdot S(x)=`" />
					<template
						v-for="(series, i) in shiftedSeries(solved.g0)"
						:key="i"
					>
						<TexMath :tex="`${i > 0 ? '+' : ''}${series}`" />
					</template>
					<TexMath :tex="`=${ascendingTex(solved.numerator)}`" />
				</p>
				<p class="note">
					произведение — многочлен, значит g(x) аннулирует последовательность; минимальный аннулирующий — делитель g(x)
				</p>
			</StepCard>

			<StepCard title="Перебор множителей g(x)">
				<template
					v-for="(test, i) in solved.tests"
					:key="i"
				>
					<template v-if="test.annihilating && !candidateIsFactor">
						<p class="note">
							ни один неприводимый множитель не аннулирует; наименьшую степень даёт их произведение — g(x), делённый на НОД(g(x), g(x)·S(x))
						</p>
						<p class="tex-line">
							<TexMath :tex="`${factorsTex(solved.candidateFactors)}=${polyTex(solved.candidate)}`" />
						</p>
					</template>
					<p class="tex-line">
						<TexMath :tex="`\\bullet\\ (${polyTex(test.factor)})\\cdot S(x)=`" />
						<template
							v-for="(series, j) in shiftedSeries(test.factor)"
							:key="j"
						>
							<TexMath :tex="`${j > 0 ? '+' : ''}${series}`" />
						</template>
						<TexMath :tex="`=${productTex(test)}`" />
						<span :class="test.annihilating ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'text-stone-500'">
							— {{ test.annihilating ? 'аннулирующий' : 'не аннулирующий' }}
						</span>
					</p>
				</template>
			</StepCard>

			<StepCard title="Характеристический многочлен и соотношение">
				<template v-if="solved.scale !== 1">
					<p class="tex-line">
						<TexMath :tex="`g(x)=${polyTex(solved.candidate)}\\ \\big|\\cdot ${solved.scale}`" />
						<TexMath :tex="`\\qquad g(0)=${solved.candidate[0]}`" />
					</p>
					<p class="tex-line">
						<TexMath :tex="`g(x)=${polyTex(solved.g)}`" />
						<TexMath tex="\qquad g(0)=1" />
					</p>
				</template>
				<p
					v-else
					class="tex-line"
				>
					<TexMath :tex="`g(x)=${polyTex(solved.g)}`" />
					<TexMath tex="\qquad g(0)=1" />
				</p>
				<p class="tex-line">
					<TexMath :tex="`f(x)=${reciprocalTex(solved.g)}=${polyTex(solved.f)}`" />
				</p>
				<p class="tex-line">
					<TexMath :tex="`${polyTex(solved.f)}=0`" />
					<TexMath :tex="`\\qquad ${relationTex(solved.coefs)}`" />
				</p>
				<p class="tex-line answer">
					<TexMath :tex="recurrenceTex(solved.coefs)" />
					<TexMath :tex="`\\qquad ${initialTex(solved.init)}`" />
				</p>
			</StepCard>

			<StepCard title="Линейный регистр с обратной связью">
				<RegisterDiagram
					:coefs="solved.coefs"
					:init="solved.init"
				/>
				<p class="note">
					проверка: соотношение с этим заполнением даёт {{ check.join(', ') }}, …
				</p>
			</StepCard>
		</template>
	</div>
</template>
