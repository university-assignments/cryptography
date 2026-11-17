<script setup lang="ts">
import { computed } from 'vue';
import FieldText from '@/components/FieldText.vue';
import MatrixView from '@/components/MatrixView.vue';
import ResetButton from '@/components/ResetButton.vue';
import SequenceLine from '@/components/SequenceLine.vue';
import StepCard from '@/components/StepCard.vue';
import TaskStatement from '@/components/TaskStatement.vue';
import TexMath from '@/components/TexMath.vue';
import TranslationLine from '@/components/TranslationLine.vue';
import { useQueryParam } from '@/composables/useQueryParam';
import {
	type Variant2Preset,
	parseCoefs,
	parseList,
} from '@/data/work-2/variants';
import { generate } from '@/lib/lrs';
import {
	analyzeRegister,
	streamDecrypt,
	streamEncrypt,
	TERNARY_BASE,
	TERNARY_WIDTH,
} from '@/lib/lrs-cipher';
import {
	initialTex,
	periodicTex,
	recurrenceTex,
	relationTex,
	shiftedRelationTex,
} from '@/lib/lrs-format';
import { polyTex } from '@/lib/poly';

const props = defineProps<{ preset?: Variant2Preset }>();

const KEYS = [ 'rec', 'init', 'text', 'cipher' ];

const rec = useQueryParam('rec', () => props.preset?.stream.coefs ?? '');
const start = useQueryParam('init', () => props.preset?.stream.init ?? '');
const text = useQueryParam('text', () => props.preset?.stream.encrypt ?? '');
const cipher = useQueryParam('cipher', () => props.preset?.stream.decrypt ?? '');

const coefs = computed(() => parseCoefs(rec.value));
const init = computed(() => parseList(start.value));
const ready = computed(() => Boolean(rec.value.trim() && start.value.trim()));

const analysis = computed(() =>
{
	if (!ready.value) return null;

	return analyzeRegister(coefs.value, init.value);
});
const register = computed(() =>
{
	if (analysis.value?.ok) return analysis.value;

	return null;
});

const encrypted = computed(() =>
{
	if (!ready.value || !text.value.trim()) return null;

	return streamEncrypt(text.value, coefs.value, init.value);
});
const decrypted = computed(() =>
{
	if (!ready.value || !cipher.value.trim()) return null;

	return streamDecrypt(cipher.value, coefs.value, init.value);
});

const order = computed(() => coefs.value.length);

/** Период ключевой последовательности в квадратных скобках — как в тетради. */
const periodic = computed(() =>
{
	if (!register.value) return '';

	const { preperiod, period } = register.value.periodicity;
	const s = generate(coefs.value, init.value, TERNARY_BASE, preperiod + period);

	return periodicTex(s.slice(preperiod), s.slice(0, preperiod));
});

/** Корни f(x) в Z₃ — по ним видно, что многочлен приводим. */
const roots = computed(() =>
{
	const found: number[] = [];

	register.value?.values.forEach((value, x) =>
	{
		if (value === 0) found.push(x);
	});

	return found;
});

const factorsTex = computed(() => register.value?.factorization.factors.map(({ poly, power }) =>
{
	if (power > 1) return `(${polyTex(poly)})^{${power}}`;

	return `(${polyTex(poly)})`;
}).join('') ?? '');

const irreducibleTex = computed(() =>
{
	const found = register.value?.order ?? 0;

	if (found === 0) return 'f(x)\\ \\text{— неприводим}';

	return `f(x)\\ \\text{— неприводим}\\ \\Rightarrow\\ \\operatorname{ord} f(x)=|A|=${found}`;
});
</script>

