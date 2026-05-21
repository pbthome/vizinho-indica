module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.js'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          jsx: 'react-jsx'
        }
      }
    ]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  clearMocks: true
};
