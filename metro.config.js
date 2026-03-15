const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// In local development (Expo Go), stub out Google Sign-In since the
// native module isn't available in Expo Go's binary.
// EAS_BUILD is set automatically during eas build runs.
if (!process.env.EAS_BUILD) {
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === '@react-native-google-signin/google-signin') {
      return {
        filePath: path.resolve(__dirname, 'src/mocks/google-signin.js'),
        type: 'sourceFile',
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  };
}

module.exports = config;
