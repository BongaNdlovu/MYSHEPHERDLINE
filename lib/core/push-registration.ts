export function shouldRegisterPushForSession(input: {
  userId: string | null;
  accessToken: string | null;
  lastRegisteredUserId: string | null;
  inFlightUserId: string | null;
}) {
  if (!input.userId || !input.accessToken) return false;
  if (input.lastRegisteredUserId === input.userId) return false;
  if (input.inFlightUserId === input.userId) return false;
  return true;
}
