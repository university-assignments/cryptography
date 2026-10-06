import { computed, ref } from 'vue';
import { nameSeed } from '@/lib/hash';

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

export function useName ()
{
	const seed = computed(() => nameSeed(name.value));
	const hasName = computed(() => name.value.trim().length > 0);

	const setName = (value: string): void =>
	{
		name.value = value.trim();

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
