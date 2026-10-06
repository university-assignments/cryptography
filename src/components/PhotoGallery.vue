<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import type { Photo } from '@/data/work-1/photos';

defineProps<{ photos: Photo[]; galleryId: string }>();

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
			class="group overflow-hidden rounded-lg border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-900"
		>
			<img
				:src="photo.thumb"
				:alt="photo.caption"
				loading="lazy"
				class="aspect-3/4 w-full object-cover transition group-hover:scale-[1.03]"
			>
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
</style>
