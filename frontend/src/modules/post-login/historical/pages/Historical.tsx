import { useState } from 'react';
import Criteria from '../../../../shared/components/Criteria/Criteria';
import DataGrid from '../../../../shared/components/DataGrid/DataGrid';
import ColumnSelector from '../../../../shared/components/DataGrid/ColumnSelector';
import DataGridPremiumWrapper from '../../../../shared/components/DataGrid/DataGridPremiumWrapper';
import ColumnSelectorPremium from '../../../../shared/components/DataGrid/ColumnSelectorPremium';
import type { DataGridConfig, RowData, ColumnDef } from '../../../../shared/components/DataGrid/DataGridModel';
import type { ColumnDefPremium, DataGridPremiumConfig } from '../../../../shared/components/DataGrid/DataGridPremiumModel';

// Types for API schema
interface TableSectionColumn {
    col_index: number;
    col_type: string;
    col_header_text: string;
    col_value_field: string;
    col_link_field: string | null;
    col_freeze: boolean;
    col_show: boolean;
    col_format: string | null;
    attrs: {
        header: {
            class: string;
            style: string | null;
        };
        cell: {
            class: string;
            style: string | null;
        };
    };
}

interface ApiSchema {
    table_section: TableSectionColumn[];
    cols_data: Record<string, any>[];
}

// Helper function to convert API schema to DataGrid config
function convertApiSchemaToGridConfig(apiSchema: ApiSchema): { config: DataGridConfig; rows: RowData[] } {
    const columns: ColumnDef[] = apiSchema.table_section
        .filter((col) => col.col_show) // Only include visible columns
        .map((col) => {
            // Determine column type
            let type: ColumnDef['type'] = 'text';
            const colType = col.col_type.toLowerCase();
            
            if (colType === 'number' || colType === 'numeric') {
                type = 'number';
            } else if (colType === 'date' || colType === 'datetime') {
                type = 'date';
            } else if (colType === 'link') {
                type = 'link';
            } else if (colType === 'select' || colType === 'dropdown') {
                type = 'select';
            }

            // Extract alignment from cell style
            let align: 'left' | 'center' | 'right' | undefined = undefined;
            if (col.attrs.cell.style) {
                if (col.attrs.cell.style.includes('text-align:right')) {
                    align = 'right';
                } else if (col.attrs.cell.style.includes('text-align:center')) {
                    align = 'center';
                } else if (col.attrs.cell.style.includes('text-align:left')) {
                    align = 'left';
                }
            }

            const columnDef: ColumnDef = {
                field: col.col_value_field,
                header: col.col_header_text,
                type: type,
                width: 150, // Default width
                sortable: true,
                filterable: true,
                frozen: col.col_freeze,
                editable: false, // Default to not editable
                category: col.col_freeze ? 'core' : 'optional',
            };

            // Add alignment if specified
            if (align) {
                columnDef.align = align;
            }

            // Add link field for link type columns
            if (type === 'link' && col.col_link_field) {
                columnDef.linkField = col.col_link_field;
            }

            // Add format if specified
            if (col.col_format) {
                columnDef.format = col.col_format;
            }

            return columnDef;
        })
        .sort((a, b) => {
            // Sort by original col_index
            const aIndex = apiSchema.table_section.find((c) => c.col_value_field === a.field)?.col_index || 0;
            const bIndex = apiSchema.table_section.find((c) => c.col_value_field === b.field)?.col_index || 0;
            return aIndex - bIndex;
        });

    // Convert rows data (add id field if not present)
    const rows: RowData[] = apiSchema.cols_data.map((row, index) => ({
        id: row.id || `row_${index + 1}`,
        ...row,
    }));

    const config: DataGridConfig = {
        meta: columns,
        presets: [],
        data_source: {},
    };

    return { config, rows };
}

