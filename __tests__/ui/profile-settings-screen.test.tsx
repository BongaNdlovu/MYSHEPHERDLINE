import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import React from 'react';

import ProfileSettingsScreen from '@/features/account/screens/ProfileSettingsScreen';
import { useAuth } from '@/lib/core/auth';
import { testIds } from '@/constants/testIds';

jest.mock('@/features/account/components/DistrictCongregationPicker', () => ({
  DistrictCongregationPicker: () => null,
}));

jest.mock('@/features/account/hooks/useNotificationStatus', () => ({
  useNotificationStatus: () => ({
    data: 'unknown',
    loading: false,
    refresh: jest.fn(),
    lastLoadedAt: Date.now(),
    isStale: false,
  }),
}));

jest.mock('@/lib/core/auth', () => ({
  useAuth: jest.fn(),
}));

const useAuthMock = jest.mocked(useAuth);

describe('ProfileSettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state while profile is loading', () => {
    useAuthMock.mockReturnValue({
      session: { access_token: 'token' } as never,
      profile: null,
      loading: false,
      profileLoading: true,
      profileError: null,
      refreshProfile: jest.fn(),
    } as unknown as ReturnType<typeof useAuth>);

    render(<ProfileSettingsScreen />);

    expect(screen.getByText('Loading...')).toBeTruthy();
    expect(screen.queryByTestId(testIds.profileSettings.save)).toBeNull();
  });

  it('shows profile form and notifications section when profile is loaded', () => {
    useAuthMock.mockReturnValue({
      session: { access_token: 'token' } as never,
      profile: {
        id: 'profile-1',
        preferred_district_id: null,
        preferred_organization_id: null,
      } as never,
      loading: false,
      profileLoading: false,
      profileError: null,
      refreshProfile: jest.fn(),
    } as unknown as ReturnType<typeof useAuth>);

    render(<ProfileSettingsScreen />);

    expect(screen.getByTestId(testIds.profileSettings.screen)).toBeTruthy();
    expect(screen.getByTestId(testIds.profileSettings.save)).toBeTruthy();
    expect(screen.getByText('Notifications')).toBeTruthy();
    expect(screen.getByTestId(testIds.notifications.status)).toBeTruthy();
  });
});
