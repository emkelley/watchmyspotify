import { https } from "follow-redirects";

exports.handler = (event, context, callback) => {
  if (event.httpMethod === "GET") {
    const ids = encodeURI(event.queryStringParameters.ids);
    const request = https.request(
      {
        host: "youtube.com",
        path: `/watch_videos?video_ids=${ids}`,
      },
      (response) => {
        const plstID = response.responseUrl.split("=")[2];
        console.log(response.responseUrl);

        callback(null, {
          statusCode: 200,
          body: plstID,
        });
      }
    );
    request.end();
  }
};
