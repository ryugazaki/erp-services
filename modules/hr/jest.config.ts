export default {
  displayName: 'module-hr',
  preset: '../../jest.preset.js',
  transform: { '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }] },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/modules/hr',
  setupFiles: ['<rootDir>/src/tests/setup.ts'],
};
