import { useState, useMemo } from 'react';
// Note: For full Premium features, install: npm install @mui/x-data-grid-premium
// Currently using standard DataGrid - upgrade to DataGridPremium for advanced features
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import type { 
    GridColDef,
    GridRowsProp,
    GridRowSelectionModel,
    GridColumnVisibilityModel,
    GridPaginationModel,
} from '@mui/x-data-grid';
import { Box } from '@mui/material';
import type { ColumnDefPremium, RowData } from './DataGridPremiumModel';

interface DataGridPremiumWrapperProps {
    columns: ColumnDefPremium[];
    rows: RowData[];
    visibleColumns?: string[];
    selectedRows?: string[];
    onRowSelect?: (rowIds: string[]) => void;
    onDataChange?: (rowId: string, field: string, value: any) => void;
    rowIdField?: string;
}

export default function DataGridPremiumWrapper({
    columns,
    rows,
    visibleColumns = [],
    selectedRows = [],
    onRowSelect,
    onDataChange,
    rowIdField = 'id',
}: DataGridPremiumWrapperProps) {
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 10,
    });

    // Convert visibility array to visibility model
    const columnVisibilityModel = useMemo<GridColumnVisibilityModel>(() => {
        const model: GridColumnVisibilityModel = {};
        columns.forEach((col) => {
            if (col.field) {
                model[col.field] = visibleColumns.length === 0 || visibleColumns.includes(col.field);
            }
        });
        return model;
    }, [columns, visibleColumns]);

    // Process columns for DataGrid
    const processedColumns = useMemo<GridColDef[]>(() => {
        return columns.map((col) => col as GridColDef);
    }, [columns]);

    // Convert rows to GridRowsProp
    const gridRows = useMemo<GridRowsProp>(() => {
        return rows.map((row) => ({
            id: row[rowIdField],
            ...row,
        }));
    }, [rows, rowIdField]);

    const handleRowSelectionChange = (newSelection: GridRowSelectionModel) => {
        if (onRowSelect) {
            // MUI X DataGrid v8+ returns an array-like object
            // Convert to array safely
            try {
                if (Array.isArray(newSelection)) {
                    onRowSelect(newSelection.map(id => String(id)));
                } else if (newSelection && typeof newSelection === 'object') {
                    // Handle object with ids property
                    if ('ids' in newSelection && newSelection.ids) {
                        onRowSelect(Array.from(newSelection.ids as Set<any>).map(id => String(id)));
                    } else {
                        // Fallback: treat as array-like or empty
                        onRowSelect([]);
                    }
                } else {
                    onRowSelect([]);
                }
            } catch (error) {
                console.error('Row selection error:', error);
                onRowSelect([]);
            }
        }
    };

    const handleProcessRowUpdate = (newRow: any) => {
        if (onDataChange) {
            // Find changed field by comparing with original row
            const originalRow = rows.find((r) => r[rowIdField] === newRow.id);
            if (originalRow) {
                Object.keys(newRow).forEach((field) => {
                    if (field !== rowIdField && newRow[field] !== originalRow[field]) {
                        onDataChange(newRow.id, field, newRow[field]);
                    }
                });
            }
        }
        return newRow;
    };

    // Convert selectedRows array to GridRowSelectionModel format
    const rowSelectionModel = useMemo<GridRowSelectionModel>(() => {
        // MUI X DataGrid v8+ expects { type: 'include' | 'exclude', ids: Set<GridRowId> }
        return {
            type: 'include',
            ids: new Set(selectedRows)
        } as GridRowSelectionModel;
    }, [selectedRows]);

    // Get pinned columns (core columns) - Requires @mui/x-data-grid-pro or premium
    // const pinnedColumns = useMemo(() => {
    //     const coreColumns = processedColumns
    //         .filter(col => {
    //             const original = columns.find(c => c.field === col.field);
    //             return original?.category === 'core';
    //         })
    //         .map(col => col.field);
    //     return { left: coreColumns };
    // }, [processedColumns, columns]);

    return (
        <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
                rows={gridRows}
                columns={processedColumns}
                columnVisibilityModel={columnVisibilityModel}
                checkboxSelection
                disableRowSelectionOnClick
                rowSelectionModel={rowSelectionModel}
                onRowSelectionModelChange={handleRowSelectionChange}
                processRowUpdate={handleProcessRowUpdate}
                onProcessRowUpdateError={(error: any) => console.error('Row update error:', error)}
                pagination
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[5, 10, 25, 50, 100]}
                // Enable pinned columns (requires @mui/x-data-grid-pro or premium)
                // pinnedColumns={pinnedColumns}
                // Enable toolbar
                slots={{
                    toolbar: GridToolbar,
                }}
                slotProps={{
                    toolbar: {
                        showQuickFilter: true,
                    },
                }}
                // Styling
                sx={{
                    '& .MuiDataGrid-cell:focus': {
                        outline: 'none',
                    },
                    '& .MuiDataGrid-cell:focus-within': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: '-1px',
                    },
                }}
                // Initial state
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 10 },
                    },
                }}
            />
        </Box>
    );
}
