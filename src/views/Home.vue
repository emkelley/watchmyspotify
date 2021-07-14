<template>
  <div class="home">
    <div class="hero is-dark">
      <div class="hero-body has-text-centered">
        <h1 class="title">Watch My Spotify</h1>
        <h2 class="subtitle">
          A web experiment by <a href="https://emk.dev">Eric Kelley</a>
        </h2>
      </div>
    </div>
    <div class="container is-widescreen">
      <div class="columns is-multiline is-centered">
        <div class="column is-5">
          <br />
          <b-field
            label="Spotify Playlist URL"
            message="Playlist must be public"
          >
            <b-input size="is-medium" v-model="playlistURL" />
          </b-field>
          <b-button @click="getPlaylistData" type="is-primary" label="Submit" />
        </div>
        <div class="column is-8">
          <div v-if="playlistData">
            <h2 class="subtitle">Playlist Tracks</h2>
            <div class="columns is-multiline">
              <div
                v-for="track in playlistData"
                :key="track.href"
                class="column is-2"
              >
                <div class="box">
                  <img :src="track.track.album.images[0].url" alt="" />
                </div>
              </div>
            </div>
            <hr />
            <h2 class="subtitle">Generated Video Playlist</h2>
            <p>Found {{ ytResultsURLs.length }} videos</p>
            <br />
            <a
              class="button"
              :href="generatedPlaylistURL"
              target="_blank"
              rel="noopener"
            >
              Watch Your Playlist
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'Home',
  data() {
    return {
      playlistURL: 'https://open.spotify.com/playlist/2e5zLODjQB04wovyMU6ZQa',
      playlistData: undefined,
      ytResultsURLs: [],
    };
  },
  computed: {
    generatedPlaylistURL() {
      return `http://www.youtube.com/watch_videos?video_ids=${this.ytResultsURLs.join()}`;
    },
  },
  methods: {
    async getPlaylistData() {
      if (!this.playlistURL) return;
      const playlistID = this.playlistURL.split('/')[4];
      const data = await axios.get('/.netlify/functions/playlist', {
        params: {
          plst: playlistID,
        },
      });
      this.playlistData = data.data.items;
      this.playlistData.forEach((track) => {
        this.searchYouTube(
          `${track.track.name} - ${track.track.album.artists[0].name}`
        );
      });
    },
    async searchYouTube(query) {
      const data = await axios.get('/.netlify/functions/yt', {
        params: {
          query: query,
        },
      });
      if (data) this.ytResultsURLs.push(data.data[0].id.videoId);
    },
  },
};
</script>
