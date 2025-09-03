import React from 'react';
import { useProductFilters } from '../hooks/useProductFilters';
import FilterSidebar from './FilterSidebar';
import ProductGrid from './ProductGrid';
import SearchBar from './SearchBar';
import Pagination from './Pagination';

const ProductListing: React.FC = () => {
  const {
    filters,
    searchQuery,
    products,
    loading,
    totalHits,
    filterOptions,
    currentPage,
    error,
    updateSearchQuery,
    updateFilter,
    addToArrayFilter,
    removeFromArrayFilter,
    clearAllFilters,
    clearFilter,
    setCurrentPage,
    getFilterOptionsArray,
  } = useProductFilters();

  const totalPages = Math.ceil(totalHits / 20);

  return (
    <div className="product-listing-container">
      {/* Search Bar */}
      <div className="search-section">
        <SearchBar
          value={searchQuery}
          onChange={updateSearchQuery}
          placeholder="Search products..."
          loading={loading}
        />
      </div>

      <div className="listing-content">
        {/* Left Sidebar with Filters */}
        <aside className="filters-sidebar">
          <FilterSidebar
            filters={filters}
            filterOptions={filterOptions}
            onFilterChange={updateFilter}
            onAddToArrayFilter={addToArrayFilter}
            onRemoveFromArrayFilter={removeFromArrayFilter}
            onClearAllFilters={clearAllFilters}
            onClearFilter={clearFilter}
            getFilterOptionsArray={getFilterOptionsArray}
            loading={loading}
          />
        </aside>

        {/* Main Content Area */}
        <main className="products-main">
          {/* Results Header */}
          <div className="results-header">
            <div className="results-info">
              {loading ? (
                <span>Searching...</span>
              ) : (
                <span>
                  {totalHits} product{totalHits !== 1 ? 's' : ''} found
                  {searchQuery && ` for "${searchQuery}"`}
                </span>
              )}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          )}

          {/* Products Grid */}
          <ProductGrid 
            products={products} 
            loading={loading}
            error={error}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              loading={loading}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductListing;