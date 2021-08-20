const { google } = require('googleapis');
exports.handler = (event, context, callback) => {
  if (event.httpMethod === 'GET') {
    const key = event.queryStringParameters.API_KEY ?? process.env.API_KEY;
    google
      .youtube('v3')
      .search.list({
        part: 'snippet',
        type: 'video',
        maxResults: 5,
        key,
        q: `${event.queryStringParameters.query} official`,
      })
      .then((res) =>
        callback(null, {
          statusCode: 200,
          body: JSON.stringify(res.data.items),
        })
      )
      .catch((error) =>
        callback(null, {
          statusCode: 500,
          body: error.errors[0].message,
        })
      );
  }
};
