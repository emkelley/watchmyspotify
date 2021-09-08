const { https } = require("follow-redirects");
const { Handler } = require("@netlify/functions");

const handler: Handler = async (event, context) => {
  const stringIDArray = decodeURI(event.queryStringParameters.ids);
  const ids = JSON.parse(stringIDArray).join();
  const test = await https.request(
    {
      host: "youtube.com",
      path: `/watch_videos?video_ids=${ids}`,
    },
    (response) => {
      return {
        statusCode: 200,
        body: response.responseUrl,
      };
    }
  );
  console.log(test);
};

export { handler };
