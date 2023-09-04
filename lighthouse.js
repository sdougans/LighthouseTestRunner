const fs = require("fs");
const puppeteer = require("puppeteer");
const lighthouse = require("./node_modules/lighthouse/core/index.cjs");
const config = require("./config.js");

// Read urls from csv file
var array = fs.readFileSync("URLs.csv").toString().split("\n");

// Push header column for csv results
let result = [];
result.push(
  ", URL, Mobile_Performance, Mobile_A11y, Mobile_BestPractices, Mobile_SEO, Desktop_Performance, Desktop_A11y, Desktop_BestPractices, Desktop_SEO"
);

// Generate unique timestamp for test results filename
const getFiletimestamp = () => {
  var date = new Date();
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getUTCDate();
  var hour = date.getHours();
  var min = date.getMinutes();
  var sec = date.getSeconds();
  return `${year}-${month}-${day}-${hour}-${min}-${sec}`;
};

// Create report directory if it doesn't already exist
if (!fs.existsSync("./reports")) {
  fs.mkdirSync("reports");
}
// Generate a unique timestamp for report filename
var timestamp = getFiletimestamp();

// Run the tests
(async () => {
  // Set options
  const options = {
    logLevel: "info",
    output: "html",
    // onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
  };

  // const config = {
  //   settings: {
  //     throttling: {
  //       rttMs: 150,
  //       throughputKbps: 10 * 1024,
  //       requestLatencyMs: 0,
  //       downloadThroughputKbps: 10 * 1024,
  //       uploadThroughputKbps: 10 * 1024,
  //       cpuSlowdownMultiplier: 0,
  //     },
  //   },
  // };

  // Prepare cookies
  const cookieConsent = {
    name: "CookieConsent",
    value:
      "{stamp:'jqKP7du5N9iY6XPcD2DbZ3X46feAGKg2Ja51cYuIRL9R82p6oZ+bNA==',necessary:true,preferences:true,statistics:true,marketing:true,method:'explicit',ver:5,utc:1756762572,region:'gb'}",
    domain: "www.bailliegifford.com",
  };
  const cookieSelectedChannel = {
    name: "cookieSelectedChannel",
    value: "Institutional investor",
    domain: "www.bailliegifford.com",
  };
  const cookieSelectedRegion = {
    name: "cookieSelectedRegion",
    value: "UK",
    domain: "www.bailliegifford.com",
  };

  // Launch browser with puppeteer
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"],
    defaultViewport: false,
  });

  // Set cookies
  const page = await browser.newPage();
  await page.setCookie(cookieConsent);
  await page.setCookie(cookieSelectedChannel);
  await page.setCookie(cookieSelectedRegion);

  await page.goto("https://www.bailliegifford.com/en/uk/individual-investors/");

  // const client = await page.target().createCDPSession();
  // const cookies = (await client.send("Network.getAllCookies")).cookies;
  // console.log(JSON.stringify(cookies));

  // Lighthouse will open the URL.
  // Puppeteer will observe `targetchanged` and inject our stylesheet.
  // const { lhr } = await lighthouse(url, undefined, undefined, page);

  // Repeat test for each url
  for (let i in array) {
    for (let x = 0; x < 2; x++) {
      // Test on mobile and desktop
      if (x === 0) {
        options.formFactor = "mobile";
        options.screenEmulation = {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 1,
          disabled: false,
        };
      } else {
        options.formFactor = "desktop";
        options.screenEmulation = {
          mobile: false,
          width: 1040,
          height: 670,
          deviceScaleFactor: 0.5,
          disabled: false,
        };
      }

      // Run the test and capture the result
      var runnerResult = await lighthouse(array[i], options, config, page);

      // Tidy the URL for filename
      var cleanUrl = runnerResult.lhr.mainDocumentUrl
        .replace(/\.|\/|:/gm, "-")
        .replace(/--/gm, "");

      // Write HTML report for single test run
      var report = runnerResult.report;
      fs.writeFileSync(
        `./reports/html-${timestamp}-${cleanUrl}-${options.formFactor}.html`,
        report
      );

      // Write CSV result to string for single test run
      if (x === 0) {
        result.push("\n");
        result.push(runnerResult.lhr.mainDocumentUrl);
      }
      if (runnerResult.lhr.categories.performance.score) {
        result.push(runnerResult.lhr.categories.performance.score * 100);
      } else {
        result.push("n/a");
      }
      if (runnerResult.lhr.categories.accessibility.score) {
        result.push(runnerResult.lhr.categories.accessibility.score * 100);
      } else {
        result.push("n/a");
      }
      if (runnerResult.lhr.categories["best-practices"].score) {
        result.push(runnerResult.lhr.categories["best-practices"].score * 100);
      } else {
        result.push("n/a");
      }
      if (runnerResult.lhr.categories.seo.score) {
        result.push(runnerResult.lhr.categories.seo.score * 100);
      } else {
        result.push("n/a");
      }
    }
  }

  await browser.close();

  // Write full csv results to file
  fs.appendFileSync(
    `./reports/csv-${timestamp}-lighthouse-results.csv`,
    result.toString()
  );
})();
