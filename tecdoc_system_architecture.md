# TecDoc System Architecture

## System Architecture Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Vehicle Search UI<br/>Plate Number Input]
        PLP[Product Listing Page<br/>/all-products]
    end
    
    subgraph "Magento Extensions"
        VSM[Asv_VinSearch Module<br/>Main Vehicle Search Logic]
        RM[Asv_Redis Module<br/>Caching Layer]
        ICM[Asv_ImportCatalog Module<br/>Catalog Management]
        ASM[Amasty_Shopby Module<br/>Product Filtering]
    end
    
    subgraph "Controllers & Logic"
        VSC[VinSearch Controller<br/>vinsearch/index/search]
        FC[Filtering Controller<br/>Custom Collection Logic]
    end
    
    subgraph "External APIs"
        TAPI[TecDoc API<br/>webservice.tecalliance.services]
        IAPI[InfoAgent API<br/>NEVDIS Integration<br/>(Configured but not used)]
    end
    
    subgraph "Caching Layer"
        RC[Redis Cache<br/>SKU Arrays by carId]
        MC[Magento Cache<br/>Standard Caching]
    end
    
    subgraph "Database Tables"
        subgraph "Cache Tables"
            PSC[plate_search_result_cache<br/>- Plate lookup results<br/>- 30 day expiry<br/>- lookup_count tracking]
            VSC_DB[vin_search_result_cache<br/>- VIN lookup results<br/>- Vehicle details]
        end
        
        subgraph "Customer Data"
            CVD[customer_vehicle_data<br/>- Customer selected vehicles<br/>- carId associations]
        end
        
        subgraph "Product/SKU Tables"
            BD[brand_details<br/>- mfrName to brand_abbreviation<br/>- Brand mapping logic]
            TCM[tecDoc_catalog_magento<br/>- brandAbbr_articleNumber to SKU<br/>- Status tracking]
            PCS[parent_child_sku_data<br/>- Child to Parent SKU mapping<br/>- Hierarchical relationships]
        end
    end
    
    subgraph "TecDoc API Calls"
        API1[getVehiclesByKeyNumberPlates<br/>Step 1: Plate → Vehicle Data]
        API2[getVehiclesByVIN<br/>Step 2: VIN → Vehicle Details]
        API3[getLinkageTargets<br/>Step 3: carId → Extended Data]
        API4[getArticles<br/>Step 4: carId → Parts/Articles]
    end
    
    %% Flow connections
    UI --> VSM
    VSM --> PSC
    VSM --> API1
    API1 --> PSC
    PSC --> VSC_DB
    VSM --> API2
    API2 --> VSC_DB
    VSM --> API3
    API3 --> VSC_DB
    VSC_DB --> VSC
    VSC --> CVD
    VSC --> API4
    API4 --> BD
    BD --> TCM
    TCM --> PCS
    PCS --> RC
    RC --> ASM
    ASM --> FC
    FC --> PLP
    CVD --> RC
    
    %% External connections
    API1 -.-> TAPI
    API2 -.-> TAPI
    API3 -.-> TAPI
    API4 -.-> TAPI
    
    %% Module connections
    VSM --> RM
    RM --> RC
    VSM --> ICM
    ASM --> FC
    
    %% Styling
    classDef frontend fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef module fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef api fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef cache fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef database fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef external fill:#ffebee,stroke:#d32f2f,stroke-width:2px
    
    class UI,PLP frontend
    class VSM,RM,ICM,ASM module
    class API1,API2,API3,API4 api
    class RC,MC,PSC,VSC_DB cache
    class CVD,BD,TCM,PCS database
    class TAPI,IAPI external
```

## Data Flow Summary

### 1. Initial Request Flow
```
User Input (Plate + State) 
→ Asv_VinSearch Module 
→ Check Cache Tables 
→ TecDoc API Calls (if needed)
→ Cache Results
```

### 2. Vehicle Data Processing
```
Plate Search Result 
→ Extract VIN 
→ VIN Search (cached or API)
→ Get Extended Vehicle Data
→ Save to customer_vehicle_data
```

### 3. Product SKU Resolution
```
carId from Vehicle Data 
→ getArticles API Call
→ Process mfrName + articleNumber
→ Brand Mapping (brand_details)
→ SKU Resolution (tecDoc_catalog_magento)
→ Parent/Child SKU Logic (parent_child_sku_data)
→ Cache in Redis
```

### 4. Product Display
```
Redis SKU Array 
→ Amasty_Shopby Filtering
→ Custom Collection Logic
→ Filtered Product Display
```

## Key Integration Points

### Cache Strategy
- **L1 Cache**: Database tables for persistent storage
- **L2 Cache**: Redis for fast SKU lookups
- **L3 Cache**: Magento native caching

### API Rate Limiting Protection
- 30-day cache for plate searches
- Lookup count tracking (max 20)
- VIN data cached indefinitely
- Redis caching for frequent SKU lookups

### Error Handling & Fallbacks
- Multiple SKU resolution strategies (Steps A-D)
- Graceful degradation if APIs fail
- Cache-first approach to reduce API calls

### Performance Optimizations
- Redis caching for SKU arrays
- Database caching for API responses
- Bulk processing of articles data
- Custom collection filtering for faster queries