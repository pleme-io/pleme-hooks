import { gql, useQuery } from '@apollo/client'

const IS_FEATURE_ENABLED = gql`
  query IsFeatureEnabled($flagKey: String!, $userId: UUID, $companyId: UUID) {
    isFeatureEnabled(flagKey: $flagKey, userId: $userId, companyId: $companyId)
  }
`

/**
 * Hook to check if a feature flag is enabled
 *
 * @param flagKey - The feature flag key (e.g., 'group_sessions_enabled')
 * @returns boolean - True if feature is enabled, false otherwise
 *
 * @example
 * const groupSessionsEnabled = useFeatureFlag('group_sessions_enabled');
 * if (!groupSessionsEnabled) return null; // Hide feature
 */
export function useFeatureFlag(flagKey: string): boolean {
  const { data, loading } = useQuery(IS_FEATURE_ENABLED, {
    variables: { flagKey },
    fetchPolicy: 'cache-first', // Cache for 60 seconds
  })

  // Default to disabled while loading
  if (loading) return false

  return data?.isFeatureEnabled ?? false
}

/**
 * Hook to check multiple feature flags at once
 *
 * @param flagKeys - Array of feature flag keys
 * @returns Record<string, boolean> - Object mapping flag keys to enabled status
 *
 * @example
 * const flags = useFeatureFlags(['group_sessions_enabled', 'subscriptions_enabled']);
 * if (flags.group_sessions_enabled) { ... }
 */
export function useFeatureFlags(flagKeys: string[]): Record<string, boolean> {
  // TODO: Implement batched query for multiple flags
  // For now, return all flags as disabled
  return flagKeys.reduce(
    (acc, key) => {
      acc[key] = false
      return acc
    },
    {} as Record<string, boolean>
  )
}
