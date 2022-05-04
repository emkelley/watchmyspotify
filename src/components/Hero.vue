<script setup lang="ts">
const props = defineProps({
  title: String,
  subtext: String,
});
</script>
<template>
  <section
    class="px-4 py-10 border-b border-emerald-800 bg-gradient-to-br from-emerald-900 to-gray-950 text-center"
  >
    <h1 class="text-4xl text-emerald-50 font-bold">{{ props.title }}</h1>
    <p v-if="props.subtext" class="text-emerald-50 max-w-2xl mx-auto mt-5">
      {{ props.subtext }}
    </p>
  </section>
</template>
