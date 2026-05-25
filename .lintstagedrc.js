module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'prettier --write',
    // We run eslint only in apps/web where it is installed. Alternatively can add root eslint if configured.
  ],
  '*.{json,css,md,yaml,yml}': ['prettier --write'],
};