<template>
	<div class="space-y-4">
		<section class="card grid gap-3 sm:grid-cols-2">
			<FieldText
				v-model="rec"
				label="Коэффициенты соотношения"
				placeholder="1,0,1"
				hint="По убыванию: s(n+3) = a₂·s(n+2) + a₁·s(n+1) + a₀·s(n) → «a₂,a₁,a₀»"
				plain
			/>
			<FieldText
				v-model="start"
				label="Начальные условия"
				placeholder="0,0,1"
				hint="s₀, s₁, s₂ через запятую"
				plain
			/>
			<FieldText
				v-model="text"
				label="а) Зашифровать"
				placeholder="VIVEREESTCOGITARE"
			/>
			<FieldText
				v-model="cipher"
				label="в) Расшифровать"
				placeholder="EKYAJNRLG+JIXJ"
			/>
			<div class="sm:col-span-2">
				<ResetButton :keys="KEYS" />
			</div>
		</section>

		<TaskStatement>
			Ключом шифрования является линейная рекуррентная последовательность над Z₃ с начальными условиями
			<TexMath :tex="initialTex(init)" />, заданная соотношением
			<TexMath :tex="recurrenceTex(coefs)" />.
			Буквы латинского алфавита с дополнительным символом + представлены троичной записью их номера.
			<span
				v-if="text.trim()"
				class="block"
			>а) зашифровать {{ text }}</span>
			<span
				v-if="cipher.trim()"
				class="block"
			>в) расшифровать {{ cipher }}</span>
			<span class="block">Записать ассоциированную матрицу и характеристический многочлен данной последовательности. Найти их порядки и определить минимальный период последовательности.</span>
		</TaskStatement>

		<p
			v-if="analysis && !analysis.ok"
			class="error"
		>
			{{ analysis.error }}
		</p>

		<template v-if="register">
			<StepCard>
				<p class="tex-line">
					<TexMath tex="Z_{3}" />
					<TexMath :tex="`\\qquad ${initialTex(init)}`" />
					<TexMath :tex="`\\qquad ${recurrenceTex(coefs)}`" />
				</p>
				<p class="note">
					номера букв: A = 0 → 0,0,0; B = 1 → 0,0,1; … Z = 25 → 2,2,1; «+» = 26 → 2,2,2
				</p>
			</StepCard>

			<template v-if="encrypted">
				<p
					v-if="!encrypted.ok"
					class="error"
				>
					{{ encrypted.error }}
				</p>
				<StepCard
					v-else
					title="а) Зашифровать: y = x + s"
				>
					<p class="seq">
						X = {{ encrypted.input }}
					</p>
					<SequenceLine
						label="x"
						:values="encrypted.inDigits"
						:group="TERNARY_WIDTH"
					/>
					<p class="seq">
						+
					</p>
					<SequenceLine
						label="s"
						:values="encrypted.key"
						:group="TERNARY_WIDTH"
					/>
					<SequenceLine
						label="y"
						:values="encrypted.outDigits"
						:group="TERNARY_WIDTH"
					/>
					<p class="answer">
						Y = {{ encrypted.output }}
					</p>
				</StepCard>
			</template>

			<template v-if="decrypted">
				<p
					v-if="!decrypted.ok"
					class="error"
				>
					{{ decrypted.error }}
				</p>
				<StepCard
					v-else
					title="в) Расшифровать: x = y − s"
				>
					<p class="seq">
						Y = {{ decrypted.input }}
					</p>
					<SequenceLine
						label="y"
						:values="decrypted.inDigits"
						:group="TERNARY_WIDTH"
					/>
					<p class="seq">
						−
					</p>
					<SequenceLine
						label="s"
						:values="decrypted.key"
						:group="TERNARY_WIDTH"
					/>
					<SequenceLine
						label="x"
						:values="decrypted.outDigits"
						:group="TERNARY_WIDTH"
					/>
					<p class="answer">
						X = {{ decrypted.output }}
					</p>
					<TranslationLine :text="decrypted.output" />
				</StepCard>
			</template>

			<StepCard title="Ассоциированная матрица и характеристический многочлен">
				<p class="flex flex-wrap items-center gap-2 text-sm">
					<TexMath :tex="`A_{${order}\\times ${order}}=`" />
					<MatrixView :rows="register.matrix" />
					<span>— ассоциированная матрица</span>
				</p>
				<p class="tex-line">
					<TexMath :tex="`${shiftedRelationTex(coefs)}\\ \\big|:x^{n}`" />
				</p>
				<p class="tex-line">
					<TexMath :tex="relationTex(coefs)" />
				</p>
				<p class="tex-line">
					<TexMath :tex="`${polyTex(register.f)}=0`" />
				</p>
				<p class="tex-line">
					<TexMath :tex="`f(x)=${polyTex(register.f)}`" />
					<span class="text-sm">— характеристический многочлен</span>
				</p>
			</StepCard>

			<StepCard
				v-if="register.order > 0"
				title="Порядок матрицы"
			>
				<div class="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
					<span
						v-for="item in register.powers"
						:key="item.n"
						class="flex items-center gap-2"
					>
						<TexMath :tex="`A^{${item.n}}=`" />
						<MatrixView :rows="item.matrix" />
						<TexMath
							v-if="item.n === register.order"
							tex="=E"
						/>
					</span>
					<span
						v-if="register.order === 1"
						class="flex items-center gap-2"
					>
						<TexMath tex="A=E" />
					</span>
				</div>
				<p class="tex-line">
					<TexMath :tex="`|A|\\ \\text{делит}\\ ${register.order}`" />
				</p>
				<p class="tex-line">
					<TexMath :tex="`|A|=${register.orderDivisors.join(',\\,')}\\ \\Rightarrow\\ |A|=${register.order}`" />
				</p>
				<p class="note">
					младшие степени не равны E, значит порядок — именно {{ register.order }}
				</p>
			</StepCard>
			<p
				v-else
				class="error"
			>
				a₀ = 0: матрица A вырождена, порядка у неё и у f(x) нет — последовательность входит в период не сразу.
			</p>

			<StepCard title="Порядок многочлена и минимальный период">
				<p class="tex-line">
					<TexMath :tex="`f(x)=${polyTex(register.f)}`" />
					<TexMath
						v-for="(value, x) in register.values"
						:key="x"
						:tex="`\\qquad f(${x})=${value}`"
					/>
				</p>
				<template v-if="register.irreducible">
					<p class="tex-line">
						<TexMath :tex="irreducibleTex" />
					</p>
					<p
						v-if="order > 3"
						class="note"
					>
						корней нет, и на многочлены меньшей степени f(x) не делится
					</p>
				</template>
				<template v-else>
					<p class="tex-line">
						<TexMath
							v-if="roots.length"
							:tex="`f(${roots[0]})=0\\ \\Rightarrow`"
						/>
						<TexMath :tex="`f(x)\\ \\text{— приводим:}\\quad f(x)=${factorsTex}`" />
					</p>
					<p
						v-if="register.order > 0"
						class="tex-line"
					>
						<TexMath :tex="`\\operatorname{ord} f(x)=|A|=${register.order}`" />
					</p>
					<p
						v-if="register.order > 0"
						class="note"
					>
						A — сопровождающая матрица f(x), поэтому ord f(x) = |A| и для приводимого многочлена; период смотрим по самой последовательности
					</p>
				</template>
				<p class="tex-line">
					<TexMath :tex="`s=${periodic}`" />
				</p>
				<p class="tex-line answer">
					<TexMath :tex="`r_{0\\,min}=${register.periodicity.period}`" />
				</p>
			</StepCard>
		</template>
	</div>
</template>
