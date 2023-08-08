const fs = require("fs");
const lighthouse = require("./node_modules/lighthouse/core/index.cjs");
const chromeLauncher = require("chrome-launcher");

// Read urls from csv file
var array = fs.readFileSync("URLs.csv").toString().split("\n");

// Push header column for csv results
let result = [];
result.push(
  ", URL, Mobile_Performance, Mobile_A11y, Mobile_BestPractices, Mobile_SEO, Desktop_Performance, Desktop_A11y, Desktop_BestPractices, Desktop_SEO"
);

// Run the tests
(async () => {
  // Launch Chrome headlessly
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--disable-extensions"],
  });

  // Set configurations
  const options = {
    logLevel: "info",
    output: "html",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    port: chrome.port,
  };

  // Create report directory if it doesn't already exist
  if (!fs.existsSync("./reports")) {
    fs.mkdirSync("reports");
  }

  // Generate a unique timestamp for report filename
  var timestamp = getFiletimestamp();

  // Repeat test for each url
  for (let i in array) {
    for (let x = 0; x < 2; x++) {
      // Test on mobile and desktop
      if (x === 0) options.strategy = "mobile";
      else options.strategy = "desktop";

      // Run the test and capture the result
      var runnerResult = await lighthouse(array[i], options);

      // Tidy the URL for filename
      var cleanUrl = runnerResult.lhr.mainDocumentUrl
        .replace(/\.|\/|:/gm, "-")
        .replace(/--/gm, "");

      // Write HTML report for single test run
      var report = runnerResult.report;
      fs.writeFileSync(
        `./reports/html-${timestamp}-${cleanUrl}-${options.strategy}.html`,
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

  // Write full csv results to file
  fs.appendFileSync(`./reports/csv-${timestamp}-lighthouse-results.csv`, result.toString());

  // Kill Chrome
  await chrome.kill();
})();

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
