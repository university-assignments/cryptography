import { computed, ref } from 'vue';
import { nameSeed } from '@/lib/hash';
import { sendStats } from '@/lib/stats';
import { readStored, writeStored } from '@/lib/storage';
import { useId } from './useId';

/* localStorage['cryptography:name'] читает GTM (переменная «JS - Имя пользователя» → user_name в GA4): переименуешь — поправь контейнер. */
const STORAGE_KEY = 'name';

const name = ref(readStored(STORAGE_KEY));

/* Последнее непустое имя: при смене имени через кнопку оно сначала очищается. */
let lastName = name.value;

export function useName ()
{
	const seed = computed(() => nameSeed(name.value));
	const hasName = computed(() => name.value.trim().length > 0);

	const setName = (value: string): void =>
	{
		const next = value.trim();

		if (next && next !== lastName)
		{
			sendStats({ type: 'name', id: useId().id.value, oldName: lastName, newName: next });
			lastName = next;
		}

		name.value = next;
		writeStored(STORAGE_KEY, next);
	};

	return { name, seed, hasName, setName };
}
