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
            <b-input size="" v-model="playlistURL" />
          </b-field>
          <br />

          <b-field
            label="YouTube Data API Key"
            message="By default the app will use my API key but that usage will get used up pretty quickly. If you are getting YouTube API errors, enter your own API key in this field."
          >
            <b-input size="is-small" v-model="userProvidedAPIKey" />
          </b-field>
          <hr />
          <b-button
            type="is-primary"
            @click="start"
            label="🪄 Convert Playlist to Music Videos"
          />
        </div>
        <div class="column is-8">
          <div v-if="playlistData">
            <hr />
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
            <p>
              Found {{ ytResultsURLs.length }}/{{ playlistData.length }} videos
            </p>
            <br />
            <a
              class="button is-primary is-medium is-outlined"
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
import { db } from '@/firebase';
export default {
  name: 'Home',
  data() {
    return {
      playlistURL:
        'https://open.spotify.com/playlist/04KhhRFdIcxuYpBixlQPYN?si=f6286f8c552b4824',
      playlistData: undefined,
      ytResultsURLs: [],
      userProvidedAPIKey: undefined,
    };
  },
  computed: {
    generatedPlaylistURL() {
      const base = 'http://www.youtube.com/watch_videos?video_ids=';
      return `${base}${this.ytResultsURLs.join()}`;
    },
  },
  methods: {
    start() {
      if (!this.playlistURL) return;
      this.playlistData = undefined;
      this.ytResultsURLs = [];
      this.getPlaylistData();
    },
    async getPlaylistData() {
      const playlistID = this.playlistURL.split('/')[4];
      const data = await axios.get('/.netlify/functions/playlist', {
        params: {
          plst: playlistID,
        },
      });
      this.playlistData = data.data.items;
      for (const track of data.data.items) {
        const cacheHit = await this.checkCache(
          track.track.external_urls.spotify
        );
        if (cacheHit) this.ytResultsURLs.push(cacheHit);
        else {
          this.searchYouTube(
            `${track.track.name} - ${track.track.album.artists[0].name}`,
            track.track.external_urls.spotify
          );
        }
      }
    },
    async searchYouTube(query, trackURL) {
      console.log('yt query ran');
      try {
        const data = await axios.get('/.netlify/functions/yt', {
          params: {
            query: query,
            API_KEY: this.userProvidedAPIKey,
          },
        });
        const ytID = data.data[0].id.videoId;
        this.ytResultsURLs.push(ytID);
        this.cacheResults(ytID, trackURL);
      } catch (error) {
        this.throwError();
      }
    },
    async cacheResults(ytID, spotifyURL) {
      console.log(`caching ${(ytID, spotifyURL)}`);
      await db.collection('cache').add({ ytID, spotifyURL });
    },
    async checkCache(trackURL) {
      console.log('checking cache');
      return await db
        .collection('cache')
        .where('spotifyURL', '==', trackURL)
        .get()
        .then((s) => {
          const results = [];
          if (s.empty) return undefined;
          console.log('cache hit');
          s.forEach((doc) => results.push(doc.data()));
          return results[0].ytID;
        });
    },
    throwError() {
      this.$buefy.toast.open({
        queue: false,
        duration: 3000,
        message: `Couldn't get YouTube results. The API key probably hit it's limit`,
        position: 'is-bottom-right',
        type: 'is-danger',
      });
    },
  },
};
</script>

<style lang="scss">
.box {
  padding: 0rem;
  overflow: hidden;
  aspect-ratio: 1 / 1;
}
.hero {
  border-top: 10px solid #00d261;
}
</style>
