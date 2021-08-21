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
          <b-field label="Spotify Playlist URL">
            <b-input size="" v-model="playlistURL" />
          </b-field>
          <p><small>Playlist must be public</small></p>

          <code>
            https://open.spotify.com/playlist/4uMPojsQJn0d0coC9bp9V1?si=7d1352b54dcd4d13
          </code>
          <br />
          <br />

          <b-field
            label="YouTube Data API Key"
            message="By default the app will use my API key but that usage will get used up pretty quickly. If you are getting errors, enter your own YouTube Data API key in this field. Songs and their matching YouTube videos are cached to help reduce the reliance on the YouTube API but that takes time to build up."
          >
            <b-input
              size="is-small"
              placeholder="Enter API Key here"
              v-model="userProvidedAPIKey"
            />
          </b-field>
          <br />
          <b-button
            type="is-primary"
            expanded
            @click="start"
            label="🪄 Convert Playlist to Music Videos"
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
            <hr />
            <br /><br /><br /><br />
            <br /><br /><br /><br />
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
        'https://open.spotify.com/playlist/4uMPojsQJn0d0coC9bp9V1?si=7d1352b54dcd4d13',
      playlistData: undefined,
      ytResultsURLs: [
        'Vsy1URDYK88',
        'cf-T-kmwG7o',
        'H1iGOgs4fLE',
        '47p2ePDdGlU',
        'uS2D7bTszK0',
        'AHCI2rHqoco',
        'WDUMQ9kJAN4',
        '6MkS_CCYIaI',
        'uOFTqVi-qp4',
        '2Sk_35dNEy4',
        'UfzYGAhbSTU',
        'kjIATfF9xxA',
        'jQd9nI69ND8',
        'ogSax6k3adU',
        'k2GngkTy9-w',
        'F8oK8XT6el0',
        'SCD2tB1qILc',
        'VT9q8-i8e7Q',
        'ZVkWiOclnDg',
        'eS_korRhTDk',
        'EUw6Ju3STB8',
        'PI8lXMlU7XM',
        'Ys0hjbGiAoA',
        'HXaMZAPAR6g',
        'gBkWR-WfEeU',
        '62fdti-o_mo',
        'UQtcXzIXEIo',
        '8sADfWE44HQ',
        '_cB3HXVvm0g',
        '5AOtEnH87Mg',
        'HAIDqt2aUek',
        'xvtNS6hbVy4',
        'MwSkC85TDgY',
        'w3aFvlggYC4',
        'z068utooQUM',
        'E66v5GOPgkU',
        'uaKc_zmtWqo',
        'IxxstCcJlsc',
        'UT6d6RC2gS8',
        'sOS9aOIXPEk',
        'JI5noh4OyXc',
        'a5uQMwRMHcs',
        'SCD2tB1qILc',
        'qIz-9CHVQUc',
      ],
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
          this.searchYouTube(
            `${track.track.name} - ${track.track.album.artists[0].name}`,
            track.track.external_urls.spotify
          );
        }

        if (this.queryCount == this.playlistData.length) {
          this.finalYTURL = await this.getFinalURL(this.ytResultsURLs);
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
    async getFinalURL(ytResultsURLs) {
      return await axios.get(
        `/.netlify/functions/ytFinal?ids=${ytResultsURLs}`
      );
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
    createYTembed(id) {
      return `https://www.youtube-nocookie.com/embed/videoseries?list=${id}&autoplay=1`;
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
