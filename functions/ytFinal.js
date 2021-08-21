const { https } = require('follow-redirects');

exports.handler = (event, context, callback) => {
  if (event.httpMethod === 'GET') {
    const ids = encodeURI(event.queryStringParameters.ids);
    const request = https.request(
      {
        host: 'youtube.com',
        path: `/watch_videos?video_ids=${ids}`,
      },
      (response) => {
        console.log(response.responseUrl);
        const plstID = response.responseUrl.split('=')[2];
        callback(null, {
          statusCode: 200,
          body: plstID,
        });
      }
    );
    request.end();
  }
};
