<script setup lang="ts">
/* eslint-disable  @typescript-eslint/no-non-null-assertion */
import axios from "axios";
import { ref, onMounted } from "vue";
import { checkCache, cacheResults, getTotalCached } from "@/firebase";

import { PlaylistTrack } from "@/interfaces/PlaylistTrack";
import { SpotifyPlaylist } from "@/interfaces/SpotifyPlaylist";
import { TRACK_META } from "@/interfaces/TRACK_META";

import HowTo from "./components/HowTo.vue";
import TheFooter from "./components/TheFooter.vue";
import TrackCard from "./components/TrackCard.vue";
import TrackTable from "./components/TrackTable.vue";
import CounterItem from "./components/CounterItem.vue";
import DetailsInfo from "./components/DetailsInfo.vue";
import PlaylistMeta from "./components/PlaylistMeta.vue";
import PlaylistPreview from "./components/PlaylistPreview.vue";
import DetailsRestrictions from "./components/DetailsRestrictions.vue";

let playlistURL = ref<string>(
  "https://open.spotify.com/playlist/4uMPojsQJn0d0coC9bp9V1"
);
let view = ref<string>("grid");
let embedURL = ref<string>("");
let tracksAnalyzed = ref<number>(0);
let loading = ref<boolean>(false);
let plstRaw = ref<SpotifyPlaylist>();
let finalYTShareURL = ref<string>("");
let finalTracks = ref<TRACK_META[]>([]);
let failedTracks = ref<TRACK_META[]>([]);
let plstTracks = ref<PlaylistTrack[]>([]);
let totalCached = ref<string | undefined>(undefined);

onMounted(async (): Promise<void> => {
  const cached = await getTotalCached();
  totalCached.value = new Intl.NumberFormat("en-US").format(cached);
});

const getPlaylistTracks = async (): Promise<void> => {
  reset();
  loading.value = true;

  const { data } = await axios.get("/.netlify/functions/playlist", {
    params: {
      plst: playlistURL.value.split("/")[4],
    },
  });

  const playlistItems = data.tracks.items.slice(0, 49);
  plstRaw.value = data as SpotifyPlaylist;
  plstTracks.value = playlistItems as PlaylistTrack[];

  analyzeTracks();
};

// check if the playlist tracks have been cached before, if not scrape the video ID and cache it, and add track to finalTracks
const analyzeTracks = async (): Promise<void> => {
  for (const item of plstTracks.value) {
    tracksAnalyzed.value++;
    let TRACK: TRACK_META = {
      name: item.track.name,
      artist: item.track.artists![0].name,
      album: item.track.album.name,
      spotify: item.track.external_urls.spotify,
      image: item.track.album.images![0].url,
      youtube: "",
      favorites: 0,
    };

    const cacheHit: TRACK_META | null = await checkCache(TRACK);
    if (!cacheHit) {
      const finalTrack: TRACK_META | null = await scrapeTrack(TRACK);
      if (!finalTrack) return;
      finalTracks.value.push(finalTrack);
    } else {
      finalTracks.value.push(cacheHit);
    }
    // if we've processed all tracks
    if (plstTracks.value.length === tracksAnalyzed.value) {
      getFinalURL();
    }
    // only get the final url if all tracks have videos
    if (plstTracks.value.length === finalTracks.value.length) {
      getFinalURL();
    }
  }
};

const scrapeTrack = async (TRACK: TRACK_META): Promise<TRACK_META | null> => {
  const endpoint = "/.netlify/functions/scrape?query=";
  const query = `${TRACK.artist} - ${TRACK.name}`
    .replace("&", "+")
    .replace(" ", "+");
  return axios
    .get(`${endpoint}${query}`)
    .then((res) => {
      if (res.data.length == 0) throw new Error();
      TRACK.youtube = res.data;
      cacheResults(TRACK);
      return TRACK;
    })
    .catch(() => {
      failedTracks.value.push(TRACK);
      return null;
    })
    .finally(() => {
      loading.value = false;
    });
};

const getFinalURL = async (): Promise<void> => {
  const ytIDs = finalTracks.value.map((item) => item.youtube);
  axios
    .get(`/.netlify/functions/final?ids=${ytIDs}`)
    .then((data) => {
      if (!data.data.startsWith("TL")) return;
      finalYTShareURL.value = `https://www.youtube.com/playlist?list=${data.data}`;
      embedURL.value = `https://www.youtube.com/embed/videoseries?list=${data.data}`;
      // embedURL.value = `https://www.youtube.com/embed/videoseries?list=${data.data}&autoplay=1`;
    })
    .catch((error) => {
      console.log(error);
    })
    .finally(() => {
      loading.value = false;
    });
};

const buildYouTubeURL = (spotifyURL: string): string => {
  const result = finalTracks.value.find((item) => item.spotify === spotifyURL);
  return `https://www.youtube.com/watch?v=${result?.youtube}`;
};

const hasTimedOut = (spotifyURL: string): boolean => {
  const result = failedTracks.value.find((item) => item.spotify === spotifyURL);
  return result ? true : false;
};

const wasScraped = (spotifyURL: string): boolean => {
  const result = finalTracks.value.some((e) => e.spotify === spotifyURL);
  return result ? true : false;
};

