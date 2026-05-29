import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Pressable, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { useMember, useMembers } from '@/features/members';
import LogVisitScreen from '@/features/visits/screens/LogVisitScreen';
import { createCareAction } from '@/features/visits';
import { useAuth } from '@/lib/core/auth';
import { testIds } from '@/constants/testIds';
import { mockShowToast } from './test-harness';
import type { Member, MemberListRow } from '@/types/database';

const mockBack = jest.fn();

function MockMemberListItem({
  member,
  onPress,
  testID,
}: {
  member: MemberListRow;
  onPress?: () => void;
  testID?: string;
}) {
  return (
    <Pressable testID={testID} onPress={onPress}>
      <Text>{member.full_name}</Text>
    </Pressable>
  );
}

const fixtureMember: Member = {
  id: '2',
  organization_id: 'a0000000-0000-4000-8000-000000000001',
  full_name: 'Sipho Dlamini',
  phone: '+27 84 345 6789',
  email: null,
  address: null,
  risk_level: 'medium',
  status: 'new',
  care_stage: 'new',
  last_contact_at: null,
  notes: null,
  assigned_to: 'user-1',
  created_at: '2026-05-26T10:00:00.000Z',
  updated_at: '2026-05-26T10:00:00.000Z',
};
const fixtureMemberListRow: MemberListRow = {
  id: fixtureMember.id,
  organization_id: fixtureMember.organization_id,
  full_name: fixtureMember.full_name,
  phone: fixtureMember.phone,
  risk_level: fixtureMember.risk_level,
  status: fixtureMember.status,
  care_stage: fixtureMember.care_stage,
  last_contact_at: fixtureMember.last_contact_at,
  assigned_to: fixtureMember.assigned_to,
  created_at: fixtureMember.created_at,
};

jest.mock('expo-router', () => ({
  router: { back: (...args: unknown[]) => mockBack(...args) },
  useLocalSearchParams: jest.fn(),
}));

jest.mock('@/features/visits', () => ({
  createCareAction: jest.fn(),
}));

jest.mock('@/lib/core/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/features/members', () => ({
  useMember: jest.fn(),
  useMembers: jest.fn(),
  MemberListItem: MockMemberListItem,
}));

const useLocalSearchParamsMock = jest.mocked(useLocalSearchParams);
const useAuthMock = jest.mocked(useAuth);
const useMemberMock = jest.mocked(useMember);
const useMembersMock = jest.mocked(useMembers);
const createCareActionMock = jest.mocked(createCareAction);

function mockSignedInUser() {
  useAuthMock.mockReturnValue({
    user: { id: 'user-1', email: 'shepherd@example.com' },
    loading: false,
    signOut: jest.fn<() => Promise<void>>(),
  } as unknown as ReturnType<typeof useAuth>);
}

function mockNoRouteMember() {
  useLocalSearchParamsMock.mockReturnValue({});
  useMemberMock.mockReturnValue({
    data: null,
    loading: false,
    error: null,
    refresh: jest.fn<() => Promise<void>>(),
    lastLoadedAt: null,
    isStale: false,
  } as ReturnType<typeof useMember>);
}

function mockRouteMember(memberId = fixtureMember.id) {
  useLocalSearchParamsMock.mockReturnValue({ memberId });
  useMemberMock.mockReturnValue({
    data: fixtureMember,
    loading: false,
    error: null,
    refresh: jest.fn<() => Promise<void>>(),
    lastLoadedAt: Date.now(),
    isStale: false,
  } as ReturnType<typeof useMember>);
}

function mockMembersList(members: MemberListRow[] = [fixtureMemberListRow]) {
  useMembersMock.mockReturnValue({
    data: members,
    loading: false,
    error: null,
    refresh: jest.fn<() => Promise<void>>(),
    lastLoadedAt: Date.now(),
    isStale: false,
    page: 1,
    hasMore: false,
    loadingMore: false,
    loadMore: jest.fn<() => Promise<void>>(),
  } as unknown as ReturnType<typeof useMembers>);
}

describe('LogVisitScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createCareActionMock.mockReset();
    createCareActionMock.mockResolvedValue(undefined);
    mockSignedInUser();
  });

  it('shows member selection when no memberId route param is present', () => {
    mockNoRouteMember();
    mockMembersList();

    render(<LogVisitScreen />);

    expect(screen.getByTestId(testIds.logVisit.memberSearch)).toBeTruthy();
    expect(screen.getByTestId(testIds.people.member(fixtureMember.id))).toBeTruthy();
    expect(screen.queryByTestId(testIds.logVisit.save)).toBeNull();
  });

  it('selects a member from the list and reveals the save form', () => {
    mockNoRouteMember();
    mockMembersList();

    render(<LogVisitScreen />);
    fireEvent.press(screen.getByTestId(testIds.people.member(fixtureMember.id)));

    expect(screen.getByTestId(testIds.logVisit.save)).toBeTruthy();
    expect(screen.getByText('Sipho Dlamini')).toBeTruthy();
  });

  it('blocks save with invalid follow-up due date and does not call createCareAction', async () => {
    mockRouteMember();
    mockMembersList();

    render(<LogVisitScreen />);
    fireEvent.press(screen.getByText('Follow-up required'));
    fireEvent.changeText(screen.getByPlaceholderText('YYYY-MM-DD'), 'not-a-date');
    fireEvent.press(screen.getByTestId(testIds.logVisit.save));

    await waitFor(() => {
      expect(screen.getByText('Use YYYY-MM-DD format.')).toBeTruthy();
    });
    expect(createCareActionMock).not.toHaveBeenCalled();
  });

  it('saves successfully with follow-up metadata, toast, and router.back', async () => {
    mockRouteMember();
    mockMembersList();

    render(<LogVisitScreen />);
    fireEvent.press(screen.getByText('Follow-up required'));
    fireEvent.press(screen.getByText('visit'));
    fireEvent.changeText(screen.getByPlaceholderText('YYYY-MM-DD'), '2026-06-15');
    fireEvent.changeText(screen.getByPlaceholderText('HH:mm'), '09:30');
    fireEvent.changeText(screen.getByTestId(testIds.logVisit.notes), 'Pastoral check-in');
    fireEvent.press(screen.getByTestId(testIds.logVisit.save));

    await waitFor(() => {
      expect(createCareActionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          memberId: fixtureMember.id,
          visitType: 'visit',
          notes: 'Pastoral check-in',
          followUpRequired: true,
          followUpTitle: 'Visit Sipho Dlamini',
          followUpTaskType: 'visit',
          followUpDueDate: '2026-06-15',
          followUpDueAt: '2026-06-15T09:30:00.000Z',
        }),
      );
    });

    expect(mockShowToast).toHaveBeenCalledWith('Care action saved successfully.');
    expect(mockBack).toHaveBeenCalled();
  });

  it('keeps save disabled when the user is not signed in', () => {
    useAuthMock.mockReturnValue({
      user: null,
      loading: false,
      signOut: jest.fn<() => Promise<void>>(),
    } as unknown as ReturnType<typeof useAuth>);
    mockRouteMember();
    mockMembersList();

    render(<LogVisitScreen />);

    const saveButton = screen.getByTestId(testIds.logVisit.save);
    fireEvent.press(saveButton);

    expect(createCareActionMock).not.toHaveBeenCalled();
  });
});
