// ── src/hooks/index.js ───────────────────────────────────────────────────

export { useAuth, useCurrentUser, useRequireAuth, useRole, useProfile, useAuthActions, useSubscription, useSession, useAuthState, useAuthError, useAuthFull } from './useAuth';
export { useDebounce, useDebouncedCallback, useThrottle, useThrottledCallback } from './useDebounce';
export { useDocumentTitle, usePageTitle, useTitleTemplate, useMetaTags } from './useDocumentTitle';
export { useIntersectionObserver, useInView, useLazyLoad, useStaggerAnimation, useScrollSpy } from './useIntersectionObserver';
export { useKeyboardShortcut, useKeySequence, useShortcutList } from './useKeyboardShortcut';
export { useLocalStorage, useLocalStorageState, useLocalStorageWithExpiry, useLocalStorageRecord } from './useLocalStorage';
export { useMediaQuery, useBreakpoints, useReducedMotion, useColorScheme, useResponsive, useWindowSize, useDeviceDetection } from './useMediaQuery';
export { useOnlineStatus, useNetworkQuality, useConnectionAware } from './useOnlineStatus';
export { useScrollDirection, useScrollPosition, useScrollProgress, useScrollToTop, useInfiniteScroll, useScrollLock } from './useScrollDirection';