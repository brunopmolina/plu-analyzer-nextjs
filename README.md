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

## CommerceTools API Integration

Instead of manually uploading Inventory and Status CSV files, you can automatically download this data directly from CommerceTools.

### Setup

Add the following environment variables to enable the "Download from CommerceTools" button:

| Variable | Description |
|----------|-------------|
| `CTP_CLIENT_ID` | CommerceTools API client ID |
| `CTP_CLIENT_SECRET` | CommerceTools API client secret |
| `CTP_PROJECT_KEY` | CommerceTools project key |
| `CTP_AUTH_URL` | CommerceTools auth URL (e.g., `auth.us-central1.gcp.commercetools.com`) |
| `CTP_API_URL` | CommerceTools API URL (e.g., `api.us-central1.gcp.commercetools.com`) |

### Required Scopes

The API client needs the following scopes:
- `view_products:{projectKey}`
- `view_orders:{projectKey}`
- `view_stores:{projectKey}`

### How It Works

When you click "Download from CommerceTools", the app will:
1. Authenticate with CommerceTools OAuth
2. Fetch all supply channels (store mappings)
3. Fetch all US products with pagination
4. Fetch inventory data in parallel batches
5. Transform and load the data into the analyzer

Progress is displayed in real-time via Server-Sent Events (SSE).

## Store Descriptions

The **View Stores** button displays a popup with all active store locations, including:
- Store number
- Store description (e.g., "9012 - Ft. Lauderdale")
- Region

To enable store descriptions, include the `SITE_DESCRIPTION` column in your `v_dim_plant.csv` export. The column name is case-insensitive.

You can also export the store list to CSV from this popup.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the analyzer.

### Environment Variables

For local development, create a `.env.local` file:

```env
# CommerceTools (optional - enables automatic data download)
CTP_CLIENT_ID=your_client_id
CTP_CLIENT_SECRET=your_client_secret
CTP_PROJECT_KEY=your_project_key
CTP_AUTH_URL=auth.us-central1.gcp.commercetools.com
CTP_API_URL=api.us-central1.gcp.commercetools.com
```

For Cloudflare Pages deployment, add these variables in Settings > Environment Variables.
