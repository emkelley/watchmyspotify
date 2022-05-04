<script setup lang="ts">
/* eslint-disable  @typescript-eslint/no-non-null-assertion */
import { PlaylistTrack } from "@/interfaces/PlaylistTrack";
import { SpotifyPlaylist } from "@/interfaces/SpotifyPlaylist";
import { TRACK_META } from "@/interfaces/TRACK_META";
import Hero from "@/components/Hero.vue";
import axios from "axios";
import { ref } from "vue";
import { checkCache, cacheResults } from "@/firebase";
import TheFooter from "./components/TheFooter.vue";

let playlistURL = ref<string>(
  "https://open.spotify.com/playlist/2e5zLODjQB04wovyMU6ZQa"
);
let tracksAnalyzed = ref<number>(0);
let embedURL = ref<string>(
  "https://www.youtube.com/embed/videoseries?list=TLPPMjcwNDIwMjKzoSF7OkTwuw&autoplay=1"
);
let finalYTShareURL = ref<string>("");
let loading = ref<boolean>(false);
let spotifyPlaylistRaw = ref<SpotifyPlaylist>();
let spotifyPlaylistTracks = ref<PlaylistTrack[]>([]);
let finalTracks = ref<TRACK_META[]>([]);
let failedTracks = ref<TRACK_META[]>([]);
const getPlaylistTracks = async (): Promise<void> => {
  reset();
  loading.value = true;
  const data = await axios.get("/.netlify/functions/playlist", {
    params: {
      plst: playlistURL.value.split("/")[4],
    },
  });
  const raw = data.data;
  const playlistItems = data.data.tracks.items.slice(0, 49);
  spotifyPlaylistRaw.value = raw as SpotifyPlaylist;
  spotifyPlaylistTracks.value = playlistItems as PlaylistTrack[];
  analyzeTracks();
};

const analyzeTracks = async () => {
  for (const item of spotifyPlaylistTracks.value) {
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
    if (cacheHit) finalTracks.value.push(cacheHit);
    else {
      const scrapedID: string = await searchYouTubePuppeteer(TRACK);
      if (scrapedID.length == 0) failedTracks.value.push(TRACK);
      else {
        TRACK.youtube = scrapedID;
        finalTracks.value.push(TRACK);
      }
    }

    if (spotifyPlaylistTracks.value.length === finalTracks.value.length) {
      getFinalURL();
    }
  }
};

const searchYouTubePuppeteer = async (TRACK: TRACK_META) => {
  const query = `${TRACK.artist} - ${TRACK.name}`.replace(" ", "+");
  const res = await axios.get(`/.netlify/functions/scrape?query=${query}`);
  const ytID: string = res.data;
  console.log(ytID);
  TRACK.youtube = ytID;
  if (ytID.length > 0) cacheResults(TRACK);
  else {
    failedTracks.value.push(TRACK);
    console.log(`${TRACK.name} - ${TRACK.artist} failed to scrape`);
  }
  return ytID;
};

const getFinalURL = async () => {
  const ytIDs = finalTracks.value
    .map((item) => item.youtube)
    .filter((item) => item);

  const res = await axios.get(`/.netlify/functions/final?ids=${ytIDs}`);
  if (res.data.startsWith("TL")) {
    finalYTShareURL.value = `https://www.youtube.com/playlist?list=${res.data}`;
    embedURL.value = `https://www.youtube.com/embed/videoseries?list=${res.data}&autoplay=1`;
  }
  loading.value = false;
};

const reset = () => {
  spotifyPlaylistTracks.value.length = 0;
  finalTracks.value.length = 0;
  tracksAnalyzed.value = 0;
  embedURL.value = "";
};

const makeYouTubeURLWithID = (spotifyURL: string) => {
  const result = finalTracks.value.find((item) => item.spotify === spotifyURL);
  return `https://www.youtube.com/watch?v=${result!.youtube}`;
};
</script>

