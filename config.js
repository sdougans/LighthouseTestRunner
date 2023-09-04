module.exports = {
  extends: "lighthouse:default",
  settings: {
    // throttling: {
    //   rttMs: 150,
    //   throughputKbps: 10 * 1024,
    //   requestLatencyMs: 0,
    //   downloadThroughputKbps: 10 * 1024,
    //   uploadThroughputKbps: 10 * 1024,
    //   cpuSlowdownMultiplier: 0,
    // },
    throttlingMethod: "provided"
  },

};
