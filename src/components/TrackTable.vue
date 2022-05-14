<script setup lang="ts">
import { PlaylistTrack } from "@/interfaces/PlaylistTrack";
import { TRACK_META } from "@/interfaces/TRACK_META";

const props = defineProps<{
  tracks: PlaylistTrack[];
  finalTracks: TRACK_META[];
  failedTracks: TRACK_META[];
}>();

const buildYouTubeURL = (spotifyURL: string): string => {
  const result = props.finalTracks.find((item) => item.spotify === spotifyURL);
  return `https://www.youtube.com/watch?v=${result?.youtube}`;
};

const hasTimedOut = (spotifyURL: string): boolean => {
  const result = props.failedTracks.find((item) => item.spotify === spotifyURL);
  return result ? true : false;
};

const wasScraped = (spotifyURL: string): boolean => {
  const result = props.finalTracks.some((e) => e.spotify === spotifyURL);
  return result ? true : false;
};
</script>

<template>
  <table class="w-full table-auto shadow-xl bg-gray-700 rounded">
    <thead class="rounded-t">
      <tr
        class="bg-gray-900 text-emerald-50 uppercase text-sm leading-normal select-none"
      >
        <th class="py-3 px-6 text-left">Cover</th>
        <th class="py-3 px-6 text-left">Track Name</th>
        <th class="py-3 px-6 text-left">Artist</th>
        <th class="py-3 px-6 text-left">Album</th>
        <th class="py-3 px-6 text-center">Spotify</th>
        <th class="py-3 px-6 text-center">YouTube</th>
      </tr>
    </thead>

    <tbody class="text-emerald-50 text-sm font-light">
      <tr
        v-for="(track, index) in props.tracks"
        :key="index"
        class="border border-gray-950 hover:bg-gray-800"
      >
        <td class="py-3 px-6 text-left whitespace-nowrap">
          <div class="flex items-center">
            <img
              v-if="track.track.album.images"
              class="rounded shadow-md select-none w-14"
              :src="track.track.album.images[0].url"
            />
          </div>
        </td>

        <td class="py-3 px-6 text-left whitespace-nowrap">
          <div class="flex items-center">
            <span class="overflow-hidden truncate text-base">
              {{ track.track.name }}
            </span>
          </div>
        </td>

        <td class="py-3 px-6 text-left">
          <div class="flex items-center">
            <span
              v-if="track.track.artists"
              class="overflow-hidden truncate text-base"
            >
              {{ track.track.artists[0].name }}
            </span>
          </div>
        </td>

        <td class="py-3 px-6 text-left max-w-s whitespace-nowrap">
          <div class="flex items-center">
            <div class="overflow-hidden truncate text-base">
              {{ track.track.album.name }}
            </div>
          </div>
        </td>

        <td class="py-3 px-6 text-center">
          <a
            :href="track.track.uri"
            target="_blank"
            class="bg-emerald-400 text-gray-900 py-2 px-4 rounded font-bold"
          >
            <i class="fab fa-spotify"></i>
          </a>
        </td>

        <td class="py-3 px-6 text-center">
          <a
            v-if="wasScraped(track.track.external_urls.spotify)"
            :href="buildYouTubeURL(track.track.external_urls.spotify)"
            target="_blank"
            class="bg-red-500 rounded text-white py-2 px-4 font-bold"
          >
            <i class="fab fa-youtube"></i>
          </a>

          <p
            v-else-if="hasTimedOut(track.track.external_urls.spotify)"
            class="text-red-300 text-lg w-30 py-1 px-3"
          >
            <i class="fas fa-hourglass-end mr-2" />
            Timed Out
          </p>
          <p v-else class="text-emerald-300 text-lg w-30 py-1 px-3">
            <i class="fas fa-compact-disc fa-spin mr-2" />
            Scraping...
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style lang="scss" scoped></style>
