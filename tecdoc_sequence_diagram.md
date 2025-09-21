# TecDoc API Sequence Diagram

## Complete Vehicle Search Sequence

```mermaid
sequenceDiagram
    participant User
    participant UI as Frontend UI
    participant VSM as VinSearch Module
    participant Cache as Cache Layer
    participant DB as Database
    participant TecDoc as TecDoc API
    participant Redis
    participant Amasty as Amasty Shopby
    participant PLP as Product Page

    %% Step 1: Initial plate search
    User->>UI: Enter plate "PL8888" + State "NSW"
    UI->>VSM: Submit plate search request
    
    VSM->>DB: Check plate_search_result_cache
    alt Cache Hit (< 30 days, count < 20)
        DB-->>VSM: Return cached plate data
        Note over DB,VSM: Cache hit - skip API call
    else Cache Miss or Expired
        VSM->>TecDoc: getVehiclesByKeyNumberPlates
        Note over VSM,TecDoc: API Call 1
        TecDoc-->>VSM: Vehicle data with VIN
        VSM->>DB: Save to plate_search_result_cache
        Note over VSM,DB: Set lookup_count = 1, current date
    end

    %% Step 2: VIN processing
    VSM->>VSM: Extract VIN from plate result
    alt VIN exists
        VSM->>DB: Check vin_search_result_cache
        alt VIN Cache Hit
            DB-->>VSM: Return cached VIN data
        else VIN Cache Miss
            VSM->>TecDoc: getVehiclesByVIN
            Note over VSM,TecDoc: API Call 2
            TecDoc-->>VSM: Matching vehicles with carId
            
            VSM->>TecDoc: getLinkageTargets(carId)
            Note over VSM,TecDoc: API Call 3
            TecDoc-->>VSM: Extended vehicle data
            
            VSM->>DB: Save to vin_search_result_cache
        end
    else No VIN
        VSM-->>UI: Show error or limited info
    end

    %% Step 3: Redirect and save customer data
    VSM->>VSM: Prepare redirect data
    VSM-->>UI: Redirect to vinsearch/index/search
    UI->>VSM: Process redirect with carId
    VSM->>DB: Save to customer_vehicle_data
    
    %% Step 4: Product lookup
    VSM->>Redis: Check for carId products
    alt Redis Cache Hit
        Redis-->>VSM: Return SKU array
    else Redis Cache Miss
        VSM->>TecDoc: getArticles(carId)
        Note over VSM,TecDoc: API Call 4 - Returns 2971+ articles
        TecDoc-->>VSM: Articles with mfrName + articleNumber
        
        loop For each article
            VSM->>DB: Query brand_details(mfrName)
            alt Brand found
                DB-->>VSM: Return brand_abbreviation
                VSM->>VSM: Create brandAbbr_articleNumber
                VSM->>DB: Query tecDoc_catalog_magento
                alt SKU found & status=1
                    DB-->>VSM: Return child SKU
                    VSM->>DB: Query parent_child_sku_data(child_sku)
                    DB-->>VSM: Return parent_sku
                    VSM->>VSM: Add parent_sku to array
                else SKU not found or status≠1
                    VSM->>VSM: Add brandAbbr_articleNumber to array
                end
            else Brand not found
                VSM->>VSM: Create mfrName_articleNumber
                VSM->>DB: Query parent_child_sku_data directly
                DB-->>VSM: Return parent_sku (if found)
                VSM->>VSM: Add parent_sku to array
            end
        end
        
        VSM->>Redis: Save SKU array with carId key
    end

    %% Step 5: Product display
    VSM-->>UI: Redirect to /all-products
    UI->>Amasty: Load product page
    
    alt Customer logged in
        Amasty->>DB: Get carId from customer_vehicle_data
        Amasty->>Redis: Get SKUs for carId
        Redis-->>Amasty: Return filtered SKU array
        Amasty->>Amasty: Apply custom filtering logic
        Note over Amasty: Custom logic in Collection.php
    else Customer not logged in
        Amasty->>Amasty: Show all products
    end
    
    Amasty->>PLP: Render filtered products
    PLP-->>UI: Display product results
    UI-->>User: Show vehicle-specific products

    %% Notes and styling
    Note over User,PLP: Complete flow from plate input to filtered products
    Note over Cache,Redis: Multi-layer caching strategy
    Note over VSM,TecDoc: 4 different TecDoc API endpoints used
```

## API Call Details & Timing

### Critical Path Analysis

```mermaid
gantt
    title TecDoc Integration Timeline
    dateFormat X
    axisFormat %s

    section Cache Checks
    Check Plate Cache    :0, 100
    Check VIN Cache      :100, 200
    Check Redis SKUs     :800, 900

    section TecDoc API Calls
    getVehiclesByKeyNumberPlates :200, 1500
    getVehiclesByVIN            :1500, 2000
    getLinkageTargets           :2000, 2500
    getArticles                 :3000, 8000

    section Data Processing
    Save Plate Data     :1500, 1600
    Save VIN Data       :2500, 2600
    Process Articles    :8000, 12000
    SKU Resolution      :12000, 15000
    Save to Redis       :15000, 15500

    section User Experience
    Initial Response    :0, 2600
    Product Loading     :15500, 16000
```

## Error Handling Sequence

```mermaid
sequenceDiagram
    participant VSM as VinSearch Module
    participant TecDoc as TecDoc API
    participant Cache as Cache/DB
    participant User

    VSM->>TecDoc: API Request
    
    alt API Success
        TecDoc-->>VSM: Valid Response
        VSM->>Cache: Save to cache
        VSM-->>User: Success Response
    else API Timeout
        TecDoc-->>VSM: Timeout Error
        VSM->>Cache: Check for stale cache
        alt Stale Cache Available
            Cache-->>VSM: Return stale data
            VSM-->>User: Success with stale data
        else No Cache
            VSM-->>User: Error - Try again later
        end
    else API Error (4xx/5xx)
        TecDoc-->>VSM: Error Response
        VSM->>Cache: Check for fallback data
        alt Fallback Available
            Cache-->>VSM: Return fallback
            VSM-->>User: Limited functionality
        else No Fallback
            VSM-->>User: Error - Service unavailable
        end
    end
```

## Performance Metrics

### Expected Response Times
- **Cache Hit**: < 100ms
- **Single API Call**: 300-800ms  
- **Full Flow (4 API calls)**: 2-5 seconds
- **Article Processing**: 3-8 seconds (2971+ articles)
- **SKU Resolution**: 2-5 seconds
- **Total First Visit**: 8-15 seconds
- **Subsequent Visits**: < 1 second (cached)

### Optimization Points
1. **Parallel API Calls**: Where possible, make concurrent requests
2. **Batch Processing**: Process articles in chunks
3. **Progressive Loading**: Show vehicle data while processing products
4. **Background Jobs**: Process heavy SKU resolution asynchronously
5. **CDN Caching**: Cache static vehicle images and data