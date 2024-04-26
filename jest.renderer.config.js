module.exports = {
  preset: 'ts-jest',
  testRegex: '(src/(preload|renderer)/.*\\.test\\.ts)$',
  testEnvironment: 'jest-environment-jsdom'
}
