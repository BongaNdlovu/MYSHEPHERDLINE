import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { router } from 'expo-router';

import MemberProfileScreen from '@/features/members/screens/MemberProfileScreen';
import { useMember } from '@/features/members';
import { useMemberVisits } from '@/features/visits';
import { useAdminAccess } from '@/features/admin';
import { testIds } from '@/constants/testIds';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({ id: 'member-1' }),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/features/members', () => ({
  useMember: jest.fn(),
}));

jest.mock('@/features/visits', () => ({
  useMemberVisits: jest.fn(),
  VisitTimelineItem: () => null,
}));

jest.mock('@/features/admin', () => ({
  useAdminAccess: jest.fn(),
}));

const useMemberMock = jest.mocked(useMember);
const useMemberVisitsMock = jest.mocked(useMemberVisits);
const useAdminAccessMock = jest.mocked(useAdminAccess);
const routerPushMock = jest.mocked(router.push);

describe('MemberProfileScreen navigation', () => {
  it('opens care progress from the profile action', () => {
    useMemberMock.mockReturnValue({
      data: {
        id: 'member-1',
        full_name: 'Test Member',
        phone: '+27123456789',
        email: null,
        address: null,
        risk_level: 'low',
        status: 'active',
        care_stage: 'contacted',
        last_contact_at: null,
        notes: null,
        assigned_to: 'user-1',
        organization_id: 'org-1',
        created_at: '2026-05-26T10:00:00.000Z',
        updated_at: '2026-05-26T10:00:00.000Z',
      },
      loading: false,
      error: null,
      refresh: jest.fn(),
      lastLoadedAt: Date.now(),
      isStale: false,
    } as ReturnType<typeof useMember>);
    useMemberVisitsMock.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      refresh: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
      loadingMore: false,
      lastLoadedAt: Date.now(),
      isStale: false,
    } as ReturnType<typeof useMemberVisits>);
    useAdminAccessMock.mockReturnValue({
      loading: false,
      isAdmin: false,
      isOwner: false,
      profile: null,
    });

    render(<MemberProfileScreen />);
    fireEvent.press(screen.getByTestId(testIds.memberProfile.careProgress));

    expect(routerPushMock).toHaveBeenCalledWith('/member/member-1/care-progress');
  });
});
