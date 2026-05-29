import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import AdminAccessRequestsScreen from '@/features/account/screens/AdminAccessRequestsScreen';
import { usePendingAccessRequests } from '@/features/account/hooks/useAccessRequests';
import { useAuth } from '@/lib/core/auth';
import { getAppEnv } from '@/lib/core/env';
import { testIds } from '@/constants/testIds';
import { mockShowToast } from './test-harness';

jest.mock('@/features/account/hooks/useAccessRequests', () => ({
  usePendingAccessRequests: jest.fn(),
}));

jest.mock('@/lib/core/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/core/env', () => ({
  getAppEnv: jest.fn(),
  envValidation: { ok: true },
}));

jest.mock('@/lib/core/api', () => ({
  inviteAccessRequest: jest.fn(),
}));

const usePendingAccessRequestsMock = jest.mocked(usePendingAccessRequests);
const useAuthMock = jest.mocked(useAuth);
const getAppEnvMock = jest.mocked(getAppEnv);

const pendingRequest = {
  id: 'req-1',
  email: 'new@church.test',
  display_name: 'New Shepherd',
  preferred_district_id: 'district-1',
  preferred_organization_id: 'org-1',
  message: null,
  status: 'pending' as const,
  created_at: '2026-05-27T10:00:00.000Z',
  districtName: 'Durban District',
  organizationName: 'Central Church',
};

describe('AdminAccessRequestsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthMock.mockReturnValue({
      session: { access_token: 'token' } as never,
    } as unknown as ReturnType<typeof useAuth>);
    usePendingAccessRequestsMock.mockReturnValue({
      data: [pendingRequest],
      loading: false,
      error: null,
      refresh: jest.fn(),
      lastLoadedAt: Date.now(),
      isStale: false,
    } as ReturnType<typeof usePendingAccessRequests>);
  });

  it('shows worker configuration warning when worker URL is missing', () => {
    getAppEnvMock.mockReturnValue({
      workerApiUrl: null,
      allowReportFallback: false,
      supabaseUrl: 'https://example.supabase.co',
      supabasePublishableKey: 'key',
    });

    render(<AdminAccessRequestsScreen />);

    expect(
      screen.getByText('Worker API is not configured. Set EXPO_PUBLIC_WORKER_API_URL before sending invitations.'),
    ).toBeTruthy();
  });

  it('allows invite press and shows toast when worker URL is missing', () => {
    getAppEnvMock.mockReturnValue({
      workerApiUrl: null,
      allowReportFallback: false,
      supabaseUrl: 'https://example.supabase.co',
      supabasePublishableKey: 'key',
    });

    render(<AdminAccessRequestsScreen />);
    fireEvent.press(screen.getByTestId(testIds.admin.accessRequests.invite('req-1')));

    expect(mockShowToast).toHaveBeenCalledWith('Worker API is not configured. Set EXPO_PUBLIC_WORKER_API_URL.');
  });
});
