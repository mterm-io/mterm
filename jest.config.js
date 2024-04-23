/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  runner: '@kayahr/jest-electron-runner',
  testEnvironment: '@kayahr/jest-electron-runner/environment'
}
