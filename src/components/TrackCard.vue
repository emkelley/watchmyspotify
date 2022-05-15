<script setup lang="ts">
import VanillaTilt from "vanilla-tilt";
import { onMounted } from "vue";
import { PlaylistTrack } from "@/interfaces/PlaylistTrack";
import { nanoid } from "nanoid";

const props = defineProps<{
  track: PlaylistTrack;
  timedOut: boolean;
  youtube: string;
  success: boolean;
}>();

const rand = nanoid();

onMounted(() => {
  const el = document.getElementById(rand);
  if (!el) return;
  VanillaTilt.init(el, {
    max: 10,
    speed: 400,
    glare: false,
    "max-glare": 0.1,
  });
});
</script>

<template>
  <article class="card-wrapper">
    <div
      :id="rand"
      class="card-content"
      :style="{
        backgroundImage: 'url(' + track.track.album.images![0].url + ')',
      }"
    >
      <div class="flex flex-row items-end">
        <div class="status-flag">
          <div>
            <span v-if="success" class="text-emerald-400">
              <i class="fas fa-circle-check" />
            </span>
            <span v-else-if="timedOut" class="text-red-400">
              <i class="fas fa-circle-x" />
            </span>
            <span v-else class="text-slate-100">
              <i class="fas fa-compact-disc fa-spin" />
            </span>
          </div>
        </div>
      </div>
      <div class="overlay">
        <p class="mb-1 font-bold truncate">
          {{ track.track.name }}
        </p>
        <p class="mb-2 font-light truncate">
          {{ track.track.artists![0].name }}
        </p>
        <div>
          <a
            :href="track.track.external_urls.spotify"
            target="_blank"
            class="spotify"
          >
            <i class="fab fa-spotify pr-2" />
            Spotify
          </a>
          <a
            v-if="props.success && props.youtube"
            :href="props.youtube"
            target="_blank"
            class="youtube"
          >
            <i class="fab fa-youtube mr-2" /> YouTube
          </a>

          <a v-else-if="props.timedOut" class="timeout">
            <i class="fas fa-circle-x mr-2" />
            Timed Out
          </a>
        </div>
      </div>
    </div>
    <div></div>
  </article>
</template>

<style lang="scss" scoped>
.card-wrapper {
  @apply 2xl:w-1/5 xl:w-1/4 lg:w-1/3  w-full p-2 py-4 flex flex-row;
}
.card-content {
  @apply aspect-square w-full h-full rounded-md flex flex-col justify-between bg-cover overflow-hidden;
  &:hover {
    .overlay {
      @apply mb-0;
    }
  }
}
.status-flag {
  @apply h-10 w-10 bg-slate-900/70 backdrop-blur-md rounded-br-lg shadow-md flex items-center justify-center;
}
.overlay {
  @apply p-4 bg-slate-900/70 backdrop-blur-md border-slate-600 shadow-lg text-white w-full flex flex-col rounded-b-md -mb-10 hover:mb-0 transition-all ease-out duration-75;
}
.spotify {
  @apply bg-emerald-400 text-slate-300 hover:text-slate-900 py-1 px-2 rounded font-bold mr-2 bg-opacity-50 hover:bg-opacity-100 text-xs;
}
.youtube {
  @apply bg-red-500 rounded text-slate-300 hover:text-slate-50 py-1 px-2 font-bold bg-opacity-50 hover:bg-opacity-100 text-xs;
}
.timeout {
  @apply border border-red-400 rounded text-slate-300 py-1 px-2 font-bold bg-opacity-50 text-xs select-none;
}
</style>
