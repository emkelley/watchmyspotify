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
          <b-button type="is-primary" label="Submit" />
        </div>
        <div class="column is-8">
          <h2 class="subtitle">Playlist Data</h2>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return {
      playlistURL: '',
    };
  },
  methods: {
    // get the spotify playlist data from this.playlistURL
    async getPlaylistData() {
      const playlist = this.playlistURL;
      const url = `https://api.spotify.com/v1/users/spotify/playlists/${playlist}`;
      const token = localStorage.getItem('spotify_token');
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      const options = {
        headers,
      };
      return await fetch(url, options).then((response) => response.json());
    },
  },
};
</script>
