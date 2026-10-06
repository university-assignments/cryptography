import {
	type MaybeRefOrGetter, type WritableComputedRef, computed, toValue,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

/**
 * Строковое поле формы, живущее в query-параметре: пока значение равно значению
 * по умолчанию (условию варианта), параметра в URL нет; изменил — ссылка стала воспроизводимой.
 */
export function useQueryParam (key: string, fallback: MaybeRefOrGetter<string>): WritableComputedRef<string>
{
	const route = useRoute();
	const router = useRouter();

	return computed({
		get: () =>
		{
			const raw = route.query[key];

			return typeof raw === 'string'
				? raw
				: toValue(fallback);
		},
		set: (value: string) =>
		{
			const query = { ...route.query };

			if (value === toValue(fallback)) delete query[key];
			else query[key] = value;

			void router.replace({ query });
		},
	});
}

export function useQueryReset (keys: string[])
{
	const route = useRoute();
	const router = useRouter();
	const dirty = computed(() => keys.some((key) => key in route.query));

	const reset = (): void =>
	{
		const query = { ...route.query };

		for (const key of keys) delete query[key];

		void router.replace({ query });
	};

	return { dirty, reset };
}
