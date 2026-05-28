import { describe, expect, it } from '@jest/globals';
import { renderRouter, waitFor } from 'expo-router/testing-library';
import { View } from 'react-native';

import LegacySignUpRoute from '@/app/sign-up';

function AccessRequestPlaceholder() {
  return <View />;
}

describe('/sign-up redirect', () => {
  it('resolves to /access-request by pathname', async () => {
    const { getPathname } = renderRouter(
      {
        'sign-up': LegacySignUpRoute,
        'access-request': AccessRequestPlaceholder,
      },
      { initialUrl: '/sign-up' },
    );

    await waitFor(() => {
      expect(getPathname()).toBe('/access-request');
    });
  });
});
