import React from 'react';
import ProductListing from '../components/ProductListing';
import '../styles/ProductListing.css';

const ProductListingPage: React.FC = () => {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Products</h1>
        <p>Discover our amazing collection of products</p>
      </header>
      
      <ProductListing />
    </div>
  );
};

export default ProductListingPage;