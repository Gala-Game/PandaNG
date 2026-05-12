/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: {
        target: 'ES2021',
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
        strictPropertyInitialization: false,
        exactOptionalPropertyTypes: false,
        noUncheckedIndexedAccess: false,
      },
    }],
  },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/*.spec.(t|j)s', '!**/main.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
