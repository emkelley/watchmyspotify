const { Handler } = require("@netlify/functions");
const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");
const cheerio = require("cheerio");

// const query = 'Something About Us - Daft Punk'

const handler: Handler = async (event, context) => {
  const { query } = event.queryStringParameters;
  const ID = await scrapeResults(query);
  console.log(`Scraped ID: ${ID}`);

  return {
    statusCode: 200,
    body: JSON.stringify(ID),
  };
};

const scrapeResults = async (query: string) => {
  const ytQueryBase = "https://www.youtube.com/results?search_query=";
  const fullQuery = ytQueryBase + query.replace(" ", "+");

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath:
      process.env.CHROME_EXECUTABLE_PATH || (await chromium.executablePath),
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto(fullQuery);

  const html = await page.content();
  const finalID = parse(html);

  browser.close();
  console.log(finalID);
  return finalID;
};

const parse = (html) => {
  const $ = cheerio.load(html);
  const results = [];
  $("#contents ytd-video-renderer,#contents ytd-grid-video-renderer").each(
    (i, link) =>
      results.push($(link).find("#video-title").attr("href").slice(-11))
  );
  return results[0];
};

export { handler };
