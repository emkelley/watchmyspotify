<script setup lang="ts">
import { ref } from "vue";
import axios from "axios";
import { checkCache, cacheResults } from "./firebase";
import { PlaylistTrack } from "./types/PlaylistTrack";
import { SpotifyPlaylist } from "./types/SpotifyPlaylist";
// Demo Playlist
// let playlistURL = ref<string>(
//   "https://open.spotify.com/playlist/4uMPojsQJn0d0coC9bp9V1"
// );
let playlistURL = ref<string>(
  "https://open.spotify.com/playlist/4uMPojsQJn0d0coC9bp9V1"
);
let playlistRaw = ref<SpotifyPlaylist>();
let playlistTracks = ref<Array<PlaylistTrack>>([]);
let ytIDArray = ref<string[]>([]);
let queryCount = ref<number>(0);
let finalYTURL = ref<string>("");
let loading = ref<boolean>(false);

const getPlaylistTracks = async () => {
  reset();

  const playlistID = playlistURL.value.split("/")[4];
  const data = await axios.get("/api/playlist", {
    params: {
      plst: playlistID,
    },
  });
  const raw = data.data;
  const playlistItems = data.data.tracks.items;
  playlistRaw.value = raw as SpotifyPlaylist;
  playlistTracks.value = playlistItems as Array<PlaylistTrack>;

  analyzeTracks();
  console.log(`🟩 Found ${playlistItems.length} tracks`);
};

const analyzeTracks = async () => {
  for (const item of playlistTracks.value) {
    queryCount.value++;
    const TRACK_NAME = item.track.name;
    // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
    const TRACK_ARTIST = item.track.artists![0].name;
    const TRACK_URL = item.track.external_urls.spotify;
    const QUERY = `${TRACK_NAME} - ${TRACK_ARTIST}`;

    console.log(
      `🔎 Analyzing song --- ${queryCount.value + 1}/${
        playlistTracks.value.length
      } --- ${TRACK_NAME}`
    );

    const cacheHit = await checkCache(TRACK_URL);

    if (cacheHit) {
      console.log(`☑️ Cache hit for song: ${TRACK_NAME}`);
      ytIDArray.value.push(cacheHit);
    } else {
      const scrapedID: string = await searchYouTubePuppeteer(
        TRACK_NAME,
        QUERY,
        TRACK_URL
      );
      console.log(`🪒 Scraped song: ${TRACK_NAME} | Video ID: ${scrapedID}`);
      ytIDArray.value.push(scrapedID);
    }

    if (playlistTracks.value.length === ytIDArray.value.length) getFinalURL();
  }
};

const searchYouTubePuppeteer = async (
  TRACK_NAME: string,
  QUERY: string,
  TRACK_URL: string
) => {
  const res = await axios.get(`/api/scrape?query=${QUERY}`);
  const ytID: string = res.data;

  cacheResults(TRACK_NAME, ytID, TRACK_URL);

  return ytID;
};

const getFinalURL = async () => {
  const res = await axios.get(`/api/final?ids=${ytIDArray.value}`);
  finalYTURL.value = `https://www.youtube-nocookie.com/embed/videoseries?list=${res.data}&autoplay=1`;
  console.log(`🎉 Final URL: ${finalYTURL.value}`);
  loading.value = false;
};

const reset = () => {
  playlistTracks.value.length = 0;
  ytIDArray.value.length = 0;
  queryCount.value = 0;
  finalYTURL.value = "";
  loading.value = false;
};
</script>

<template>
  <main class="app bg-gray-900 min-h-screen">
    <section
      class="
        bg-gray-800
        py-16
        border-t-8 border-green-400
        rounded-b-3xl
        shadow-lg
      "
    >
      <h1 class="text-center text-white text-3xl font-bold mb-5">
        Watch My Spotify
      </h1>
      <h2 class="text-center text-gray-200">
        A web experiment made with: Vue 3, Typescript, <br />
        Tailwind, Netlify Functions, Spotify API, and Firebase
      </h2>
    </section>
    <section class="container px-10 flex flex-row">
      <div class="bg-gray-800 p-6 mt-9 flex-none w-96 rounded-lg shadow-2xl">
        <h3 class="text-green-400 mb-4 text-center uppercase font-medium">
          Spotify Playlist URL
        </h3>
        <input
          type="text"
          class="py-2 px-5 bg-gray-100 w-full rounded-md text-gray-900 text-xl"
          v-model="playlistURL"
        />
        <hr class="my-8 border-green-400" />
        <h3 class="text-green-400 mb-2 uppercase font-medium">
          A couple things to note:
        </h3>
        <p class="text-gray-200">1) The Spotify playlist must be public</p>
        <p class="text-gray-200 mb-4">
          2) YouTube playlists are capped at 50 songs max due to API limits
        </p>
        <p class="text-gray-200">
          It could take a few minutes to scrape the YouTube data if the songs
          haven't been cached by other users. If it get's stuck trying to
          scrape, run the conversion again. Go grab some coffee while you wait,
          it'll be worth it.
        </p>
        <button
          class="
            py-3
            px-6
            my-10
            bg-green-400
            text-gray-900
            font-medium
            rounded-lg
            disabled:opacity-50
          "
          :disabled="loading"
          @click="getPlaylistTracks"
        >
          🪄 Convert Playlist to Music Videos
        </button>
        <footer class="mt-20">
          <div class="text-center text-gray-300">
            <small>
              Made with <span class="icon">💖</span> by
              <a href="https://emk.dev" target="_blank" rel="noopener">
                Eric Kelley
              </a>
            </small>
            <br />
            <small>
              Fork on
              <a
                href="https://github.com/emkelley/watchmyspotify"
                target="_blank"
                rel="noopener"
                class="text-green-400"
              >
                GitHub
              </a></small
            >
          </div>
        </footer>
      </div>
      <section
        v-if="playlistRaw"
        class="bg-gray-800 p-6 mt-9 ml-4 pb-9 flex-grow rounded-lg shadow-2xl"
      >
        <h3 class="text-green-400 text-2xl font-medium">
          <span class="text-white uppercase text-sm pr-1">
            Loaded Playlist:
          </span>
          <br />
          {{ playlistRaw.name }}
        </h3>
        <div v-if="finalYTURL.length == 0">
          <p class="text-white">Fetching Tracks, please be patient...</p>
          <p class="text-white">
            Found {{ queryCount }} /{{ playlistTracks.length }} tracks
          </p>
        </div>
        <hr class="border-green-400 my-8" />

        <p v-if="finalYTURL.length > 1">
          <iframe
            class="
              playlist-iframe
              mt-5
              rounded-lg
              border border-green-400
              shadow-xl
              w-full
            "
            style="aspect-ratio: 16 / 9"
            :src="finalYTURL"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            autoplay="true"
          ></iframe>
        </p>
      </section>
    </section>
  </main>
</template>
