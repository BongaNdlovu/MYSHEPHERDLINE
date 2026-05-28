import Constants from 'expo-constants';

export function isExpoGoRuntime(): boolean {
  return Constants.expoGoConfig != null || Constants.appOwnership === 'expo';
}
