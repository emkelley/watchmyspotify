<script setup lang="ts">
const props = defineProps({
  title: String,
  subtext: String,
});
</script>
<template>
  <section
    class="px-4 py-10 border-b border-green-800 bg-gradient-to-br from-green-900 to-gray-950 text-center"
  >
    <h1 class="text-4xl text-gray-200 font-bold">{{ props.title }}</h1>
    <p v-if="props.subtext" class="text-gray-200 max-w-2xl mx-auto mt-5">
      {{ props.subtext }}
    </p>
  </section>
</template>
