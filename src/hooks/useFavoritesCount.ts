import { useEffect, useState } from 'react'

export const useFavoritesCount = (): number => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // Function to get favorites count from localStorage
    const getFavoritesCount = () => {
      const savedFavorites = localStorage.getItem('novaskyn_favorites')
      if (savedFavorites) {
        try {
          const favoriteIds = JSON.parse(savedFavorites)
          setCount(Array.isArray(favoriteIds) ? favoriteIds.length : 0)
        } catch {
          setCount(0)
        }
      } else {
        setCount(0)
      }
    }

    // Get initial count
    getFavoritesCount()

    // Listen for storage changes (including from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'novaskyn_favorites') {
        getFavoritesCount()
      }
    }

    // Custom event for same-tab updates
    const handleFavoritesChange = () => {
      getFavoritesCount()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('favoritesUpdated', handleFavoritesChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('favoritesUpdated', handleFavoritesChange)
    }
  }, [])

  return count
}
