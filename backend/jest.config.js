/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  moduleFileExtensions: ["js", "json"],
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ["controllers/**/*.js", "models/**/*.js"],
  coverageDirectory: "coverage",
  testTimeout: 10000,
};