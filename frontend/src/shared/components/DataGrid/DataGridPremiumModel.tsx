// Note: For Premium features, install: npm install @mui/x-data-grid-premium
// Currently using standard @mui/x-data-grid

import type { GridColDef } from '@mui/x-data-grid';

// Category type for column grouping
export type ColumnCategory = 'core' | 'bond' | 'mf' | 'sn';

// Extended column definition with category
export type ColumnDefPremium = GridColDef & {
    category?: ColumnCategory;
};

// Data source model (for select columns)
export interface DataSourceModel {
    text: string;
    value: string;
    displayExpr?: string;
    valueExpr?: string;
    disabled?: boolean;
}

// Complete grid configuration
export interface DataGridPremiumConfig {
    columns: ColumnDefPremium[];
    data_source?: { [key: string]: DataSourceModel[] };
}

// Row data type (generic)
export type RowData = { [key: string]: any };
