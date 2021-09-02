<template>
  <div class="home">
    <div class="hero is-dark">
      <div class="hero-body has-text-centered">
        <h1 class="title">Watch My Spotify</h1>
        <h2 class="subtitle">a web experiment</h2>
      </div>
    </div>
    <div class="container is-widescreen">
      <div class="columns is-multiline is-centered">
        <div class="column is-5">
          <br />
          <b-field label="Spotify Playlist URL">
            <b-input size="" v-model="playlistURL" />
          </b-field>
          <br />
          <div>
            <h3 class="heading">Two things to know:</h3>
            <small>1) The playlist must be <strong>public</strong></small>
            <br />
            <small>
              2) Video playlists are capped at <strong>50 songs or less</strong>
            </small>
          </div>
          <br />
          <small>
            This is due to the method I'm using to generate YouTube Playlists.
            If the generated playlist doesn't appear properly or with not the
            correct amount of videos, just run the conversion one more time.
          </small>
          <br />
          <br />
          <code>
            https://open.spotify.com/playlist/3DrL4y1VUT5KW1a4SSXPBh
          </code>
          <br />
          <br /><br />
          <b-button
            type="is-primary"
            expanded
            @click="start"
            label="🪄 Convert Playlist to Music Videos"
            :disabled="!playlistURL"
          />
        </div>
        <div class="column is-8">
          <div v-if="playlistData">
            <hr />
            <div class="level">
              <div class="level-left">
                <div class="level-item">
                  <h1 class="title is-4">Generated Video Playlist</h1>
                </div>
              </div>
              <div class="level-right">
                <div class="level-item">
                  <small></small>
                </div>
                <a
                  class="button is-outlined"
                  :href="generatedPlaylistURL"
                  target="_blank"
                  rel="noopener"
                >
                  View on YouTube
                </a>
              </div>
            </div>
            <br />
            <div v-show="!finalYTURL">
              <center>
                <p>{{ queryCount }}/{{ playlistData.length }}</p>
                <p v-if="queryCount === playlistData.length">
                  Waiting for responses from API...
                </p>

                <div class="lds-ellipsis">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </center>
            </div>
            <p v-if="finalYTURL">
              <iframe
                class="playlist-iframe box"
                width="100%"
                :src="createYTembed(finalYTURL.data)"
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                autoplay="true"
              ></iframe>
            </p>

            <hr />
            <h1 class="title is-4">Album Covers</h1>
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
          </div>
        </div>
      </div>
    </div>
    <footer>
      <div class="content has-text-centered">
        <small>
          Made with <span class="icon">💖</span> by
          <a href="https://emk.dev" target="_blank" rel="noopener">
            Eric Kelley
          </a>
          using Netlify Functions, Puppeteer and the Spotify Web API.
        </small>
        <br />
        <small>
          Fork on
          <a
            href="https://github.com/emkelley/watchmyspotify"
            target="_blank"
            rel="noopener"
          >
            GitHub
          </a>
        </small>
      </div>
    </footer>
  </div>
</template>

<script>
import axios from 'axios';
import { db } from '@/firebase';
export default {
  name: 'Home',
  data() {
    return {
      playlistURL: 'https://open.spotify.com/playlist/3DrL4y1VUT5KW1a4SSXPBh',
      playlistData: undefined,
      ytResultsURLs: [],
      userProvidedAPIKey: undefined,
      queryCount: 1,
      finalYTURL: undefined,
    };
  },
  computed: {
    generatedPlaylistURL() {
      const base = 'http://www.youtube.com/watch_videos?video_ids=';
      return `${base}${this.ytResultsURLs.join()}`;
    },
    allVidsFetched() {
      return this.ytResultsURLs.length === this.playlistData.length
        ? true
        : false;
    },
  },
  methods: {
    start() {
      if (!this.playlistURL) return;
      this.playlistData = undefined;
      this.ytResultsURLs = [];
      this.getPlaylistData();
      this.queryCount = 0;
      this.finalYTURL = undefined;
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
        this.queryCount++;
        const cacheHit = await this.checkCache(
          track.track.external_urls.spotify
        );
        if (cacheHit) this.ytResultsURLs.push(cacheHit);
        else {
          const scrapedID = await this.searchYouTubePuppeteer(
            `${track.track.name} - ${track.track.album.artists[0].name}`,
            track.track.external_urls.spotify
          );
          this.ytResultsURLs.push(scrapedID);
        }

        if (this.allVidsFetched)
          this.finalYTURL = await this.getFinalURL(this.ytResultsURLs);
      }
    },
    async searchYouTubePuppeteer(query, trackURL) {
      console.log('puppeteer query ran');
      try {
        const data = await axios.get('/.netlify/functions/headless', {
          params: {
            query: query,
          },
        });
        const ytID = data.data;
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
    async getFinalURL(ytResultsURLs) {
      return await axios.get(
        `/.netlify/functions/ytFinal?ids=${ytResultsURLs}`
      );
    },
    throwError() {
      this.$buefy.toast.open({
        queue: false,
        duration: 3000,
        message: `A Lambda request timed out, try again after this finishes. Continuing...`,
        position: 'is-bottom-right',
        type: 'is-warning',
      });
    },
    createYTembed(id) {
      return `https://www.youtube-nocookie.com/embed/videoseries?list=${id}&autoplay=0`;
    },
  },
};
</script>

<style lang="scss">
.home {
  background: rgb(17, 17, 17);
  color: ghostwhite;
  min-height: 100vh;
  .title,
  .subtitle {
    color: ghostwhite;
  }
  label {
    color: #00d261;
  }
}
hr {
  background: #00d261;
  border-radius: 999px;
  height: 1px;
}
.box {
  padding: 0rem;
  overflow: hidden;
  aspect-ratio: 1 / 1;
}
footer {
  background: black;
  padding: 2rem 0;
  margin-top: 10rem;
}
.hero {
  border-top: 10px solid #00d261;
  border-bottom-right-radius: 1.5rem;
  border-bottom-left-radius: 1.5rem;
  background: black;
}
.playlist-iframe {
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 1rem;
}
.lds-ellipsis {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
}
.lds-ellipsis div {
  position: absolute;
  top: 33px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #00d261;
  animation-timing-function: cubic-bezier(0, 1, 1, 0);
}
strong {
  color: #00d261;
}
.lds-ellipsis div:nth-child(1) {
  left: 8px;
  animation: lds-ellipsis1 0.6s infinite;
}
.lds-ellipsis div:nth-child(2) {
  left: 8px;
  animation: lds-ellipsis2 0.6s infinite;
}
.lds-ellipsis div:nth-child(3) {
  left: 32px;
  animation: lds-ellipsis2 0.6s infinite;
}
.lds-ellipsis div:nth-child(4) {
  left: 56px;
  animation: lds-ellipsis3 0.6s infinite;
}
@keyframes lds-ellipsis1 {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes lds-ellipsis3 {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(0);
  }
}
@keyframes lds-ellipsis2 {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(24px, 0);
  }
}
code {
  background: black;
  color: #00d261;
  font-size: 0.6rem;
}
</style>
