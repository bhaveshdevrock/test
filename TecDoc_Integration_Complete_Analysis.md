# TecDoc Integration - Complete Analysis & Documentation

## Executive Summary

The ASV B2B website integrates with TecDoc, a global vehicle and parts database, to provide accurate vehicle identification and parts information. This integration allows customers to search for vehicles using license plate numbers and automatically displays compatible parts and products.

**Key Features:**
- Vehicle identification by license plate number
- Multi-layer caching strategy for performance
- Automatic parts compatibility checking
- Custom product filtering based on vehicle specifications
- Integration with Magento e-commerce platform

## System Overview

### Technology Stack
- **Backend**: Magento 2 with custom extensions
- **External API**: TecDoc Web Service (Pegasus 3.0)
- **Caching**: Redis + Database caching
- **Frontend**: Custom vehicle search interface
- **Product Filtering**: Amasty Shopby extension

### Key Extensions
1. **Asv_VinSearch**: Main vehicle search functionality
2. **Asv_Redis**: Redis caching layer
3. **Asv_ImportCatalog**: Catalog management
4. **Amasty_Shopby**: Product filtering and display

## Complete Process Flow

### Phase 1: Vehicle Identification
```
User Input (Plate + State) → Cache Check → TecDoc API → Vehicle Data
```

### Phase 2: VIN Processing  
```
Extract VIN → VIN Cache Check → TecDoc VIN API → Extended Vehicle Data
```

### Phase 3: Parts Discovery
```
Vehicle carId → Articles API → Brand Mapping → SKU Resolution → Redis Cache
```

### Phase 4: Product Display
```
Customer Login Check → SKU Filtering → Custom Logic → Filtered Products
```

## Detailed Technical Flow

### Step 1: Plate Number Search
**Input**: Plate number (e.g., "PL8888") + State (e.g., "NSW")

**Process**:
1. Check `plate_search_result_cache` table
2. If cache miss or expired (>30 days or >20 lookups), call TecDoc API
3. API: `getVehiclesByKeyNumberPlates`
4. Save result to cache with lookup_count = 1

**API Payload**:
```json
{
  "getVehiclesByKeyNumberPlates": {
    "country": "AU",
    "details": true,
    "keySystemNumber": "pl8888-nsw",
    "keySystemType": 75,
    "lang": "qb",
    "linkingTargetType": "p",
    "picture": true,
    "provider": 22856
  }
}
```

### Step 2: VIN Processing
**Input**: VIN from plate search result

**Process**:
1. Check `vin_search_result_cache` table
2. If cache miss, call TecDoc VIN API
3. API: `getVehiclesByVIN` 
4. API: `getLinkageTargets` with carId
5. Save combined result to VIN cache

**API Payloads**:
```json
// getVehiclesByVIN
{
  "getVehiclesByVIN": {
    "lang": "qb",
    "provider": 22856,
    "country": "au",
    "vin": "WBAXX320500G76470"
  }
}

// getLinkageTargets  
{
  "getLinkageTargets": {
    "provider": 22856,
    "linkageTargetCountry": "au",
    "lang": "qb",
    "linkageTargetType": "P",
    "linkageTargetIds": {
      "type": "P",
      "id": 101050
    }
  }
}
```

### Step 3: Parts & SKU Resolution
**Input**: carId from vehicle data

**Process**:
1. Check Redis for cached SKU array
2. If cache miss, call `getArticles` API
3. Process each article through SKU resolution logic
4. Save final SKU array to Redis

**SKU Resolution Logic**:
- **Step A**: Map `mfrName` to `brand_abbreviation` via `brand_details` table
- **Step B**: Find SKU using `brandAbbr_articleNumber` in `tecDoc_catalog_magento`  
- **Step C**: If status=1, find `parent_sku` in `parent_child_sku_data`
- **Step D**: Fallback to direct lookup using `mfrName_articleNumber`

### Step 4: Product Display
**Process**:
1. Redirect to `/all-products` page
2. Check if customer is logged in
3. If logged in, get carId from `customer_vehicle_data`
4. Apply custom filtering logic in Amasty Shopby
5. Display filtered products

## Database Schema

### Cache Tables
```sql
-- Plate search results cache
plate_search_result_cache
- id (primary key)
- plate_number 
- state
- search_result (JSON)
- lookup_count
- created_date
- updated_date

-- VIN search results cache  
vin_search_result_cache
- id (primary key)
- vin
- vehicle_data (JSON) 
- car_id
- created_date
```

