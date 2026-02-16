// Filter operator type
export type FilterOperator = 'contains' | 'startsWith' | 'endsWith' | 'equals';

// Filter state for a column
export interface ColumnFilter {
    value: string;
    operator: FilterOperator;
}

// Column metadata model
export interface ColumnMeta {
    field: string;
    header: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'link';
    width?: number;
    sortable?: boolean;
    filterable?: boolean;
    align?: 'left' | 'center' | 'right';
    format?: string; // For date/number formatting
    dataSourceKey?: string; // Reference to data source for select type
    linkField?: string; // Reference to link URL field (for link type)
    description?: string; // Description shown in column selector
    frozen?: boolean; // Fix/freeze column position
    editable?: boolean; // Allow editing cell value
    category?: 'core' | 'bond' | 'mf' | 'sn' | 'optional'; // Category for grouping
}

// Column preset model
export interface ColumnPreset {
    id: string;
    name: string;
    description?: string;
    columns: string[]; // Array of column field names
}

// Data source model (same pattern as Criteria)
export interface DataSourceModel {
    text: string;
    value: string;
    displayExpr?: string;
    valueExpr?: string;
    disabled?: boolean;
}

// Complete grid configuration
export interface DataGridConfig {
    meta: ColumnMeta[];
    presets: ColumnPreset[];
    data_source: { [key: string]: DataSourceModel[] };
}

// Row data type (generic)
export type RowData = { id?: string; [key: string]: any };

// Pagination configuration
export interface PaginationConfig {
    page: number; // Current page (0-indexed)
    pageSize: number; // Rows per page
    pageSizeOptions?: number[]; // Available page size options
}

// Alias for backward compatibility
export type ColumnDef = ColumnMeta;
