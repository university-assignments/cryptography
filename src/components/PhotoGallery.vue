<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import type { Photo } from '@/data/work-1/photos';

const props = defineProps<{ photos: Photo[]; galleryId: string }>();
const router = useRouter();

const root = useTemplateRef<HTMLElement>('root');
let lightbox: PhotoSwipeLightbox | null = null;

onMounted(() =>
{
	if (!root.value) return;

	lightbox = new PhotoSwipeLightbox({
		gallery: root.value,
		children: 'a',
		pswpModule: () => import('photoswipe'),
		closeTitle: 'Закрыть',
		zoomTitle: 'Масштаб',
		arrowPrevTitle: 'Назад',
		arrowNextTitle: 'Вперёд',
		errorMsg: 'Фото не загрузилось',
		bgOpacity: 0.95,
		padding: { top: 24, bottom: 48, left: 8, right: 8 },
	});

	lightbox.on('uiRegister', () =>
	{
		lightbox?.pswp?.ui?.registerElement({
			name: 'caption',
			order: 9,
			isButton: false,
			appendTo: 'root',
			onInit: (el, pswp) =>
			{
				el.className = 'pswp-caption';
				pswp.on('change', () =>
				{
					el.textContent = pswp.currSlide?.data.element?.getAttribute('data-caption') ?? '';
				});
			},
		});

		/* Ошибка в тетради: видно сразу при открытии, ссылка ведёт на правильное решение. */
		lightbox?.pswp?.ui?.registerElement({
			name: 'note',
			order: 8,
			isButton: false,
			appendTo: 'root',
			onInit: (el, pswp) =>
			{
				el.className = 'pswp-note';
				el.setAttribute('role', 'alert');
				pswp.on('change', () =>
				{
					const note = props.photos[pswp.currIndex]?.note;

					el.hidden = !note;
					el.replaceChildren();
					if (!note) return;

					const link = document.createElement('a');

					link.href = router.resolve(note.to).href;
					link.textContent = 'Правильное решение →';
					link.addEventListener('click', (event) =>
					{
						event.preventDefault();
						pswp.close();
						void router.push(note.to);
					});
					el.append(`⚠ ${note.text} `, link);
				});
			},
		});
	});

	lightbox.init();
});

onBeforeUnmount(() =>
{
	lightbox?.destroy();
	lightbox = null;
});
</script>

<template>
	<div
		:id="galleryId"
		ref="root"
		class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6"
	>
		<a
			v-for="photo in photos"
			:key="photo.src"
			:href="photo.src"
			:data-pswp-width="photo.width"
			:data-pswp-height="photo.height"
			:data-caption="photo.caption"
			target="_blank"
			rel="noreferrer"
			class="group relative overflow-hidden rounded-lg border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-900"
		>
			<img
				:src="photo.thumb"
				:alt="photo.caption"
				loading="lazy"
				class="aspect-3/4 w-full object-cover transition group-hover:scale-[1.03]"
			>
			<span
				v-if="photo.note"
				class="absolute right-1 top-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow"
			>⚠ ошибка</span>
			<span class="block truncate px-1.5 py-1 text-xs text-stone-500">{{ photo.caption }}</span>
		</a>
	</div>
</template>

<style>
.pswp-caption {
	position: absolute;
	inset: auto 0 0 0;
	padding: 12px 16px;
	text-align: center;
	font-size: 14px;
	color: #fff;
	background: linear-gradient(transparent, rgb(0 0 0 / 0.6));
	pointer-events: none;
}

.pswp-note {
	position: absolute;
	inset: auto 12px 48px 12px;
	max-width: 640px;
	margin: 0 auto;
	padding: 10px 14px;
	border-radius: 10px;
	font-size: 14px;
	line-height: 1.4;
	color: #fff;
	background: rgb(185 28 28 / 0.92);
	box-shadow: 0 4px 16px rgb(0 0 0 / 0.4);
}

.pswp-note a {
	font-weight: 600;
	white-space: nowrap;
	text-decoration: underline;
	color: inherit;
}
</style>
