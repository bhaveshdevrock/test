import React from 'react';

interface Product {
  id: string;
  title: string;
  description?: string;
  handle: string;
  variants?: Array<{
    id: string;
    title: string;
    prices?: Array<{
      amount: number;
      currency_code: string;
    }>;
  }>;
  collection?: {
    title: string;
    handle: string;
  };
  categories?: Array<{
    name: string;
    handle: string;
  }>;
  tags?: Array<{
    value: string;
  }>;
}

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  error?: string | null;
}

const ProductGrid: React.FC<ProductGridProps> = ({ 
  products, 
  loading = false, 
  error = null 
}) => {
  const formatPrice = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
    }).format(amount / 100); // Assuming amount is in cents
  };

  const getLowestPrice = (product: Product) => {
    if (!product.variants || product.variants.length === 0) return null;
    
    let lowestPrice = null;
    let currency = 'USD';
    
    product.variants.forEach(variant => {
      if (variant.prices && variant.prices.length > 0) {
        variant.prices.forEach(price => {
          if (!lowestPrice || price.amount < lowestPrice) {
            lowestPrice = price.amount;
            currency = price.currency_code;
          }
        });
      }
    });
    
    return lowestPrice ? formatPrice(lowestPrice, currency) : null;
  };

  if (loading) {
    return (
      <div className="product-grid loading">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="product-card skeleton">
            <div className="product-image-skeleton"></div>
            <div className="product-info-skeleton">
              <div className="product-title-skeleton"></div>
              <div className="product-price-skeleton"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>Something went wrong while loading products.</p>
        <p>{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📦</div>
        <h3>No products found</h3>
        <p>Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <div key={product.id} className="product-card">
          <div className="product-image">
            <img
              src={`https://via.placeholder.com/300x300?text=${encodeURIComponent(product.title)}`}
              alt={product.title}
              loading="lazy"
            />
          </div>
          <div className="product-info">
            <h3 className="product-title">{product.title}</h3>
            {product.description && (
              <p className="product-description">
                {product.description.substring(0, 100)}
                {product.description.length > 100 && '...'}
              </p>
            )}
            <div className="product-price">
              {getLowestPrice(product) || 'Price not available'}
            </div>
            <div className="product-meta">
              {product.collection && (
                <span className="product-collection">
                  {product.collection.title}
                </span>
              )}
              {product.categories && product.categories.length > 0 && (
                <div className="product-categories">
                  {product.categories.slice(0, 2).map((category, index) => (
                    <span key={category.handle} className="product-category">
                      {category.name}
                    </span>
                  ))}
                  {product.categories.length > 2 && (
                    <span className="category-more">
                      +{product.categories.length - 2} more
                    </span>
                  )}
                </div>
              )}
            </div>
            <button className="add-to-cart-btn">
              Add to Cart
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;