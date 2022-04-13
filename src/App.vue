<script setup lang="ts">
/* eslint-disable  @typescript-eslint/no-non-null-assertion */
import { PlaylistTrack } from "@/interfaces/PlaylistTrack";
import { SpotifyPlaylist } from "@/interfaces/SpotifyPlaylist";
import { TRACK_META } from "@/interfaces/TRACK_META";
import Hero from "@/components/Hero.vue";
import axios from "axios";
import { ref } from "vue";
import { checkCache, cacheResults } from "@/firebase";

let playlistURL = ref<string>(
  "https://open.spotify.com/playlist/4uMPojsQJn0d0coC9bp9V1"
);
let tracksAnalyzed = ref<number>(0);
let finalYTURL = ref<string>("");
let finalYTShareURL = ref<string>("");
let loading = ref<boolean>(false);
let spotifyPlaylistRaw = ref<SpotifyPlaylist>();
let spotifyPlaylistTracks = ref<PlaylistTrack[]>([]);
let finalTracks = ref<TRACK_META[]>([]);

const getPlaylistTracks = async (): Promise<void> => {
  reset();
  loading.value = true;
  const data = await axios.get("/.netlify/functions/playlist", {
    params: {
      plst: playlistURL.value.split("/")[4],
    },
  });
  const raw = data.data;
  const playlistItems = data.data.tracks.items.slice(0, 50);
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
      TRACK.youtube = scrapedID;
      finalTracks.value.push(TRACK);
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
  TRACK.youtube = ytID;
  cacheResults(TRACK);
  return ytID;
};

const getFinalURL = async () => {
  const ytIDs = finalTracks.value.map((item) => item.youtube);
  const res = await axios.get(`/.netlify/functions/final?ids=${ytIDs}`);
  finalYTShareURL.value = `https://www.youtube.com/watch_videos?video_ids=${ytIDs}`;
  finalYTURL.value = `https://www.youtube-nocookie.com/embed/videoseries?list=${res.data}&autoplay=1`;
  loading.value = false;
};

const reset = () => {
  spotifyPlaylistTracks.value.length = 0;
  finalTracks.value.length = 0;
  tracksAnalyzed.value = 0;
  finalYTURL.value = "";
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

    <div class="container mx-auto">
      <section class="px-4 grid grid-cols-3 gap-4 pt-4 lg:w-max">
        <div
          class="bg-gray-800 p-6 col-span-1 flex-none shadow-2xl border border-green-800"
        >
          <div class="my-auto">
            <h3 class="text-green-400 mb-4 uppercase font-bold">
              Spotify Playlist URL
            </h3>

            <input
              type="text"
              class="py-3 px-5 bg-gray-900 w-full text-gray-200 border border-green-800 text-sm"
              placeholder="Spotify playlist URL"
              v-model="playlistURL"
              @keydown.enter="getPlaylistTracks()"
            />

            <hr class="mt-4 mb-6 border-green-600" />

            <div class="text-center">
              <h3 class="text-green-400 mb-2 uppercase font-medium">
                Converter Limitations:
              </h3>

              <p class="text-gray-200">
                1) The Spotify playlist must be public
              </p>

              <p class="text-gray-200 mb-4">
                2) Playlists are limited to 50 songs
              </p>
            </div>

            <button
              class="btn btn-primary btn-lg font-gray-400 mt-4 font-bold disabled:opacity-50 w-full"
              :disabled="loading"
              @click="getPlaylistTracks"
            >
              <span v-if="loading" class="mr-2">
                <i class="fa-solid fa-rocket-launch" />
              </span>
              <span v-else class="mr-2">
                <i class="fa-solid fa-rocket" />
              </span>
              Convert Playlist
            </button>

            <a
              v-if="finalYTShareURL"
              :href="finalYTShareURL"
              target="_blank"
              rel="noopener"
              class="btn btn-light-primary btn-lg font-gray-400 mt-20 font-bold w-full"
            >
              <i class="fab fa-youtube pr-2" />
              Open on YouTube
            </a>
          </div>
        </div>

        <section
          v-if="spotifyPlaylistRaw && finalYTURL.length > 0"
          class="bg-gray-950 col-span-2 border border-green-800 shadow-2xl"
        >
          <iframe
            v-if="finalYTURL.length > 1"
            class="playlist-iframe w-full mx-auto"
            style="aspect-ratio: 16 / 9"
            :src="finalYTURL"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            autoplay="true"
          />
        </section>

        <section
          v-if="spotifyPlaylistRaw"
          class="bg-gray-800 p-6 pb-9 col-span-3 border border-green-800 shadow-2xl"
        >
          <section class="p-4 mx-auto">
            <div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <div
                class="flex-row items-center p-5 bg-gray-900 border-green-800 shadow-xl card"
              >
                <div
                  class="flex items-center justify-center w-14 h-14 text-white bg-blue-600 rounded"
                >
                  <i class="fas fa-music text-2xl"></i>
                </div>

                <div class="ml-3">
                  <h2
                    class="mb-2 text-3xl font-bold leading-none text-gray-100 truncate"
                  >
                    {{ spotifyPlaylistTracks.length }}
                  </h2>

                  <p class="leading-none text-gray-300">Playlist tracks</p>
                </div>
              </div>

              <div
                class="flex-row items-center p-5 card bg-gray-900 border-green-800 shadow-xl"
              >
                <div
                  class="flex items-center justify-center w-14 h-14 text-gray-200 bg-green-600 rounded"
                >
                  <i class="fas fa-tv-music text-2xl"></i>
                </div>

                <div class="ml-3">
                  <h2
                    class="mb-1 text-3xl font-bold leading-none text-gray-100 truncate"
                  >
                    {{ finalTracks.length }}
                  </h2>

                  <p class="leading-none text-gray-300">Videos found</p>
                </div>
              </div>

              <div
                class="flex-row items-center p-5 card bg-gray-900 border-green-800 shadow-xl"
              >
                <div
                  class="flex items-center justify-center w-14 h-14 text-gray-200 bg-red-600 rounded"
                >
                  <i class="fas fa-times-hexagon text-2xl"></i>
                </div>

                <div class="ml-3">
                  <h2
                    class="mb-1 font-bold leading-none text-gray-100 truncate text-3xl"
                  >
                    0
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
                  <div class="bg-gray-700 text-white shadow-md rounded my-6">
                    <table class="min-w-max w-full table-auto shadow-xl">
                      <thead>
                        <tr
                          class="bg-gray-900 text-gray-100 uppercase text-sm leading-normal select-none"
                        >
                          <th class="py-3 px-6 text-left">Cover</th>

                          <th class="py-3 px-6 text-left">Track Name</th>

                          <th class="py-3 px-6 text-left">Artist</th>

                          <th class="py-3 px-6 text-left">Album</th>

                          <th class="py-3 px-6 text-center">Spotify</th>

                          <th class="py-3 px-6 text-center">YouTube</th>
                        </tr>
                      </thead>

                      <tbody class="text-white text-sm font-light">
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
                              class="bg-green-400 text-gray-900 py-2 px-4 rounded font-bold"
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
                              class="text-green-300 text-lg w-30 py-1 px-3"
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
        </section>
      </section>
    </div>
  </main>
</template>
