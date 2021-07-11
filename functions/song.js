const { default: axios } = require('axios');
const ID = process.env.SPOTIFY_CLIENT_ID;
const SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const authBuffer = Buffer.from(`${ID}:${SECRET}`).toString('base64');

exports.handler = (event, context, callback) => {
  if (event.httpMethod === 'GET') {
    const playlist_id = event.queryStringParameters.plst;
    axios({
      method: 'POST',
      url: 'https://accounts.spotify.com/api/token',
      headers: { Authorization: `Basic ${authBuffer}` },
      params: {
        grant_type: 'refresh_token',
        refresh_token: process.env.SPOTIFY_AUTH_REFRESH_TOKEN,
      },
    }).then(({ data: { access_token } }) =>
      axios({
        method: 'GET',
        url: `https://api.spotify.com/v1/playlists/${playlist_id}`,
        headers: { Authorization: 'Bearer ' + access_token },
      }).then(({ data }) => {
        console.log(data);
        return callback(null, {
          statusCode: 200,
          body: JSON.stringify(data),
        });
      })
    );
  }
};
