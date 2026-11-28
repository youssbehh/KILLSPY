/**
 * Shared expo-router mock: `jest.mock('expo-router', () => require('@/src/test/routerMock').routerMock)`.
 * Navigation calls are recorded on `router` so tests can assert them.
 */
export const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) };

export const routerMock = {
  useRouter: () => router,
  useSegments: () => [],
  usePathname: () => '/',
  useLocalSearchParams: () => ({}),
  useRootNavigationState: () => ({ key: 'root' }),
  Stack: { Screen: () => null },
  Link: ({ children }: { children: unknown }) => children,
};
