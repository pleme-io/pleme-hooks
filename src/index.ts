/**
 * Main entry point for the library
 *
 * This file serves as a barrel export for all public APIs.
 * Only export what should be part of the public API.
 */

// Data hooks
export * from './hooks/useDataFetch';
export * from './hooks/useInfiniteScroll';
export * from './hooks/useFavorites';
export * from './hooks/useFavoritesCount';
export * from './hooks/useAutoSave';

// UI hooks
export * from './hooks/useModal';
export * from './hooks/useToggle';
export * from './hooks/useLocalStorage';
export * from './hooks/useClickOutside';
export * from './hooks/useCopyToClipboard';
export * from './hooks/useConfetti';
export * from './hooks/useFeatureFlag';
export * from './hooks/useMediaQuery';
export * from './hooks/useErrorBoundary';

// Effect hooks
export * from './hooks/useMagneticHover';
export * from './hooks/useScrollAnimation';
export * from './hooks/useDebounce';
export * from './hooks/useTextScramble';

// Machines
export * from './machines/copyToClipboard.machine';
export * from './machines/dataFetch.machine';
export * from './machines/debounce.machine';
export * from './machines/infiniteScroll.machine';
export * from './machines/localStorage.machine';
export * from './machines/modal.machine';
export * from './machines/search.machine';
