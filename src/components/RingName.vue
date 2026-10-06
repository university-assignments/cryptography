<script setup lang="ts">
import { computed } from 'vue';
import type { Alphabet } from '@/lib/alphabet';
import { sub } from '@/lib/format';

const props = defineProps<{ alphabet: Alphabet }>();
const label = computed(() => `Z${sub(props.alphabet.letters.length)}`);
</script>

<template>
	<span class="font-serif text-lg">{{ label }}</span>
</template>
