/* eslint-disable */
module.exports = {
  displayName: 'module-inventory',
  preset: '../../jest.preset.js',
  testMatch: ['**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@erp/shared/kernel$': '<rootDir>/../../libs/shared/kernel/src/index.ts',
    '^@erp/shared/utils$': '<rootDir>/../../libs/shared/utils/src/index.ts',
    '^@erp/shared/testing$': '<rootDir>/../../libs/shared/testing/src/index.ts',
    '^@erp/core/module-registry$': '<rootDir>/../../libs/core/module-registry/src/index.ts',
    '^@erp/core/event-bus$': '<rootDir>/../../libs/core/event-bus/src/index.ts',
    '^@erp/core/database$': '<rootDir>/../../libs/core/database/src/index.ts',
    '^@erp/core/http$': '<rootDir>/../../libs/core/http/src/index.ts',
    '^@erp/module/(.*)$': '<rootDir>/../../modules/$1/src/index.ts',
    // Map domain and infrastructure relative paths
    '^@inventory/domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@inventory/application/(.*)$': '<rootDir>/src/application/$1',
    '^@inventory/infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@inventory/tests/(.*)$': '<rootDir>/src/tests/$1',
  },
  roots: ['<rootDir>/src'],
};
