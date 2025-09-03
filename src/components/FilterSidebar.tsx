import React, { useState } from 'react';
import { ProductFilters, FilterOption, PriceRange } from '../types/filters';

interface FilterSidebarProps {
  filters: ProductFilters;
  filterOptions: Record<string, Record<string, number>>;
  onFilterChange: (key: keyof ProductFilters, value: any) => void;
  onAddToArrayFilter: (key: 'categories' | 'collections' | 'tags', value: string) => void;
  onRemoveFromArrayFilter: (key: 'categories' | 'collections' | 'tags', value: string) => void;
  onClearAllFilters: () => void;
  onClearFilter: (key: keyof ProductFilters) => void;
  getFilterOptionsArray: (key: string) => FilterOption[];
  loading?: boolean;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  filterOptions,
  onFilterChange,
  onAddToArrayFilter,
  onRemoveFromArrayFilter,
  onClearAllFilters,
  onClearFilter,
  getFilterOptionsArray,
  loading = false,
}) => {
  const [priceRange, setPriceRange] = useState<PriceRange>({
    min: filters.priceRange?.min || 0,
    max: filters.priceRange?.max || 10000,
  });

  const handlePriceRangeChange = (type: 'min' | 'max', value: number) => {
    const newRange = { ...priceRange, [type]: value };
    setPriceRange(newRange);
    onFilterChange('priceRange', newRange);
  };

  const hasActiveFilters = () => {
    return (
      (filters.categories && filters.categories.length > 0) ||
      (filters.collections && filters.collections.length > 0) ||
      (filters.tags && filters.tags.length > 0) ||
      filters.priceRange ||
      filters.inStock !== undefined
    );
  };

  return (
    <div className="filter-sidebar">
      <div className="filter-header">
        <h3>Filters</h3>
        {hasActiveFilters() && (
          <button
            onClick={onClearAllFilters}
            className="clear-all-btn"
            disabled={loading}
          >
            Clear All
          </button>
        )}
      </div>

      {loading && <div className="filter-loading">Loading filters...</div>}

      {/* Categories Filter */}
      <div className="filter-section">
        <div className="filter-section-header">
          <h4>Categories</h4>
          {filters.categories && filters.categories.length > 0 && (
            <button
              onClick={() => onClearFilter('categories')}
              className="clear-section-btn"
            >
              Clear
            </button>
          )}
        </div>
        <div className="filter-options">
          {getFilterOptionsArray('categories.handle').map((option) => (
            <label key={option.value} className="filter-option">
              <input
                type="checkbox"
                checked={filters.categories?.includes(option.value) || false}
                onChange={(e) => {
                  if (e.target.checked) {
                    onAddToArrayFilter('categories', option.value);
                  } else {
                    onRemoveFromArrayFilter('categories', option.value);
                  }
                }}
                disabled={loading}
              />
              <span className="filter-label">
                {option.label}
                {option.count && <span className="filter-count">({option.count})</span>}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Collections Filter */}
      <div className="filter-section">
        <div className="filter-section-header">
          <h4>Collections</h4>
          {filters.collections && filters.collections.length > 0 && (
            <button
              onClick={() => onClearFilter('collections')}
              className="clear-section-btn"
            >
              Clear
            </button>
          )}
        </div>
        <div className="filter-options">
          {getFilterOptionsArray('collection.handle').map((option) => (
            <label key={option.value} className="filter-option">
              <input
                type="checkbox"
                checked={filters.collections?.includes(option.value) || false}
                onChange={(e) => {
                  if (e.target.checked) {
                    onAddToArrayFilter('collections', option.value);
                  } else {
                    onRemoveFromArrayFilter('collections', option.value);
                  }
                }}
                disabled={loading}
              />
              <span className="filter-label">
                {option.label}
                {option.count && <span className="filter-count">({option.count})</span>}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Tags Filter */}
      <div className="filter-section">
        <div className="filter-section-header">
          <h4>Tags</h4>
          {filters.tags && filters.tags.length > 0 && (
            <button
              onClick={() => onClearFilter('tags')}
              className="clear-section-btn"
            >
              Clear
            </button>
          )}
        </div>
        <div className="filter-options">
          {getFilterOptionsArray('tags.value').slice(0, 10).map((option) => (
            <label key={option.value} className="filter-option">
              <input
                type="checkbox"
                checked={filters.tags?.includes(option.value) || false}
                onChange={(e) => {
                  if (e.target.checked) {
                    onAddToArrayFilter('tags', option.value);
                  } else {
                    onRemoveFromArrayFilter('tags', option.value);
                  }
                }}
                disabled={loading}
              />
              <span className="filter-label">
                {option.label}
                {option.count && <span className="filter-count">({option.count})</span>}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="filter-section">
        <div className="filter-section-header">
          <h4>Price Range</h4>
          {filters.priceRange && (
            <button
              onClick={() => onClearFilter('priceRange')}
              className="clear-section-btn"
            >
              Clear
            </button>
          )}
        </div>
        <div className="price-range-inputs">
          <div className="price-input-group">
            <label>Min Price</label>
            <input
              type="number"
              value={priceRange.min}
              onChange={(e) => handlePriceRangeChange('min', Number(e.target.value))}
              min="0"
              disabled={loading}
              className="price-input"
            />
          </div>
          <div className="price-input-group">
            <label>Max Price</label>
            <input
              type="number"
              value={priceRange.max}
              onChange={(e) => handlePriceRangeChange('max', Number(e.target.value))}
              min="0"
              disabled={loading}
              className="price-input"
            />
          </div>
        </div>
      </div>

      {/* In Stock Filter */}
      <div className="filter-section">
        <label className="filter-option">
          <input
            type="checkbox"
            checked={filters.inStock || false}
            onChange={(e) => onFilterChange('inStock', e.target.checked ? true : undefined)}
            disabled={loading}
          />
          <span className="filter-label">In Stock Only</span>
        </label>
      </div>

      {/* Sort Options */}
      <div className="filter-section">
        <h4>Sort By</h4>
        <select
          value={filters.sortBy || 'created_at'}
          onChange={(e) => onFilterChange('sortBy', e.target.value)}
          disabled={loading}
          className="sort-select"
        >
          <option value="created_at">Newest First</option>
          <option value="updated_at">Recently Updated</option>
          <option value="title">Name (A-Z)</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>
    </div>
  );
};

export default FilterSidebar;