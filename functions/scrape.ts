import { Handler } from "@netlify/functions";
import chromium from "chrome-aws-lambda";
import * as cheerio from "cheerio";
const handler: Handler = async (event) => {
  const { query } = event.queryStringParameters;
  const ID = await scrapeResults(query);
  return {
    statusCode: 200,
    body: JSON.stringify(ID),
  };
};

const scrapeResults = async (query: string) => {
  const ytQueryBase = "https://www.youtube.com/results?search_query=";
  const fullQuery = ytQueryBase + query.replace(" ", "+") + " official video";

  const browser = await chromium.puppeteer.launch({
    args: [...chromium.args, "--no-zygote", "--single-process"],
    executablePath: process.env.CHROME_EXE || (await chromium.executablePath),
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto(fullQuery);
  await page.setRequestInterception(true);
  // If the page makes a  request to a resource type of image or stylesheet then abort that request
  page.on("request", (req) => {
    if (req.resourceType() === "image" || req.resourceType() === "stylesheet") {
      req.abort();
    } else {
      req.continue();
    }
  });
  const html = await page.content();
  const finalID = parse(html);

  await browser.close();
  return finalID;
};

const parse = (html) => {
  const $ = cheerio.load(html);
  const results = [];
  $("#contents ytd-video-renderer,#contents ytd-grid-video-renderer")
    .slice(0, 1)
    .each((i, link) => {
      const title: string = $(link).find("#video-title").attr("href");
      const id: string = title.slice(-11);
      results.push(id);
    });
  return results[0];
};

export { handler };
