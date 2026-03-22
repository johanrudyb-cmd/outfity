import nextVitals from 'eslint-config-next';

const config = [
  ...nextVitals,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist-scripts/**',
      'scripts/**',
      'tmp/**',
      'n8n/**',
      'n8n-standalone/**',
    ],
  },
  {
    rules: {
      // Keep truly unsafe JSX entities blocked, but allow French copy with quotes/apostrophes.
      'react/no-unescaped-entities': ['error', { forbid: ['>', '}'] }],
    },
  },
];

export default config;
