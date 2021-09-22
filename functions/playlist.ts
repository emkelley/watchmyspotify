import { Handler } from "@netlify/functions";
import axios from "axios";
const ID = process.env.SPOTIFY_CLIENT_ID;
const SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REFRESH = process.env.SPOTIFY_REFRESH_TOKEN;
const authBuffer = Buffer.from(`${ID}:${SECRET}`).toString("base64");

const handler: Handler = async (event) => {
  const playlist_id = event.queryStringParameters.plst;
  const { data } = await axios({
    method: "POST",
    url: "https://accounts.spotify.com/api/token",
    headers: { Authorization: `Basic ${authBuffer}` },
    params: {
      grant_type: "refresh_token",
      refresh_token: REFRESH,
    },
  }).then(({ data: { access_token } }) =>
    axios({
      method: "GET",
      url: `https://api.spotify.com/v1/playlists/${playlist_id}`,
      headers: { Authorization: "Bearer " + access_token },
    })
  );
  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};

export { handler };
