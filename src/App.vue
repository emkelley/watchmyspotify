<script setup lang="ts">
/* eslint-disable  @typescript-eslint/no-non-null-assertion */
import { ref } from "vue";
import axios from "axios";
import TheFooter from "./components/TheFooter.vue";
import { checkCache, cacheResults } from "@/firebase";
import { PlaylistTrack } from "@/interfaces/PlaylistTrack";
import { SpotifyPlaylist } from "@/interfaces/SpotifyPlaylist";
import { TRACK_META } from "@/interfaces/TRACK_META";

let playlistURL = ref<string>(
  "https://open.spotify.com/playlist/4uMPojsQJn0d0coC9bp9V1"
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
let view = ref<string>("grid");

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

// check if the playlist tracks have been cached before, if not scrape the video ID and cache it, and add track to finalTracks
const analyzeTracks = async (): Promise<void> => {
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
    if (cacheHit) {
      finalTracks.value.push(cacheHit);
    } else {
      const finalTrack: TRACK_META | null = await scrapeTrack(TRACK);
      if (finalTrack) finalTracks.value.push(finalTrack);
    }
    // only get the final url if all tracks have videos
    if (spotifyPlaylistTracks.value.length === finalTracks.value.length) {
      getFinalURL();
    }
  }
};

const scrapeTrack = async (TRACK: TRACK_META): Promise<TRACK_META | null> => {
  const endpoint = "/.netlify/functions/scrape?query=";
  const query = `${TRACK.artist} - ${TRACK.name}`.replace(" ", "+");
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
      if (data.data.startsWith("TL")) {
        finalYTShareURL.value = `https://www.youtube.com/playlist?list=${data.data}`;
        embedURL.value = `https://www.youtube.com/embed/videoseries?list=${data.data}&autoplay=1`;
      }
    })
    .catch((error) => {
      console.log(error);
    })
    .finally(() => {
      loading.value = false;
    });
};

const makeYouTubeURLWithID = (spotifyURL: string): string => {
  const result = finalTracks.value.find((item) => item.spotify === spotifyURL);
  return `https://www.youtube.com/watch?v=${result!.youtube}`;
};

const hasTimedOut = (spotifyURL: string): string | null => {
  const result = failedTracks.value.find((item) => item.spotify === spotifyURL);
  return result ? "Timed out" : null;
};

const reset = (): void => {
  spotifyPlaylistTracks.value.length = 0;
  finalTracks.value.length = 0;
  failedTracks.value.length = 0;
  tracksAnalyzed.value = 0;
  embedURL.value = "";
};
</script>

