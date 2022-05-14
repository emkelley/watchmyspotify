<template>
  <iframe
    class="playlist-iframe w-full aspect-video"
    :src="props.embedURL"
    title="YouTube video player"
    frameborder="0"
    allowfullscreen
    allow="autoplay"
  />
  <div class="px-8 flex flex-row justify-center">
    <a
      v-if="props.ytShareURL"
      :href="props.ytShareURL"
      target="_blank"
      rel="noopener"
      class="btn btn-danger my-8 font-bold rounded-none"
    >
      <i class="fab fa-youtube pr-2" />
      Open Playlist on YouTube
      <i class="fas fa-link pl-2" />
    </a>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  embedURL: String,
  ytShareURL: String,
});
</script>

<style scoped></style>
