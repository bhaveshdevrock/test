export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface ProductFilters {
  categories?: string[];
  collections?: string[];
  tags?: string[];
  priceRange?: PriceRange;
  inStock?: boolean;
  sortBy?: 'created_at' | 'updated_at' | 'title' | 'price_asc' | 'price_desc';
}

export interface FilterSection {
  title: string;
  type: 'checkbox' | 'radio' | 'range' | 'toggle';
  key: keyof ProductFilters;
  options?: FilterOption[];
  min?: number;
  max?: number;
}

export interface SearchResponse {
  hits: any[];
  totalHits: number;
  facetDistribution?: Record<string, Record<string, number>>;
}