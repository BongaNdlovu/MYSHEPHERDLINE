import { beforeEach, jest } from '@jest/globals';
import React from 'react';

export const mockShowToast = jest.fn();

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: View,
  };
});

jest.mock('@/lib/core/toast', () => ({
  useToast: () => ({ showToast: mockShowToast, message: null }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/lib/app-shell', () => ({
  useAndroidBackNavigation: jest.fn(),
  AuthRedirect: () => null,
}));

jest.mock('@/components/ui/LogoMark', () => ({
  LogoMark: () => null,
}));

beforeEach(() => {
  mockShowToast.mockClear();
});
