export default {
  displayName: 'module-auth',
  preset: '../../jest.preset.js',
  transform: { '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }] },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/modules/auth',
  setupFiles: ['<rootDir>/src/tests/setup.ts'],
};
