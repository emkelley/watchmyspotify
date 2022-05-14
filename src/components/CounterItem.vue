<script setup lang="ts">
const props = defineProps<{
  number: number;
  icon: string;
  color: string;
  title: string;
}>();
</script>

<template>
  <div
    class="flex-row items-center p-5 bg-gray-900 border-emerald-800 shadow-xl card"
  >
    <div
      class="flex items-center justify-center w-14 h-14 text-emerald-50 rounded aspect-square"
      :class="props.color"
    >
      <i class="fas text-2xl" :class="props.icon" />
    </div>

    <div class="ml-3">
      <h2 class="mb-2 text-3xl font-bold leading-none text-emerald-50 truncate">
        {{ props.number }}
      </h2>

      <p class="leading-none text-gray-300">{{ props.title }}</p>
    </div>
  </div>
</template>

<style scoped></style>
