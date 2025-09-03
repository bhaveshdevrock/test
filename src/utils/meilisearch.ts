import { MeiliSearch } from 'meilisearch';
import { ProductFilters, SearchResponse } from '../types/filters';

// Initialize MeiliSearch client
const client = new MeiliSearch({
  host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST || 'http://127.0.0.1:7700',
  apiKey: process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY,
});

export const searchProducts = async (
  query: string = '',
  filters: ProductFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<SearchResponse> => {
  try {
    const index = client.index('products');
    
    // Build filter conditions
    const filterConditions: string[] = [];
    
    // Category filters
    if (filters.categories && filters.categories.length > 0) {
      const categoryFilter = filters.categories
        .map(category => `categories.handle = "${category}"`)
        .join(' OR ');
      filterConditions.push(`(${categoryFilter})`);
    }
    
    // Collection filters
    if (filters.collections && filters.collections.length > 0) {
      const collectionFilter = filters.collections
        .map(collection => `collection.handle = "${collection}"`)
        .join(' OR ');
      filterConditions.push(`(${collectionFilter})`);
    }
    
    // Tag filters
    if (filters.tags && filters.tags.length > 0) {
      const tagFilter = filters.tags
        .map(tag => `tags.value = "${tag}"`)
        .join(' OR ');
      filterConditions.push(`(${tagFilter})`);
    }
    
    // Price range filter
    if (filters.priceRange) {
      if (filters.priceRange.min !== undefined) {
        filterConditions.push(`variants.prices.amount >= ${filters.priceRange.min}`);
      }
      if (filters.priceRange.max !== undefined) {
        filterConditions.push(`variants.prices.amount <= ${filters.priceRange.max}`);
      }
    }
    
    // Stock filter
    if (filters.inStock !== undefined) {
      filterConditions.push(`variants.inventory_quantity > 0`);
    }
    
    // Combine all filter conditions
    const filterQuery = filterConditions.length > 0 
      ? filterConditions.join(' AND ') 
      : undefined;
    
    // Build sort options
    let sort: string[] = [];
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc':
          sort = ['variants.prices.amount:asc'];
          break;
        case 'price_desc':
          sort = ['variants.prices.amount:desc'];
          break;
        case 'created_at':
          sort = ['created_at:desc'];
          break;
        case 'updated_at':
          sort = ['updated_at:desc'];
          break;
        case 'title':
          sort = ['title:asc'];
          break;
        default:
          sort = ['created_at:desc'];
      }
    }
    
    const searchParams = {
      q: query,
      filter: filterQuery,
      facets: [
        'categories.handle',
        'collection.handle',
        'tags.value',
        'variants.prices.currency_code',
      ],
      limit,
      offset: (page - 1) * limit,
      sort: sort.length > 0 ? sort : undefined,
    };
    
    const result = await index.search(query, searchParams);
    
    return {
      hits: result.hits,
      totalHits: result.estimatedTotalHits || 0,
      facetDistribution: result.facetDistribution,
    };
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

export const getFilterOptions = async () => {
  try {
    const index = client.index('products');
    
    // Get facet distribution to build filter options
    const result = await index.search('', {
      facets: [
        'categories.handle',
        'categories.name',
        'collection.handle',
        'collection.title',
        'tags.value',
        'type.value',
      ],
      limit: 0, // We only want facets, not actual results
    });
    
    return result.facetDistribution || {};
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return {};
  }
};

export default client;