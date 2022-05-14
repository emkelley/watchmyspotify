import { Handler } from "@netlify/functions";
import chromium from "chrome-aws-lambda";
import * as cheerio from "cheerio";
import kill from "tree-kill";

const handler: Handler = async (event) => {
  const { query } = event.queryStringParameters;
  const ID = await scrapeResults(query);
  return {
    statusCode: 200,
    body: JSON.stringify(ID),
  };
};

const nuclear_args = [
  "--disable-2d-canvas-clip-aa",
  "--disable-2d-canvas-image-chromium",
  "--disable-3d-apis",
  "--disable-accelerated-2d-canvas",
  "--disable-accelerated-jpeg-decoding",
  "--disable-accelerated-mjpeg-decode",
  "--disable-accelerated-video-decode",
  "--disable-app-list-dismiss-on-blur",
  "--disable-audio-output",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-breakpad",
  "--disable-canvas-aa",
  "--disable-client-side-phishing-detection",
  "--disable-component-extensions-with-background-pages",
  "--disable-composited-antialiasing",
  "--disable-default-apps",
  "--disable-dev-shm-usage",
  "--disable-extensions",
  "--disable-features=TranslateUI,BlinkGenPropertyTrees",
  "--disable-field-trial-config",
  "--disable-fine-grained-time-zone-detection",
  "--disable-geolocation",
  "--disable-gl-extensions",
  "--disable-gpu",
  "--disable-gpu-early-init",
  "--disable-gpu-sandbox",
  "--disable-gpu-watchdog",
  "--disable-histogram-customizer",
  "--disable-in-process-stack-traces",
  "--disable-infobars",
  "--disable-ipc-flooding-protection",
  "--disable-notifications",
  "--disable-renderer-backgrounding",
  "--disable-session-crashed-bubble",
  "--disable-setuid-sandbox",
  "--disable-site-isolation-trials",
  "--disable-software-rasterizer",
  "--disable-sync",
  "--disable-threaded-animation",
  "--disable-threaded-scrolling",
  "--disable-translate",
  "--disable-webgl",
  "--disable-webgl2",
  "--enable-features=NetworkService",
  "--force-color-profile=srgb",
  "--headless",
  "--hide-scrollbars",
  "--ignore-certifcate-errors",
  "--ignore-certifcate-errors-spki-list",
  "--ignore-certificate-errors",
  "--ignore-certificate-errors-spki-list",
  "--ignore-gpu-blacklist",
  "--ignore-ssl-errors",
  "--log-level=3",
  "--metrics-recording-only",
  "--mute-audio",
  "--no-crash-upload",
  "--no-default-browser-check",
  "--no-experiments",
  "--no-first-run",
  "--no-sandbox",
  "--no-zygote",
  "--renderer-process-limit=1",
  "--safebrowsing-disable-auto-update",
  "--silent-debugger-extension-api",
  "--single-process",
  "--unhandled-rejections=strict",
  "--window-position=0,0",
];

const scrapeResults = async (query: string) => {
  const ytQueryBase = "https://www.youtube.com/results?search_query=";
  const fullQuery = `${ytQueryBase}${query.replace(" ", "+")} official video`;

  const browser = await chromium.puppeteer.launch({
    args: [...chromium.args, ...nuclear_args],
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

  const browser_pid = browser.process().pid;
  await browser.close();
  if (process.env.CHROME_EXE) kill(browser_pid, "SIGKILL");

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