const reset = (): void => {
  plstTracks.value.length = 0;
  finalTracks.value.length = 0;
  failedTracks.value.length = 0;
  embedURL.value = "";
};
</script>

<template>
  <main class="app bg-gray-900 min-h-screen pb-24">
    <section
      class="px-4 py-16 border-b border-emerald-800 bg-gradient-to-br from-emerald-900 to-gray-950 text-center"
    >
      <h1 class="text-4xl text-emerald-50 font-bold">Watch My Spotify</h1>
      <p class="text-emerald-50 max-w-2xl mx-auto mt-5">
        Use this tool to convert a Spotify playlist to a YouTube playlist.
        <br />To date, this tool has found and cached videos for
        <span v-if="totalCached">{{ totalCached || "--" }} </span> songs.
      </p>
      <p class="text-emerald-50 max-w-2xl mx-auto mt-5 text-xs">
        Made with 💚 and ☕ by
        <a href="https://emk.dev" target="_blank">Eric Kelley</a>
      </p>
    </section>
    <div class="container mx-auto px-4">
      <div class="flex flex-col">
        <div class="p-6">
          <div class="bg-gray-950 border border-emerald-800 shadow-2xl p-6">
            <div class="my-auto">
              <h3
                class="text-emerald-400 mb-4 uppercase font-bold text-xl tracking-wide"
              >
                Spotify Public Playlist URL:
              </h3>
              <div class="flex flex-row items-center">
                <input
                  type="text"
                  class="py-3 px-5 bg-gray-900 w-full text-gray-200 border border-emerald-700 rounded-none text-base"
                  placeholder="Spotify playlist URL"
                  v-model="playlistURL"
                  @keydown.enter="getPlaylistTracks()"
                />

                <button
                  class="btn btn-primary rounded-none border border-emerald-700 btn-lg font-gray-400 font-bold disabled:opacity-50 w-72"
                  :disabled="loading"
                  @click="getPlaylistTracks"
                >
                  <span v-if="loading" class="mr-2">
                    <i class="fa-solid fa-cog fa-spin" />
                  </span>
                  <span v-else class="mr-2">
                    <i class="fa-solid fa-rocket-launch" />
                  </span>
                  {{ loading ? "Processing..." : "Convert Playlist" }}
                </button>
              </div>

              <hr class="mt-4 mb-6 border-emerald-600" />
              <div class="flex flex-row">
                <how-to />
                <div class="text-base tracking-wide p-4 w-full">
                  <details-restrictions />
                  <details-info />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section v-if="plstRaw" class="p-6">
        <div class="bg-gray-950 border border-emerald-800 shadow-2xl p-2">
          <section class="p-6 mx-auto">
            <!-- playlist information -->
            <playlist-meta :plstRaw="plstRaw" />

            <!-- playlist counters -->
            <section
              id="counters"
              class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              <counter-item
                :number="plstTracks.length"
                title="Playlist Tracks"
                icon="fa-music"
                color="bg-blue-600"
              />
              <counter-item
                :number="finalTracks.length"
                title="Videos Found"
                icon="fa-tv-music"
                color="bg-green-600"
              />
              <counter-item
                :number="failedTracks.length"
                title="Failed to scrape (timeout)"
                icon="fa-hourglass-end"
                color="bg-red-600"
              />
            </section>

            <!-- preview -->
            <section v-if="plstRaw && embedURL.length > 0" class="w-full p-6">
              <playlist-preview
                :embed-URL="embedURL"
                :yt-share-URL="finalYTShareURL"
              />
            </section>

            <!-- playlist tracks navbar -->
            <section class="flex flex-row items-center justify-between py-8">
              <h2 class="text-emerald-400 font-bold text-2xl">
                Playlist Tracks:
              </h2>
              <div class="text-sm">
                <button
                  class="text-emerald-50 py-1 px-3 rounded-l-full"
                  :class="view == 'grid' ? 'bg-emerald-600' : 'bg-slate-700'"
                  @click="view = 'grid'"
                >
                  <i class="fa-solid fa-grid"></i>
                </button>
                <button
                  class="text-emerald-50 py-1 px-3 rounded-r-full"
                  :class="view == 'table' ? 'bg-emerald-600' : 'bg-slate-700'"
                  @click="view = 'table'"
                >
                  <i class="fa-solid fa-table"></i>
                </button>
              </div>
            </section>

            <!-- grid -->
            <section
              v-if="view == 'grid'"
              id="grid-view"
              class="flex flex-row flex-wrap"
            >
              <track-card
                v-for="(track, index) in plstTracks"
                :key="index"
                :track="track"
                :timed-out="hasTimedOut(track.track.external_urls.spotify)"
                :success="wasScraped(track.track.external_urls.spotify)"
                :youtube="buildYouTubeURL(track.track.external_urls.spotify)"
              />
            </section>

            <!-- table -->
            <section v-if="view == 'table'" class="overflow-x-auto">
              <div class="text-emerald-50 shadow-md rounded my-6">
                <track-table
                  :tracks="plstTracks"
                  :final-tracks="finalTracks"
                  :failed-tracks="failedTracks"
                />
              </div>
            </section>
          </section>
        </div>
      </section>
    </div>
  </main>
  <TheFooter />
</template>
<style></style>
