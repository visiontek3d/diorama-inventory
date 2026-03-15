// Stub for @react-native-google-signin/google-signin in Expo Go
export const GoogleSignin = {
  configure: () => {},
  signIn: () => Promise.reject({ code: 'SIGN_IN_CANCELLED' }),
  signOut: () => Promise.resolve(),
  hasPlayServices: () => Promise.resolve(true),
  isSignedIn: () => Promise.resolve(false),
  getCurrentUser: () => Promise.resolve(null),
};

export const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};

export const GoogleSigninButton = () => null;
GoogleSigninButton.Size = { Wide: 1, Standard: 0, Icon: 2 };
GoogleSigninButton.Color = { Dark: 1, Light: 0 };
