const { google } = require('googleapis');
exports.handler = (event, context, callback) => {
  if (event.httpMethod === 'GET') {
    google
      .youtube('v3')
      .search.list({
        part: 'snippet',
        type: 'video',
        maxResults: 5,
        key: process.env.YOUTUBE_API_KEY,
        q: event.queryStringParameters.query,
      })
      .then((res) => {
        return callback(null, {
          statusCode: 200,
          body: JSON.stringify(res.data.items),
        });
      })
      .catch((error) => {
        console.log(error);
        return callback(null, {
          statusCode: 500,
          body: JSON.stringify(error.errors),
        });
      });
  }
};
