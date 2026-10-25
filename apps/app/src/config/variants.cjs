const appVariants = ['local', 'preview', 'production'];

const bundleIdentifiers = {
  local: 'com.nigerialaw.reader.local',
  preview: 'com.nigerialaw.reader.preview',
  production: 'com.nigerialaw.reader',
};

function readAppVariant(value) {
  if (value === undefined || value === '') {
    return 'local';
  }
  if (value === 'local' || value === 'preview' || value === 'production') {
    return value;
  }
  throw new Error(
    `Unknown APP_VARIANT "${value}". Expected local, preview, or production.`,
  );
}

module.exports = {
  appVariants,
  bundleIdentifiers,
  readAppVariant,
};
