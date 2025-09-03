import { useState, useEffect, useCallback } from 'react';
import { ProductFilters, SearchResponse, FilterOption } from '../types/filters';
import { searchProducts, getFilterOptions } from '../utils/meilisearch';

export const useProductFilters = () => {
  const [filters, setFilters] = useState<ProductFilters>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalHits, setTotalHits] = useState<number>(0);
  const [filterOptions, setFilterOptions] = useState<Record<string, Record<string, number>>>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const options = await getFilterOptions();
        setFilterOptions(options);
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
        setError('Failed to load filter options');
      }
    };

    fetchFilterOptions();
  }, []);

  // Search products when filters or query change
  const performSearch = useCallback(async (
    query: string = searchQuery,
    currentFilters: ProductFilters = filters,
    page: number = currentPage
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: SearchResponse = await searchProducts(
        query,
        currentFilters,
        page,
        20 // items per page
      );
      
      setProducts(response.hits);
      setTotalHits(response.totalHits);
      
      // Update filter options based on current search results
      if (response.facetDistribution) {
        setFilterOptions(response.facetDistribution);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed. Please try again.');
      setProducts([]);
      setTotalHits(0);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, currentPage]);

  // Effect to trigger search when dependencies change
  useEffect(() => {
    performSearch();
  }, [searchQuery, filters, currentPage]);

  // Update search query
  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when search query changes
  }, []);

  // Update individual filter
  const updateFilter = useCallback((key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  // Add to array filter (for categories, collections, tags)
  const addToArrayFilter = useCallback((key: 'categories' | 'collections' | 'tags', value: string) => {
    setFilters(prev => {
      const currentArray = prev[key] || [];
      if (currentArray.includes(value)) {
        return prev; // Already included
      }
      return {
        ...prev,
        [key]: [...currentArray, value],
      };
    });
    setCurrentPage(1);
  }, []);

  // Remove from array filter
  const removeFromArrayFilter = useCallback((key: 'categories' | 'collections' | 'tags', value: string) => {
    setFilters(prev => {
      const currentArray = prev[key] || [];
      return {
        ...prev,
        [key]: currentArray.filter(item => item !== value),
      };
    });
    setCurrentPage(1);
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  // Clear specific filter
  const clearFilter = useCallback((key: keyof ProductFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
    setCurrentPage(1);
  }, []);

  // Get filter options as arrays for UI
  const getFilterOptionsArray = useCallback((key: string): FilterOption[] => {
    const options = filterOptions[key] || {};
    return Object.entries(options).map(([value, count]) => ({
      label: value.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value,
      count,
    }));
  }, [filterOptions]);

  return {
    // State
    filters,
    searchQuery,
    products,
    loading,
    totalHits,
    filterOptions,
    currentPage,
    error,
    
    // Actions
    updateSearchQuery,
    updateFilter,
    addToArrayFilter,
    removeFromArrayFilter,
    clearAllFilters,
    clearFilter,
    setCurrentPage,
    getFilterOptionsArray,
    performSearch,
  };
};