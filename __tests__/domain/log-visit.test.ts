import { describe, expect, it } from 'vitest';

import { suggestedCareStage, titleForFollowUp } from '@/features/visits/selectors/log-visit';

describe('log visit selectors', () => {
  it('suggests care stages for the supported action types', () => {
    expect(suggestedCareStage('call')).toBe('contacted');
    expect(suggestedCareStage('whatsapp')).toBe('contacted');
    expect(suggestedCareStage('prayer')).toBe('contacted');
    expect(suggestedCareStage('visit')).toBe('visited');
    expect(suggestedCareStage('home_visit')).toBe('visited');
    expect(suggestedCareStage('pastoral_visit')).toBe('visited');
    expect(suggestedCareStage('bible_study')).toBe('bible_study');
    expect(suggestedCareStage('baptism_prep')).toBe('baptism_interest');
    expect(suggestedCareStage('other')).toBeNull();
  });

  it('builds human-readable follow-up titles from task types', () => {
    expect(titleForFollowUp('check_in', 'Sipho Dlamini')).toBe('Check in Sipho Dlamini');
    expect(titleForFollowUp('bible_study', 'Ayanda')).toBe('Bible study Ayanda');
  });
});
