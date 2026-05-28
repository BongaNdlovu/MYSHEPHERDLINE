import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import AccessRequestScreen from '@/features/auth/screens/AccessRequestScreen';
import { submitAccessRequest } from '@/features/account/services/profile-preferences.service';
import { testIds } from '@/constants/testIds';
import { AppException, createAppError } from '@/lib/core/errors';
import { useQuery } from '@/lib/core/useQuery';
import type { AccessRequest } from '@/types/database';
import { mockShowToast } from './test-harness';

const mockReplace = jest.fn();

function MockDistrictCongregationPicker({
  onDistrictChange,
  onOrganizationChange,
  districtTestId,
  congregationTestId,
}: {
  onDistrictChange: (id: string | null) => void;
  onOrganizationChange: (id: string | null) => void;
  districtTestId?: string;
  congregationTestId?: string;
}) {
  return (
    <View>
      <Pressable testID={districtTestId} onPress={() => onDistrictChange('district-1')} />
      <Pressable testID={congregationTestId} onPress={() => onOrganizationChange('org-1')} />
    </View>
  );
}

jest.mock('expo-router', () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/features/account/services/profile-preferences.service', () => ({
  submitAccessRequest: jest.fn(),
}));

jest.mock('@/features/account/components/DistrictCongregationPicker', () => ({
  DistrictCongregationPicker: MockDistrictCongregationPicker,
}));

const submitAccessRequestMock = jest.mocked(submitAccessRequest);

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function QueryProbe({ enabled, fetch }: { enabled: boolean; fetch: () => Promise<string[]> }) {
  const query = useQuery({
    deps: [enabled],
    enabled,
    errorMessage: 'Unable to load data.',
    initialData: [] as string[],
    fetch,
    dataLength: (rows) => rows.length,
  });

  return (
    <Text testID="query-state">
      {JSON.stringify({ data: query.data, loading: query.loading, error: query.error })}
    </Text>
  );
}

function fillValidIdentity() {
  fireEvent.changeText(screen.getByTestId(testIds.auth.displayName), 'Jane Shepherd');
  fireEvent.changeText(screen.getByTestId(testIds.auth.signUpEmail), 'jane@example.com');
}

function selectDistrictAndCongregation() {
  fireEvent.press(screen.getByTestId(testIds.auth.signUpDistrict));
  fireEvent.press(screen.getByTestId(testIds.auth.signUpCongregation));
}

describe('AccessRequestScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    submitAccessRequestMock.mockReset();
  });

  it('shows validation error on empty submit', async () => {
    render(<AccessRequestScreen />);
    fireEvent.press(screen.getByTestId(testIds.auth.signUpSubmit));

    await waitFor(() => {
      expect(screen.getAllByText('Display name is required.').length).toBeGreaterThan(0);
    });
    expect(submitAccessRequestMock).not.toHaveBeenCalled();
  });

  it('shows selection error when district and congregation are missing', async () => {
    render(<AccessRequestScreen />);
    fillValidIdentity();
    fireEvent.press(screen.getByTestId(testIds.auth.signUpSubmit));

    await waitFor(() => {
      expect(screen.getByText('Select your district and conference/congregation.')).toBeTruthy();
    });
    expect(submitAccessRequestMock).not.toHaveBeenCalled();
  });

  it('submits successfully, shows success state, and can navigate to sign-in', async () => {
    submitAccessRequestMock.mockResolvedValue({ id: 'access-req-1' } as AccessRequest);
    render(<AccessRequestScreen />);

    fillValidIdentity();
    selectDistrictAndCongregation();
    fireEvent.changeText(screen.getByTestId(testIds.auth.signUpMessage), 'Elder in Durban Central');
    fireEvent.press(screen.getByTestId(testIds.auth.signUpSubmit));

    await waitFor(() => {
      expect(submitAccessRequestMock).toHaveBeenCalledWith({
        email: 'jane@example.com',
        displayName: 'Jane Shepherd',
        preferredDistrictId: 'district-1',
        preferredOrganizationId: 'org-1',
        message: 'Elder in Durban Central',
      });
    });

    expect(mockShowToast).toHaveBeenCalledWith('Access request submitted.');
    expect(screen.getByText('Request received')).toBeTruthy();

    fireEvent.press(screen.getByText('Back to Sign In'));
    expect(mockReplace).toHaveBeenCalledWith('/sign-in');
  });

  it('shows inline error and restores submit button after rejection', async () => {
    submitAccessRequestMock.mockRejectedValue(
      new AppException(createAppError('validation', 'Request already pending.')),
    );
    render(<AccessRequestScreen />);

    fillValidIdentity();
    selectDistrictAndCongregation();
    fireEvent.press(screen.getByTestId(testIds.auth.signUpSubmit));

    await waitFor(() => {
      expect(screen.getByText('Request already pending.')).toBeTruthy();
    });

    expect(screen.getByText('Submit access request')).toBeTruthy();
    expect(screen.queryByText('Submitting...')).toBeNull();
  });

  it('ignores an in-flight useQuery result after enabled flips false', async () => {
    const deferred = createDeferred<string[]>();
    const fetch = jest.fn(() => deferred.promise);
    const view = render(<QueryProbe enabled fetch={fetch} />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    view.rerender(<QueryProbe enabled={false} fetch={fetch} />);

    await waitFor(() => {
      expect(String(screen.getByTestId('query-state').props.children)).toContain('"loading":false');
      expect(String(screen.getByTestId('query-state').props.children)).toContain('"data":[]');
    });

    deferred.resolve(['stale-result']);

    await waitFor(() => {
      expect(String(screen.getByTestId('query-state').props.children)).not.toContain('stale-result');
    });
  });
});
