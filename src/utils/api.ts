// API utility functions for Medusa backend integration

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';

export const medusaClient = {
  // Fetch products from Medusa backend
  products: {
    list: async (params?: Record<string, any>) => {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => queryParams.append(key, v));
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }
      
      const response = await fetch(
        `${MEDUSA_BACKEND_URL}/store/products?${queryParams.toString()}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      return response.json();
    },
    
    retrieve: async (id: string) => {
      const response = await fetch(
        `${MEDUSA_BACKEND_URL}/store/products/${id}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      
      return response.json();
    },
  },
  
  // Fetch collections
  collections: {
    list: async () => {
      const response = await fetch(
        `${MEDUSA_BACKEND_URL}/store/collections`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch collections');
      }
      
      return response.json();
    },
  },
  
  // Fetch product categories
  categories: {
    list: async () => {
      const response = await fetch(
        `${MEDUSA_BACKEND_URL}/store/product-categories`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      return response.json();
    },
  },
};

export default medusaClient;