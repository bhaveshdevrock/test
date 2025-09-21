# Plate Search System - Product Development Plan (PDP)

## Executive Summary

This Product Development Plan outlines the comprehensive implementation of an automotive plate search system that integrates with TecDoc API to provide vehicle identification, parts compatibility, and product filtering capabilities. The system handles the complete flow from plate number input to compatible parts display through sophisticated caching mechanisms and API orchestration.

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Technical Specifications](#technical-specifications)
3. [Database Design](#database-design)
4. [API Integration Strategy](#api-integration-strategy)
5. [Caching Architecture](#caching-architecture)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Performance Requirements](#performance-requirements)
8. [Security Considerations](#security-considerations)
9. [Error Handling & Monitoring](#error-handling--monitoring)
10. [Testing Strategy](#testing-strategy)

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

The Plate Search System consists of 11 interconnected components that work together to deliver a seamless vehicle identification and parts search experience:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input    │───▶│  Cache Layer    │───▶│  TecDoc APIs    │
│   (Plate/State) │    │  (Multi-tier)   │    │  (3 Endpoints)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   Redis Store   │    │   SKU Mapping   │
│   (5 Tables)    │    │   (Car SKUs)    │    │   (Brand Logic) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Product Filtering & Display                    │
│              (Magento Integration)                          │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Core Components

1. **User Interface Layer**: Plate number and state input form
2. **Cache Management**: Multi-tier caching for plates, VINs, and SKUs
3. **TecDoc Integration**: Three-stage API communication
4. **Database Layer**: Five interconnected tables for data persistence
5. **SKU Resolution**: Brand mapping and parent-child relationships
6. **Product Filtering**: Magento/Amasty integration
7. **Customer Vehicle Management**: Vehicle association and history

### 1.3 Data Flow Architecture

The system follows a sequential 11-step process:
- **Steps 1-3**: Input validation and plate cache check
- **Steps 4-6**: TecDoc API calls for vehicle identification
- **Steps 7-8**: Customer vehicle data persistence
- **Steps 9-11**: Parts search and product filtering

---

## 2. Technical Specifications

### 2.1 Technology Stack

#### Backend Technologies
- **Framework**: PHP 8.1+ with Magento 2.4+
- **Database**: MySQL 8.0+ with InnoDB engine
- **Cache**: Redis 6.2+ for SKU storage
- **API Client**: Guzzle HTTP client for TecDoc integration
- **Queue System**: Magento message queue for background processing

#### Frontend Technologies
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit or Zustand
- **UI Components**: Material-UI or Ant Design
- **Form Handling**: React Hook Form with Yup validation
- **HTTP Client**: Axios with interceptors

#### Infrastructure
- **Web Server**: Nginx 1.20+ with PHP-FPM
- **Load Balancer**: AWS ALB or CloudFlare
- **CDN**: CloudFlare for static assets
- **Monitoring**: New Relic or DataDog
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)

### 2.2 Performance Requirements

#### Response Time Targets
- **Cache Hit**: < 200ms for plate search
- **Cache Miss**: < 2s for full TecDoc lookup
- **Parts Loading**: < 1s for product filtering
- **Database Queries**: < 100ms per query

#### Throughput Requirements
- **Concurrent Users**: 1,000 simultaneous searches
- **Daily Searches**: 100,000 plate lookups
- **Peak Load**: 500 searches/minute
- **API Rate Limits**: Respect TecDoc throttling

#### Scalability Targets
- **Horizontal Scaling**: Auto-scaling based on CPU/memory
- **Database Sharding**: Partition by customer_id or region
- **Cache Distribution**: Redis cluster with failover
- **CDN Integration**: Global edge caching

---

## 3. Database Design

### 3.1 Table Specifications

#### 3.1.1 plate_search_result_cache
```sql
CREATE TABLE plate_search_result_cache (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plate_number VARCHAR(20) NOT NULL,
    state VARCHAR(10) NOT NULL,
    plate_result JSON NOT NULL,
    store_id INT NOT NULL DEFAULT 1,
    total_count INT DEFAULT 0,
    lookup_count INT DEFAULT 1,
    lookup_date_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_plate_state_store (plate_number, state, store_id),
    INDEX idx_lookup_date (lookup_date_time),
    INDEX idx_lookup_count (lookup_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.1.2 vin_search_result_cache
```sql
CREATE TABLE vin_search_result_cache (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vin_number VARCHAR(17) NOT NULL UNIQUE,
    model_id VARCHAR(20) NOT NULL,
    vin_result JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_vin_model (vin_number, model_id),
    INDEX idx_model_id (model_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.1.3 customer_vehicle_data
```sql
CREATE TABLE customer_vehicle_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    car_id VARCHAR(20) NOT NULL,
    vin_number VARCHAR(17),
    plate_number VARCHAR(20),
    mmvy VARCHAR(100), -- Make/Model/Variant/Year
    car_data JSON NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    flag TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_customer_active (customer_id, is_active),
    INDEX idx_car_id (car_id),
    INDEX idx_vin_number (vin_number),
    INDEX idx_plate_number (plate_number),
    
    FOREIGN KEY (customer_id) REFERENCES customer_entity(entity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.1.4 brand_details
```sql
CREATE TABLE brand_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    brand_name VARCHAR(100) NOT NULL UNIQUE,
    brand_abbreviation VARCHAR(10) NOT NULL UNIQUE,
    tecdoc_brand_id INT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_brand_name (brand_name),
    INDEX idx_brand_abbrev (brand_abbreviation),
    INDEX idx_tecdoc_id (tecdoc_brand_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.1.5 tecDoc_catalog_magento
```sql
CREATE TABLE tecDoc_catalog_magento (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sku VARCHAR(64) NOT NULL,
    main_sku VARCHAR(64) NOT NULL,
    tecdoc_article_id VARCHAR(20),
    brand_id INT,
    status TINYINT(1) DEFAULT 1,
    sync_status ENUM('pending', 'synced', 'failed') DEFAULT 'pending',
    last_sync_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY idx_sku_status (sku, status),
    INDEX idx_main_sku (main_sku),
    INDEX idx_tecdoc_article (tecdoc_article_id),
    INDEX idx_sync_status (sync_status),
    
    FOREIGN KEY (brand_id) REFERENCES brand_details(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.1.6 parent_child_sku_data
```sql
CREATE TABLE parent_child_sku_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    parent_sku VARCHAR(64) NOT NULL,
    child_sku VARCHAR(64) NOT NULL,
    relationship_type ENUM('variant', 'bundle', 'accessory') DEFAULT 'variant',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY idx_child_parent (child_sku, parent_sku),
    INDEX idx_parent_sku (parent_sku),
    INDEX idx_child_sku (child_sku),
    INDEX idx_relationship (relationship_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.2 Database Relationships

```
customer_entity (Magento Core)
    ↓ 1:N
customer_vehicle_data
    ↓ N:1
brand_details ←→ tecDoc_catalog_magento
    ↓ 1:N
parent_child_sku_data

plate_search_result_cache (Independent)
vin_search_result_cache (Independent)
```

### 3.3 Indexing Strategy

#### Primary Indexes
- Composite indexes on frequently queried combinations
- Covering indexes for read-heavy operations
- Partial indexes on active/status columns

#### Query Optimization
- Partition large tables by date or customer_id
- Use materialized views for complex aggregations
- Implement read replicas for reporting queries

---

## 4. API Integration Strategy

### 4.1 TecDoc API Endpoints

#### 4.1.1 getVehiclesByKeyNumberPlates
**Purpose**: Initial plate lookup to get vehicle basic information

**Endpoint**: `https://webservice.tecalliance.services/pegasus-3-0/...`

**Request Payload**:
```json
{
  "getVehiclesByKeyNumberPlates": {
    "country": "AU",
    "keySystemNumber": "pl8888-nsw",
    "keySystemType": 75,
    "provider": 22856,
    "details": true,
    "picture": true
  }
}
```

**Response Structure**:
```json
{
  "data": {
    "array": [{
      "carId": 101050,
      "carName": "BMW X4 (F26) xDrive 30 d",
      "vehicleDetails": {
        "vin": "WBAXX320500G76470",
        "bodyTypeOfVehicle": "SUV",
        "engineCode": "N57 D30 A",
        "yearFrom": "2014"
      }
    }]
  }
}
```

#### 4.1.2 getVehiclesByVIN
**Purpose**: Get detailed vehicle information using VIN

**Request Payload**:
```json
{
  "getVehiclesByVIN": {
    "vin": "WBAXX320500G76470",
    "country": "au",
    "provider": 22856
  }
}
```

**Response Structure**:
```json
{
  "data": {
    "matchingVehicles": {
      "array": [{
        "carId": 101050,
        "manuId": 16,
        "modelId": 11945
      }]
    }
  }
}
```

#### 4.1.3 getLinkageTargets
**Purpose**: Get comprehensive vehicle specifications

**Request Payload**:
```json
{
  "getLinkageTargets": {
    "linkageTargetId": 101050,
    "linkageTargetType": "P",
    "provider": 22856
  }
}
```

#### 4.1.4 getArticles
**Purpose**: Get all compatible parts for a vehicle

**Request Payload**:
```json
{
  "getArticles": {
    "linkageTargetId": 101050,
    "linkageTargetType": "p",
    "provider": 22856,
    "perPage": 1000,
    "includeLinkages": true
  }
}
```

### 4.2 API Client Implementation

#### 4.2.1 Base API Client
```php
<?php

class TecDocApiClient
{
    private $client;
    private $baseUrl;
    private $provider;
    private $apiKey;
    
    public function __construct()
    {
        $this->client = new \GuzzleHttp\Client([
            'timeout' => 30,
            'connect_timeout' => 10,
            'retry' => [
                'max' => 3,
                'delay' => 1000,
                'on_retry' => [$this, 'onRetry']
            ]
        ]);
        
        $this->baseUrl = config('tecdoc.base_url');
        $this->provider = config('tecdoc.provider_id');
        $this->apiKey = config('tecdoc.api_key');
    }
    
    public function searchByPlate(string $plate, string $state): array
    {
        $payload = [
            'getVehiclesByKeyNumberPlates' => [
                'country' => 'AU',
                'keySystemNumber' => strtolower($plate) . '-' . strtolower($state),
                'keySystemType' => 75,
                'provider' => $this->provider,
                'details' => true,
                'picture' => true
            ]
        ];
        
        return $this->makeRequest($payload);
    }
    
    private function makeRequest(array $payload): array
    {
        try {
            $response = $this->client->post($this->baseUrl, [
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'X-Request-ID' => uniqid('tecdoc_', true)
                ],
                'json' => $payload,
                'timeout' => 30
            ]);
            
            return json_decode($response->getBody()->getContents(), true);
            
        } catch (\Exception $e) {
            \Log::error('TecDoc API Error', [
                'payload' => $payload,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            throw new TecDocApiException('API request failed: ' . $e->getMessage());
        }
    }
}
```

### 4.3 Rate Limiting & Throttling

#### Implementation Strategy
- **Request Queue**: Use Redis-based queue for API calls
- **Rate Limiting**: Implement token bucket algorithm
- **Circuit Breaker**: Fail fast when API is down
- **Retry Logic**: Exponential backoff with jitter

```php
class ApiRateLimiter
{
    private $redis;
    private $maxRequests = 100; // per minute
    private $windowSize = 60; // seconds
    
    public function canMakeRequest(): bool
    {
        $key = 'tecdoc_rate_limit:' . date('Y-m-d-H-i');
        $current = $this->redis->incr($key);
        
        if ($current === 1) {
            $this->redis->expire($key, $this->windowSize);
        }
        
        return $current <= $this->maxRequests;
    }
}
```

---

This is the first part of the comprehensive PDP document. Would you like me to continue with the remaining sections including Caching Architecture, Implementation Roadmap, Performance Requirements, Security Considerations, Error Handling, and Testing Strategy?