### Product/SKU Tables
```sql
-- Brand mapping
brand_details
- id (primary key)
- mfr_name
- brand_abbreviation

-- TecDoc to Magento SKU mapping
tecDoc_catalog_magento  
- id (primary key)
- brand_abbreviation_article_number
- sku
- status

-- Parent-child SKU relationships
parent_child_sku_data
- id (primary key) 
- child_sku
- parent_sku

-- Customer vehicle associations
customer_vehicle_data
- id (primary key)
- customer_id  
- car_id
- vehicle_data (JSON)
- created_date
```

## API Integration Details

### TecDoc API Configuration
- **Base URL**: `https://webservice.tecalliance.services/pegasus-3-0/services/TecdocToCatDLB.jsonEndpoint`
- **API Key**: `2BeBXg6GEn17nUApRTzgAxzREko6rVRvGeV9AJrKc9JmdpMvqhdR`
- **Provider ID**: `22856`
- **Country**: `AU` (Australia)
- **Language**: `qb` (English)

### API Endpoints Used
1. **getVehiclesByKeyNumberPlates**: Plate → Vehicle lookup
2. **getVehiclesByVIN**: VIN → Vehicle details  
3. **getLinkageTargets**: carId → Extended vehicle data
4. **getArticles**: carId → Compatible parts/articles

## Caching Strategy

### Multi-Layer Caching
1. **L1 - Database Cache**: Persistent storage for API results
2. **L2 - Redis Cache**: Fast access for SKU arrays  
3. **L3 - Magento Cache**: Standard application caching

### Cache Expiry Rules
- **Plate Data**: 30 days OR 20 lookups (whichever comes first)
- **VIN Data**: Indefinite (until manually cleared)
- **SKU Arrays**: Based on Redis TTL configuration
- **Product Data**: Standard Magento cache rules

## Performance Considerations

### Expected Response Times
- **Cache Hit**: < 100ms
- **Single API Call**: 300-800ms
- **Full Flow (new vehicle)**: 8-15 seconds  
- **Returning Customer**: < 1 second

### Optimization Strategies
1. **Aggressive Caching**: Multiple cache layers
2. **Batch Processing**: Handle large article datasets efficiently
3. **Lazy Loading**: Load vehicle data first, then products
4. **Background Processing**: Heavy SKU resolution can be async
5. **API Rate Limiting**: Prevent excessive API calls

## Error Handling

### Fallback Mechanisms
1. **Stale Cache**: Use expired cache if API fails
2. **Partial Results**: Show vehicle data even if parts fail
3. **Graceful Degradation**: Show all products if filtering fails
4. **Retry Logic**: Automatic retry for transient failures

### Error Scenarios
- **API Timeout**: Use cached data or show error
- **Invalid Plate**: Clear error message to user  
- **No VIN Found**: Limited vehicle information
- **SKU Resolution Failure**: Show unfiltered products

## Security Considerations

### API Security
- API key stored in Magento configuration
- HTTPS-only communication with TecDoc
- Rate limiting to prevent abuse
- Input validation for plate numbers

### Data Privacy
- Customer vehicle data properly secured
- Cache data anonymized where possible
- GDPR compliance for customer data retention

## Monitoring & Maintenance

### Key Metrics to Monitor
- API response times and success rates
- Cache hit/miss ratios  
- SKU resolution success rates
- Customer conversion rates
- Error rates and types

### Maintenance Tasks
- Regular cache cleanup
- API key rotation
- Database optimization
- Performance monitoring
- Error log analysis

## Future Enhancements

### Potential Improvements
1. **Parallel API Calls**: Reduce total response time
2. **Progressive Loading**: Show results as they become available
3. **Predictive Caching**: Pre-cache popular vehicles
4. **Mobile Optimization**: Faster mobile experience
5. **Analytics Integration**: Track search patterns and success rates

### Scalability Considerations
- Database sharding for large datasets
- Redis clustering for high availability
- CDN integration for static assets
- Load balancing for API calls
- Microservices architecture migration

## Conclusion

The TecDoc integration provides a sophisticated vehicle identification and parts matching system. The multi-layer caching strategy ensures good performance while the comprehensive error handling provides reliability. The system successfully bridges the gap between vehicle identification and e-commerce product display, creating a seamless user experience for B2B customers.

The architecture is well-designed for the current requirements and includes sufficient flexibility for future enhancements and scaling needs.