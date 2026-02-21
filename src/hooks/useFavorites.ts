// Hook for managing user favorites with backend persistence

import { useMutation, useQuery } from '@apollo/client'
import { useCallback, useMemo } from 'react'
// TODO: Fix GraphQL import path - favorites.graphql location needs to be determined
// import {
//   ADD_FAVORITE,
//   type AddFavoriteInput,
//   GET_MY_FAVORITES,
//   type GetMyFavoritesResponse,
//   REMOVE_FAVORITE,
//   type RemoveFavoriteInput,
// } from '../features/auth/graphql/favorites.graphql'

export interface UseFavoritesReturn {
  favoriteIds: string[]
  addFavorite: (productId: string) => Promise<void>
  removeFavorite: (productId: string) => Promise<void>
  toggleFavorite: (productId: string) => Promise<void>
  isFavorite: (productId: string) => boolean
  getFavoritesCount: () => number
  loading: boolean
  error: Error | undefined
}

/**
 * Hook for managing user favorites
 * Fetches favorites from backend and provides add/remove/toggle operations
 */
export const useFavorites = (): UseFavoritesReturn => {
  // Fetch user's favorites from backend
  const { data, loading, error, refetch } = useQuery<GetMyFavoritesResponse>(GET_MY_FAVORITES, {
    fetchPolicy: 'cache-and-network',
  })

  // Extract favorite product IDs
  const favoriteIds = useMemo(() => {
    if (!data?.myFavorites) return []
    return data.myFavorites.map((fav) => fav.productId)
  }, [data])

  // Add favorite mutation
  const [addFavoriteMutation, { loading: addLoading }] = useMutation(ADD_FAVORITE, {
    onCompleted: () => {
      refetch()
      // Dispatch event for other components
      window.dispatchEvent(new Event('favoritesUpdated'))
    },
    onError: (error) => {
      console.error('Failed to add favorite:', error)
    },
  })

  // Remove favorite mutation
  const [removeFavoriteMutation, { loading: removeLoading }] = useMutation(REMOVE_FAVORITE, {
    onCompleted: () => {
      refetch()
      // Dispatch event for other components
      window.dispatchEvent(new Event('favoritesUpdated'))
    },
    onError: (error) => {
      console.error('Failed to remove favorite:', error)
    },
  })

  // Add favorite function
  const addFavorite = useCallback(
    async (productId: string) => {
      if (favoriteIds.includes(productId)) {
        return // Already favorited
      }
      await addFavoriteMutation({
        variables: {
          input: { productId } as AddFavoriteInput,
        },
      })
    },
    [addFavoriteMutation, favoriteIds]
  )

  // Remove favorite function
  const removeFavorite = useCallback(
    async (productId: string) => {
      await removeFavoriteMutation({
        variables: {
          input: { productId } as RemoveFavoriteInput,
        },
      })
    },
    [removeFavoriteMutation]
  )

  // Toggle favorite function
  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (favoriteIds.includes(productId)) {
        await removeFavorite(productId)
      } else {
        await addFavorite(productId)
      }
    },
    [favoriteIds, addFavorite, removeFavorite]
  )

  // Check if product is favorited
  const isFavorite = useCallback(
    (productId: string) => {
      return favoriteIds.includes(productId)
    },
    [favoriteIds]
  )

  // Get favorites count
  const getFavoritesCount = useCallback(() => {
    return favoriteIds.length
  }, [favoriteIds])

  return {
    favoriteIds,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    getFavoritesCount,
    loading: loading || addLoading || removeLoading,
    error: error as Error | undefined,
  }
}