<template>
  <main class="app bg-gray-900 min-h-screen pb-24">
    <section
      class="px-4 py-24 border-b border-emerald-800 bg-gradient-to-br from-emerald-900 to-gray-950 text-center"
    >
      <h1 class="text-4xl text-emerald-50 font-bold">Watch My Spotify</h1>
      <p class="text-emerald-50 max-w-2xl mx-auto mt-5">
        Use this tool to convert a Spotify playlist to a YouTube playlist.
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
                    <i class="fa-solid fa-rocket" />
                  </span>
                  {{ loading ? "Processing..." : "Convert Playlist" }}
                </button>
              </div>

              <hr class="mt-4 mb-6 border-emerald-600" />
              <div class="flex flex-row">
                <div class="text-base tracking-wide p-4 w-full">
                  <p class="text-emerald-50 py-2">
                    <i class="fas fa-check-circle mr-2 text-emerald-500"></i>
                    Copy a
                    <strong class="text-emerald-200">Public</strong> Spotify
                    playlist link from the
                    <a
                      rel="noopener"
                      target="_blank"
                      href="https://support.spotify.com/us/article/share-from-spotify/"
                      >Share Menu</a
                    >.
                  </p>
                  <p class="text-emerald-50 py-2">
                    <i class="fas fa-check-circle mr-2 text-emerald-500"></i>
                    Paste the link into the above field and click the Convert
                    Playlist button to begin the conversion process.
                  </p>
                  <p class="text-emerald-50 py-2">
                    <i class="fas fa-check-circle mr-2 text-emerald-500"></i>
                    Once all tracks have been processed and videos have been
                    found, the playlist will automatically appear. Use the
                    button below the embed to view the playlist on YouTube.
                  </p>
                </div>
                <div class="text-base tracking-wide p-4 w-full">
                  <details>
                    <summary
                      class="text-emerald-400 mb-2 uppercase font-medium cursor-pointer"
                    >
                      Restrictions:
                    </summary>
                    <p class="text-emerald-50 py-1">
                      - The Spotify playlist must be public
                    </p>

                    <p class="text-emerald-50 py-1 mb-6">
                      - Playlists are limited to 49 songs (API limits)
                    </p>
                  </details>
                  <details>
                    <summary
                      class="text-emerald-400 mb-2 uppercase font-medium cursor-pointer"
                    >
                      Bugs & Troubleshooting:
                    </summary>

                    <details class="pl-4">
                      <summary
                        class="text-emerald-200 mb-2 text-sm cursor-pointer"
                      >
                        YouTube Embed - "This video is unavailable."
                      </summary>
                      <p class="text-emerald-50 py-1 pl-4">
                        errors when the embed opens, try opening the playlist
                        with the button below the embed.
                      </p>
                    </details>

                    <details class="pl-4">
                      <summary
                        class="text-emerald-200 mb-2 text-sm cursor-pointer"
                      >
                        Songs failed to scrape or timed out
                      </summary>
                      <p class="text-emerald-50 py-1 pl-4">
                        If songs get stuck and time out when scraping, run the
                        conversion again on the playlist to pick up those failed
                        songs.
                      </p>
                    </details>

                    <details class="pl-4">
                      <summary
                        class="text-emerald-200 mb-2 text-sm cursor-pointer"
                      >
                        The conversion is taking forever to complete
                      </summary>
                      <p class="text-emerald-50 py-1 pl-4">
                        Have some patience; For each song, the backend is
                        opening a chrome instance, searching YouTube, and then
                        extracting video IDs. This can take a while - up to 10
                        seconds per song before timing out.
                      </p>
                    </details>

                    <details class="pl-4">
                      <summary
                        class="text-emerald-200 mb-2 text-sm cursor-pointer"
                      >
                        How was this tool built?
                      </summary>
                      <p class="text-emerald-50 py-1 pl-4">
                        If you're interested in the technical side of this
                        project, you can read more about how I made it
                        <a class="text-emerald-200" href="#"
                          >in this blog post</a
                        >
                        (coming soon).
                      </p>
                    </details>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section v-if="spotifyPlaylistRaw" class="p-6">
        <div class="bg-gray-950 border border-emerald-800 shadow-2xl p-2">
          <section class="p-6 mx-auto">
            <div
              class="flex flex-col text-emerald-50 text-3xl pt-4 pb-8 font-bold text-center"
            >
              <a
                :href="spotifyPlaylistRaw.external_urls.spotify"
                target="_blank"
                rel="noopener"
                class="text-4xl mr-6"
              >
                <span class="text-emerald-200">
                  {{ spotifyPlaylistRaw.name }}
                </span>
              </a>
              <p v-if="spotifyPlaylistRaw.description" class="text-base my-4">
                {{ spotifyPlaylistRaw.description }}
              </p>
              <a
                :href="spotifyPlaylistRaw.owner.external_urls.spotify"
                target="_blank"
                rel="noopener"
                class="text-sm uppercase font-normal"
              >
                By
                <span class="text-emerald-200">
                  {{ spotifyPlaylistRaw.owner.display_name }}
                </span>
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

                  <p class="leading-none text-gray-300">Playlist Tracks</p>
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

                  <p class="leading-none text-gray-300">Videos Found</p>
                </div>
              </div>

              <div
                class="flex-row items-center p-5 card bg-gray-900 border-emerald-800 shadow-xl"
              >
                <div
                  class="flex items-center justify-center w-14 h-14 text-gray-200 bg-red-600 rounded"
                >
                  <i class="fas fa-hourglass-end text-2xl"></i>
                </div>

                <div class="ml-3">
                  <h2
                    class="mb-1 font-bold leading-none text-emerald-50 truncate text-3xl"
                  >
                    {{ failedTracks.length }}
                  </h2>

                  <p class="leading-none text-gray-300">
                    Failed to scrape (timeout)
                  </p>
                </div>
              </div>
            </div>

            <!-- preview -->
            <section
              v-if="spotifyPlaylistRaw && embedURL.length > 0"
              class="w-full p-6"
            >
              <iframe
                class="playlist-iframe w-full aspect-video"
                :src="embedURL"
                title="YouTube video player"
                frameborder="0"
                allowfullscreen
                allow="autoplay"
              />
              <div class="px-8 flex flex-row justify-center">
                <a
                  v-if="finalYTShareURL"
                  :href="finalYTShareURL"
                  target="_blank"
                  rel="noopener"
                  class="btn btn-danger my-8 font-bold rounded-none"
                >
                  <i class="fab fa-youtube pr-2" />
                  Open Playlist on YouTube
                  <i class="fas fa-link pl-2" />
                </a>
              </div>
            </section>
            <div class="flex flex-row items-center justify-between py-8">
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
            </div>
            <!-- grid -->
            <section
              v-if="view == 'grid'"
              id="grid-view"
              class="flex flex-row flex-wrap"
            >
              <article
                v-for="(track, index) in spotifyPlaylistTracks"
                :key="index"
                class="2xl:w-1/5 xl:w-1/3 lg:w-1/2 w-full p-2 py-4 flex flex-row blur-50"
              >
                <div
                  class="aspect-square w-full h-full rounded-md flex items-end bg-cover"
                  :style="{
                  backgroundImage:
                    'url(' + track.track.album.images![0].url + ')',
                }"
                >
                  <div
                    class="p-4 bg-slate-900/70 backdrop-blur-md border-slate-600 shadow-lg text-white w-full flex flex-col rounded-b-md"
                  >
                    <p class="mb-1 font-bold truncate">
                      {{ track.track.name }}
                    </p>
                    <p class="mb-2 font-light truncate">
                      {{ track.track.artists![0].name }}
                    </p>
                    <div>
                      <a
                        :href="track.track.uri"
                        target="_blank"
                        class="bg-emerald-400 text-slate-300 hover:text-slate-900 py-1 px-2 rounded font-bold mr-2 bg-opacity-50 hover:bg-opacity-100 text-xs"
                      >
                        <i class="fab fa-spotify pr-2"></i>
                        Spotify
                      </a>
                      <a
                        v-if="
                          finalTracks.some(
                            (e) =>
                              e.spotify === track.track.external_urls.spotify
                          )
                        "
                        :href="
                          makeYouTubeURLWithID(
                            track.track.external_urls.spotify
                          )
                        "
                        target="_blank"
                        class="bg-red-500 rounded text-slate-300 hover:text-slate-50 py-1 px-2 font-bold bg-opacity-50 hover:bg-opacity-100 text-xs"
                      >
                        <i class="fab fa-youtube mr-2"></i> YouTube
                      </a>

                      <a
                        v-else-if="
                          hasTimedOut(track.track.external_urls.spotify)
                        "
                        class="border border-red-400 rounded text-slate-300 hover:text-slate-50 py-1 px-2 font-bold bg-opacity-50 hover:bg-opacity-100 text-xs"
                      >
                        <i class="fas fa-circle-x mr-2" />
                        Timed Out
                      </a>
                      <a
                        v-else
                        class="bg-transparent rounded text-slate-300 hover:text-slate-50 py-1 px-2 font-bold bg-opacity-50 hover:bg-opacity-100 text-xs"
                      >
                        <i class="fas fa-compact-disc fa-spin mr-2" />
                        Scraping...
                      </a>
                    </div>
                  </div>
                </div>
                <div></div>
              </article>
            </section>
            <!-- table -->
            <div v-if="view == 'table'" class="overflow-x-auto">
              <div class="text-emerald-50 shadow-md rounded my-6">
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
                      v-for="(track, index) in spotifyPlaylistTracks"
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
                          v-if="
                            finalTracks.some(
                              (e) =>
                                e.spotify === track.track.external_urls.spotify
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
                          <i class="fab fa-youtube"></i>
                        </a>

                        <p
                          v-else-if="
                            hasTimedOut(track.track.external_urls.spotify)
                          "
                          class="text-red-300 text-lg w-30 py-1 px-3"
                        >
                          <i class="fas fa-hourglass-end mr-2" />
                          Timed Out
                        </p>
                        <p
                          v-else
                          class="text-emerald-300 text-lg w-30 py-1 px-3"
                        >
                          <i class="fas fa-compact-disc fa-spin mr-2" />
                          Scraping...
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  </main>
  <TheFooter />
</template>
<style></style>
