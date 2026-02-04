# PLU Analyzer

A Next.js application for analyzing PLU (Price Look-Up) codes to determine publish/unpublish recommendations based on inventory coverage, product status, and channel availability.

## Required CSV Files

The analyzer requires four CSV files to perform analysis:

### 1. Plant Data (`v_dim_plant.csv`)
Store/plant information for determining active stores.

| Column | Description |
|--------|-------------|
| `SITE_NUMBER` | Unique store identifier |
| `REGION` | Store region |
| `ORGANIZATION_NUMBER` | Organization identifier |
| `OPEN_DATE` | Store open date |
| `CLOSE_DATE` | Store close date (empty if still open) |

### 2. Inventory Data (`inventory.csv`)
Current inventory levels by store and SKU.

| Column | Description |
|--------|-------------|
| `sku` | Product SKU/PLU number |
| `availableQuantity` | Available inventory quantity |
| `supplyChannel.key` | Store/channel identifier |

### 3. Status Data (`status.csv`)
Current publish status of products.

| Column | Description |
|--------|-------------|
| `key` | Product SKU/PLU number |
| `published` | Whether the product is currently published |

### 4. Product Data (`v_dim_product.csv`)
Product master data from SAP.

| Column | Description |
|--------|-------------|
| `SKU_NUMBER` | Product SKU/PLU number |
| `STATUS_IN_SAP` | Product status (e.g., Active, Inactive, Discontinued) |
| `SKU_DESCRIPTION` | Product description |
| `AVAILABLE_IN_CHANNEL` | Channel availability (Both, Ecom, Store, etc.) |

## Filtering Logic

### Channel Filter
Only products with `AVAILABLE_IN_CHANNEL` set to **"Both"** or **"Ecom"** are included in the analysis. Products available only in-store are excluded.

### PLU Validation
Only SKUs that are exactly 4 digits are analyzed (valid PLU format).

### Recommendation Rules

- **Publish**: Product is NOT published + status is NOT Inactive/Discontinued + ≥90% inventory coverage
- **Unpublish**: Product IS published + status IS Inactive/Discontinued + ≥50% out of stock
- **No Action**: All other cases

### Audit Feature

The **Audit** button provides a separate analysis to identify products that are published but should not be available for e-commerce:

- **Criteria**: Product IS published + `AVAILABLE_IN_CHANNEL` is "Store"
- **Recommendation**: Always "Unpublish"

This helps identify items that are incorrectly published online when they should only be available in physical stores.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the analyzer.
