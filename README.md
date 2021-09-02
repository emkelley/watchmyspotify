# Watch My Spotify

A simple app that converts your public spotify playlists to a YouTube playlist.

Built with Vue, Spotify API, YouTube Data API, Netlify Functions and some good 'ole undocumented YouTube endpoints.
[![Open in Visual Studio Code](https://open.vscode.dev/badges/open-in-vscode.svg)](https://open.vscode.dev/emkelley/watchmyspotify)
![](demo.gif)

### Running Locally
Clone the repo and run `yarn` or `npm install` to install dependencies.

Before running the app, you'll need to [create a Spotify Developer app](https://developer.spotify.com/dashboard/login) and get the Client ID and Client Secret.

Next, you'll need to generate your [Spotify Refresh Token](https://getyourspotifyrefreshtoken.herokuapp.com/). Check out the [Spotify Authorization Guide](https://developer.spotify.com/documentation/general/guides/authorization-guide/) for more info on that stuff.

After getting all of that, head over to the [Google API Console](https://console.cloud.google.com), create a new project, and [generate API Credentials](https://console.cloud.google.com/apis/api/youtube.googleapis.com/credentials) (an api key).

Tuck all those goodies into an `.env` file. You should have four variables:

`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`, and `YOUTUBE_API_KEY`.

At this point you're pretty much all set. This app uses Netlify Functions to handle the server side stuff so make sure you have `netlify-cli` installed on your machine. Feel free to move your environment variables over to Netlify once you deploy - they'll inject automatically when Netlify CLI is run if you're logged in and have linked the repo to a Netlify deploy.



Finally, run `yarn dev` to launch Netlify CLI and host the app.

### A note on Quotas
The Spotify quota is quite generous and you shouldn't have any issues with it.

The YouTube Data API is another story, this app chews through the daily quota quite fast using search queries.

At a cost of 100 units per search and a daily limit of 10,000 right now, you only get 100 song lookups per key, per day.

Basically just generate more keys if you are converting a lot of playlists and getting rate limited.
