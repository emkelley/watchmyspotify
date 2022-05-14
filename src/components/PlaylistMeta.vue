<script setup lang="ts">
import { SpotifyPlaylist } from "@/interfaces/SpotifyPlaylist";
// const emit = defineEmits(["playlist"]);

const props = defineProps<{
  plstRaw: SpotifyPlaylist;
}>();
// emit("type", "data");
</script>

<template>
  <section
    class="flex flex-col text-emerald-50 text-3xl pt-4 pb-8 font-bold text-center"
  >
    <!-- playlist meta -->
    <a
      :href="props.plstRaw.external_urls.spotify"
      target="_blank"
      rel="noopener"
      class="text-4xl mr-6"
    >
      <span class="text-emerald-200">
        {{ props.plstRaw.name }}
      </span>
    </a>
    <p v-if="plstRaw.description" class="text-base my-4">
      {{ props.plstRaw.description }}
    </p>
    <a
      :href="props.plstRaw.owner.external_urls.spotify"
      target="_blank"
      rel="noopener"
      class="text-sm uppercase font-normal"
    >
      By
      <span class="text-emerald-200">
        {{ props.plstRaw.owner.display_name }}
      </span>
    </a>
  </section>
</template>

<style scoped></style>
