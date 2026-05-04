const eslint = require('@nx/eslint');
const json = require('@nx/eslint-plugin/json');

module.exports = [
  ...eslint.configs.ts,
  {
    files: ['**/*.ts'],
    plugins: {
      '@nx': require('@nx/eslint-plugin'),
    },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            {
              sourceTag: 'scope:core',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:core'],
            },
            {
              sourceTag: 'scope:module',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:core'],
            },
            {
              sourceTag: 'scope:app',
              onlyDependOnLibsWithTags: [
                'scope:shared',
                'scope:core',
                'scope:module',
              ],
            },
          ],
        },
      ],
    },
  },
];