<template>
  <main class="app bg-gray-900 min-h-screen pb-24">
    <Hero
      title="Watch My Spotify"
      subtext="Use this tool to convert a Spotify playlist to a YouTube playlist. Playlist conversions are currently limited to 50 tracks."
    />

    <div class="container mx-auto px-4">
      <div class="flex flex-col">
        <section
          v-if="spotifyPlaylistRaw && embedURL.length > 0"
          class="w-full p-6"
        >
          <div class="bg-gray-950 border border-emerald-800 shadow-2xl">
            <iframe
              class="playlist-iframe w-full aspect-video"
              :src="embedURL"
              title="YouTube video player"
              frameborder="0"
              allowfullscreen
              allow="autoplay"
            />
            <div class="px-8">
              <a
                v-if="finalYTShareURL"
                :href="finalYTShareURL"
                target="_blank"
                rel="noopener"
                class="btn btn-danger btn-lg font-gray-400 my-8 font-bold w-full"
              >
                <i class="fab fa-youtube pr-2" />
                Open on YouTube
              </a>
            </div>
          </div>
        </section>
        <div class="p-6">
          <div class="bg-gray-950 border border-emerald-800 shadow-2xl p-6">
            <div class="my-auto">
              <h3 class="text-emerald-400 mb-4 uppercase font-bold">
                Spotify Playlist URL
              </h3>

              <input
                type="text"
                class="py-3 px-5 bg-gray-900 w-full text-gray-200 border border-emerald-800 text-sm"
                placeholder="Spotify playlist URL"
                v-model="playlistURL"
                @keydown.enter="getPlaylistTracks()"
              />

              <hr class="mt-4 mb-6 border-emerald-600" />

              <div class="text-sm">
                <h3 class="text-emerald-400 mb-2 uppercase font-medium">
                  Things to keep in mind:
                </h3>

                <p class="text-emerald-50 py-1">
                  1) The Spotify playlist must be public
                </p>

                <p class="text-emerald-50 py-1">
                  2) Playlists are limited to 49 songs (API limits)
                </p>

                <p class="text-emerald-50 py-1">
                  3) If you get "This video is unavailable." errors when the
                  embed opens, try opening the playlist with the button below.
                </p>

                <p class="text-emerald-50 py-1 mb-4">
                  4) Lastly, have some patience. For each song the backend is
                  opening and searching YouTube and extracting video IDs. This
                  can take a while - up to 10 seconds per song before timing
                  out. If songs time out when scraping, run the converter again
                  on the playlist to pick up those failed songs.
                </p>
              </div>

              <button
                class="btn btn-primary btn-lg font-gray-400 mt-4 font-bold disabled:opacity-50 w-full"
                :disabled="loading"
                @click="getPlaylistTracks"
              >
                <span v-if="loading" class="mr-2">
                  <i class="fa-solid fa-cog fa-spin" />
                </span>
                <span v-else class="mr-2">
                  <i class="fa-solid fa-rocket" />
                </span>
                {{ loading ? "Processing..." : "Convert Playlist" }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <section v-if="spotifyPlaylistRaw" class="p-6">
        <div class="bg-gray-950 border border-emerald-800 shadow-2xl">
          <section class="p-6 mx-auto">
            <div class="text-emerald-50 text-3xl pt-4 pb-8 font-bold">
              <a
                :href="spotifyPlaylistRaw.external_urls.spotify"
                target="_blank"
                rel="noopener"
                class="text-4xl mr-6"
              >
                {{ spotifyPlaylistRaw.name }}
              </a>

              <a
                :href="spotifyPlaylistRaw.owner.external_urls.spotify"
                target="_blank"
                rel="noopener"
                class="text-sm uppercase font-normal"
              >
                Created by {{ spotifyPlaylistRaw.owner.display_name }}
              </a>
            </div>
            <div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <div
                class="flex-row items-center p-5 bg-gray-900 border-emerald-800 shadow-xl card"
              >
                <div
                  class="flex items-center justify-center w-14 h-14 text-emerald-50 bg-blue-600 rounded"
                >
                  <i class="fas fa-music text-2xl"></i>
                </div>

                <div class="ml-3">
                  <h2
                    class="mb-2 text-3xl font-bold leading-none text-emerald-50 truncate"
                  >
                    {{ spotifyPlaylistTracks.length }}
                  </h2>

                  <p class="leading-none text-gray-300">Playlist tracks</p>
                </div>
              </div>

              <div
                class="flex-row items-center p-5 card bg-gray-900 border-emerald-800 shadow-xl"
              >
                <div
                  class="flex items-center justify-center w-14 h-14 text-gray-200 bg-emerald-600 rounded"
                >
                  <i class="fas fa-tv-music text-2xl"></i>
                </div>

                <div class="ml-3">
                  <h2
                    class="mb-1 text-3xl font-bold leading-none text-emerald-50 truncate"
                  >
                    {{ finalTracks.length }}
                  </h2>

                  <p class="leading-none text-gray-300">Videos found</p>
                </div>
              </div>

              <div
                class="flex-row items-center p-5 card bg-gray-900 border-emerald-800 shadow-xl"
              >
                <div
                  class="flex items-center justify-center w-14 h-14 text-gray-200 bg-red-600 rounded"
                >
                  <i class="fas fa-times-hexagon text-2xl"></i>
                </div>

                <div class="ml-3">
                  <h2
                    class="mb-1 font-bold leading-none text-emerald-50 truncate text-3xl"
                  >
                    {{ failedTracks.length }}
                  </h2>

                  <p class="leading-none text-gray-300">Failed to scrape</p>
                </div>
              </div>
            </div>

            <!-- table -->

            <div class="overflow-x-auto">
              <div
                class="w-full flex items-center justify-center font-sans overflow-hidden"
              >
                <div class="w-full">
                  <div
                    class="bg-gray-700 text-emerald-50 shadow-md rounded my-6"
                  >
                    <table class="min-w-max w-full table-auto shadow-xl">
                      <thead>
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
                          v-for="(track, index) in spotifyPlaylistTracks"
                          :key="index"
                          class="border border-gray-950 hover:bg-gray-800"
                        >
                          <td class="py-3 px-6 text-left whitespace-nowrap">
                            <div class="flex items-center">
                              <img
                                v-if="track.track.album.images"
                                class="rounded shadow-md select-none"
                                :src="track.track.album.images[0].url"
                                width="100"
                              />
                            </div>
                          </td>

                          <td class="py-3 px-6 text-left whitespace-nowrap">
                            <div class="flex items-center">
                              <span
                                class="font-medium overflow-hidden truncate w-64 text-lg"
                              >
                                {{ track.track.name }}
                              </span>
                            </div>
                          </td>

                          <td class="py-3 px-6 text-left">
                            <div class="flex items-center">
                              <span
                                v-if="track.track.artists"
                                class="overflow-hidden truncate w-32 text-lg"
                              >
                                {{ track.track.artists[0].name }}
                              </span>
                            </div>
                          </td>

                          <td
                            class="py-3 px-6 text-left max-w-s whitespace-nowrap"
                          >
                            <div class="flex items-center">
                              <div
                                class="font-medium overflow-hidden truncate w-56 text-lg"
                              >
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
                              <i class="fab fa-spotify pr-2"></i>
                              Listen on Spotify
                            </a>
                          </td>

                          <td class="py-3 px-6 text-center">
                            <a
                              v-if="
                                finalTracks.some(
                                  (e) =>
                                    e.spotify ===
                                    track.track.external_urls.spotify
                                )
                              "
                              :href="
                                makeYouTubeURLWithID(
                                  track.track.external_urls.spotify
                                )
                              "
                              target="_blank"
                              class="bg-red-500 rounded text-white py-2 px-4 font-bold"
                            >
                              <i class="fab fa-youtube pr-2"></i>
                              Watch on YouTube
                            </a>

                            <p
                              v-else
                              class="text-emerald-300 text-lg w-30 py-1 px-3"
                            >
                              <i class="fas fa-compact-disc fa-spin"></i>
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  </main>
  <TheFooter />
</template>
