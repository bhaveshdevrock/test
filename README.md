# Medusa MeiliSearch Filter Sidebar Implementation

This implementation shows how to create a filter sidebar for your product listing page using the `@rokmohar/medusa-plugin-meilisearch` plugin.

## Features

- ✅ Left sidebar with multiple filter options
- ✅ Category, Collection, and Tag filtering
- ✅ Price range filtering
- ✅ In-stock filtering
- ✅ Sorting options
- ✅ Real-time search with MeiliSearch
- ✅ Responsive design
- ✅ Loading states and error handling
- ✅ Faceted search with result counts

## Setup Instructions

### 1. Backend Configuration

Ensure your `medusa-config.js` includes the MeiliSearch plugin with proper filterable attributes:

```javascript
{
  resolve: "@rokmohar/medusa-plugin-meilisearch",
  options: {
    config: {
      host: process.env.MEILISEARCH_HOST,
      apiKey: process.env.MEILISEARCH_API_KEY,
    },
    settings: {
      products: {
        indexSettings: {
          filterableAttributes: [
            "categories.handle",
            "collection.handle", 
            "tags.value",
            "variants.prices.amount",
            "variants.prices.currency_code",
            "type.value",
            "status"
          ],
          sortableAttributes: [
            "created_at",
            "updated_at", 
            "title",
            "variants.prices.amount"
          ]
        }
      }
    }
  }
}
```

### 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Update the values in `.env` with your actual configuration.

### 3. Install Dependencies

```bash
npm install
```

### 4. Usage in Your Application

```tsx
import ProductListingPage from './src/pages/ProductListingPage';

function App() {
  return (
    <div className="App">
      <ProductListingPage />
    </div>
  );
}
```

## Component Structure

### Main Components

- **`ProductListing`**: Main container component that orchestrates the entire listing page
- **`FilterSidebar`**: Left sidebar with all filter options
- **`ProductGrid`**: Grid layout for displaying products
- **`SearchBar`**: Search input with loading states
- **`Pagination`**: Navigation between result pages

### Hooks

- **`useProductFilters`**: Custom hook that manages all filter state and MeiliSearch integration

### Utilities

- **`meilisearch.ts`**: MeiliSearch client configuration and search functions
- **`api.ts`**: Medusa backend API integration utilities

## Filter Types Supported

1. **Categories**: Multi-select checkboxes
2. **Collections**: Multi-select checkboxes  
3. **Tags**: Multi-select checkboxes
4. **Price Range**: Min/max input fields
5. **Stock Status**: In-stock toggle
6. **Sorting**: Dropdown with multiple sort options

## Customization

### Adding New Filter Types

1. Update the `ProductFilters` interface in `src/types/filters.ts`
2. Add the new filterable attribute to `medusa-config.js`
3. Update the search logic in `src/utils/meilisearch.ts`
4. Add the UI component to `FilterSidebar.tsx`

### Styling

The CSS is modular and uses CSS custom properties. You can easily customize:

- Colors by updating CSS variables
- Layout by modifying grid properties
- Component spacing and sizing
- Responsive breakpoints

### Advanced Features

The implementation supports:

- **Faceted Search**: Shows result counts for each filter option
- **URL State Management**: Can be extended to sync filters with URL params
- **Debounced Search**: Prevents excessive API calls during typing
- **Error Handling**: Graceful error states with retry options
- **Loading States**: Skeleton loading and disabled states

## Integration with Existing Codebase

To integrate this into your existing Medusa storefront:

1. Copy the relevant components to your components directory
2. Update import paths to match your project structure
3. Integrate with your existing routing system
4. Customize styling to match your design system
5. Add any additional filter types specific to your products

## Performance Considerations

- Filters are debounced to prevent excessive API calls
- Results are paginated (20 items per page by default)
- Facet data is cached and updated with search results
- Skeleton loading provides immediate feedback

## Troubleshooting

### Common Issues

1. **No filter options showing**: Ensure filterable attributes are configured in MeiliSearch settings
2. **Search not working**: Check MeiliSearch connection and API keys
3. **Filters not applying**: Verify filter syntax matches MeiliSearch filter format
4. **Performance issues**: Consider adjusting pagination size and debounce timing

### Debug Mode

Enable debug logging by adding to your environment:

```bash
DEBUG=meilisearch*
```

This will log all MeiliSearch queries and responses for debugging.