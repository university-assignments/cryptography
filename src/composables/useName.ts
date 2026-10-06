import { computed, ref } from 'vue';
import { nameSeed } from '@/lib/hash';
import { sendStats } from '@/lib/stats';
import { useId } from './useId';

/* Ключ читает GTM (переменная «JS - Имя пользователя» → user_name в GA4): переименуешь — поправь контейнер. */
const STORAGE_KEY = 'name';

function readStored (): string
{
	try
	{
		return localStorage.getItem(STORAGE_KEY) ?? '';
	}
	catch
	{
		return '';
	}
}

const name = ref(readStored());

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

		try
		{
			if (name.value) localStorage.setItem(STORAGE_KEY, name.value);
			else localStorage.removeItem(STORAGE_KEY);
		}
		catch
		{

			/* приватный режим — имя живёт до перезагрузки */
		}
	};

	return { name, seed, hasName, setName };
}