export default function Historical() {
    // Mock API response (ตัวอย่างข้อมูลจาก API)
    const mockApiResponse: ApiSchema = {
        table_section: [
            {
                col_index: 1,
                col_type: 'text',
                col_header_text: 'Customer Code',
                col_value_field: 'customer_code',
                col_link_field: null,
                col_freeze: true,
                col_show: true,
                col_format: null,
                attrs: {
                    header: {
                        class: 'col-header-text',
                        style: 'text-align:left;font-weight:600',
                    },
                    cell: {
                        class: 'col-cell-text',
                        style: 'text-overflow:ellipsis;white-space:nowrap;overflow:hidden',
                    },
                },
            },
            {
                col_index: 2,
                col_type: 'TEXT',
                col_header_text: 'Customer Name',
                col_value_field: 'customer_name',
                col_link_field: null,
                col_freeze: true,
                col_show: true,
                col_format: null,
                attrs: {
                    header: {
                        class: 'col-header-number',
                        style: 'text-align:right;font-weight:600',
                    },
                    cell: {
                        class: 'col-cell-number',
                        style: 'text-align:right;white-space:nowrap',
                    },
                },
            },
            {
                col_index: 3,
                col_type: 'text',
                col_header_text: 'Transaction Date',
                col_value_field: 'transaction_date',
                col_link_field: null,
                col_freeze: false,
                col_show: false,
                col_format: null,
                attrs: {
                    header: {
                        class: 'col-header-text',
                        style: 'text-align:left;font-weight:600',
                    },
                    cell: {
                        class: 'col-cell-text',
                        style: 'text-align:left;white-space:nowrap',
                    },
                },
            },
            {
                col_index: 4,
                col_type: 'link',
                col_header_text: 'Action',
                col_value_field: 'profile',
                col_link_field: 'profile_link',
                col_freeze: false,
                col_show: true,
                col_format: null,
                attrs: {
                    header: {
                        class: 'col-header-text',
                        style: null,
                    },
                    cell: {
                        class: 'col-cell-text',
                        style: null,
                    },
                },
            },
        ],
        cols_data: [
            {
                customer_code: '641789',
                customer_name: 'นาย client 01',
                transaction_date: '10/4/2026',
                tel: '0810000000',
                profile: 'Profile',
                profile_link: 'http://localhost/profile_system/641789',
            },
            {
                customer_code: '520964',
                customer_name: 'นาย client 02',
                transaction_date: '10/4/2026',
                tel: '0820000000',
                profile: 'Profile',
                profile_link: 'http://localhost/profile_system/520964',
            },
            {
                customer_code: '789456',
                customer_name: 'นาง client 03',
                transaction_date: '11/4/2026',
                tel: '0830000000',
                profile: 'Profile',
                profile_link: 'http://localhost/profile_system/789456',
            },
        ],
    };

    // Convert API schema to grid configuration
    const { config: gridConfig, rows: apiRows } = convertApiSchemaToGridConfig(mockApiResponse);

    // Premium grid configuration (converted from custom config)
    const premiumGridConfig: DataGridPremiumConfig = {
        columns: [
            // Core columns (always visible, pinned)
            { field: 'client_code', headerName: 'Client Code', type: 'string', width: 120, editable: false, category: 'core' },
            { field: 'client_name', headerName: 'Client Name', type: 'string', width: 200, editable: true, category: 'core' },
            {
                field: 'client_type',
                headerName: 'Client Type',
                type: 'singleSelect',
                width: 150,
                editable: true,
                category: 'core',
                valueOptions: ['individual', 'corporate', 'institutional'],
            },

            // Bond columns
            {
                field: 'bond_holdings',
                headerName: 'Bond Holdings',
                type: 'number',
                width: 150,
                align: 'right',
                editable: true,
                category: 'bond',
                valueFormatter: (value: any) => (value ? `${value.toLocaleString()}` : '-'),
            },
            {
                field: 'bond_yield',
                headerName: 'Bond Yield (%)',
                type: 'number',
                width: 130,
                align: 'right',
                editable: true,
                category: 'bond',
            },
            {
                field: 'bond_maturity',
                headerName: 'Bond Maturity',
                type: 'date',
                width: 130,
                editable: true,
                category: 'bond',
                valueGetter: (value: any) => (value ? new Date(value) : null),
            },
            {
                field: 'bond_coupon',
                headerName: 'Coupon Rate (%)',
                type: 'number',
                width: 140,
                align: 'right',
                editable: true,
                category: 'bond',
            },

            // Mutual Fund columns
            {
                field: 'mf_holdings',
                headerName: 'MF Holdings',
                type: 'number',
                width: 150,
                align: 'right',
                editable: true,
                category: 'mf',
                valueFormatter: (value: any) => (value ? `${value.toLocaleString()}` : '-'),
            },
            { field: 'mf_nav', headerName: 'MF NAV', type: 'number', width: 120, align: 'right', editable: true, category: 'mf' },
            { field: 'mf_return', headerName: 'MF Return (%)', type: 'number', width: 130, align: 'right', editable: true, category: 'mf' },
            {
                field: 'mf_risk_level',
                headerName: 'Risk Level',
                type: 'singleSelect',
                width: 120,
                editable: true,
                category: 'mf',
                valueOptions: ['low', 'medium', 'high', 'very_high'],
            },

            // Structure Note columns
            {
                field: 'sn_holdings',
                headerName: 'SN Holdings',
                type: 'number',
                width: 150,
                align: 'right',
                editable: true,
                category: 'sn',
                valueFormatter: (value: any) => (value ? `${value.toLocaleString()}` : '-'),
            },
            { field: 'sn_underlying', headerName: 'Underlying', type: 'string', width: 150, editable: true, category: 'sn' },
            {
                field: 'sn_protection',
                headerName: 'Protection (%)',
                type: 'number',
                width: 140,
                align: 'right',
                editable: true,
                category: 'sn',
            },
            {
                field: 'sn_maturity',
                headerName: 'SN Maturity',
                type: 'date',
                width: 130,
                editable: true,
                category: 'sn',
                valueGetter: (value: any) => (value ? new Date(value) : null),
            },
        ] as ColumnDefPremium[],
    };

    const [selectedColumns, setSelectedColumns] = useState<string[]>(
        gridConfig.meta.filter((col) => col.frozen || col.category === 'core').map((col) => col.field),
    );
    const [visibleColumnsPremium, setVisibleColumnsPremium] = useState<string[]>(
        premiumGridConfig.columns.filter((col) => col.category === 'core').map((col) => col.field!),
    );
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [gridData, setGridData] = useState<RowData[]>(apiRows); // Use API rows instead of mock data

    const visibleColumns = gridConfig.meta.filter((col) => selectedColumns.includes(col.field));

    const handleDataChange = (rowId: string, field: string, value: any) => {
        setGridData((prevData) => prevData.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
        console.log(`Updated ${rowId}.${field} = ${value}`);
    };

    const onClickSearch = (filters: any) => {
        console.log('Search clicked with filters:', filters);
    };

    return (
        <div className="p-6 rounded-lg shadow-md bg-slate-50 text-gray-800 dark:bg-slate-900 dark:text-gray-200">
            <div className="grid grid-cols-1 gap-4 mb-6">
                <Criteria criteriaKey="historical" onClickSearch={onClickSearch} />
            </div>

            <ColumnSelector columns={gridConfig.meta} selectedColumns={selectedColumns} onColumnsChange={setSelectedColumns} />

            <DataGrid
                columns={visibleColumns}
                rows={gridData}
                dataSource={gridConfig.data_source}
                selectedRows={selectedRows}
                onRowSelect={setSelectedRows}
                onDataChange={handleDataChange}
                rowIdField="id"
            />

            <ColumnSelectorPremium
                columns={premiumGridConfig.columns}
                visibleColumns={visibleColumnsPremium}
                onVisibilityChange={setVisibleColumnsPremium}
            />

            <DataGridPremiumWrapper
                columns={premiumGridConfig.columns}
                rows={gridData}
                visibleColumns={visibleColumnsPremium}
                selectedRows={selectedRows}
                onRowSelect={setSelectedRows}
                onDataChange={handleDataChange}
                rowIdField="id"
            />
        </div>
    );
}
