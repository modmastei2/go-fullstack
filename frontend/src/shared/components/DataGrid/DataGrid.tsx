import { useMemo, useState, useCallback } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Checkbox,
    TableSortLabel,
    TextField,
    Box,
    Select,
    MenuItem,
    TablePagination,
    FormControl,
} from '@mui/material';
import moment from 'moment';
import type { ColumnMeta, DataSourceModel, RowData, FilterOperator, ColumnFilter } from './DataGridModel';

type SortOrder = 'asc' | 'desc';

interface DataGridProps {
    columns: ColumnMeta[];
    rows: RowData[];
    dataSource?: { [key: string]: DataSourceModel[] };
    selectedRows?: string[];
    onRowSelect?: (rowIds: string[]) => void;
    onDataChange?: (rowId: string, field: string, value: any) => void;
    rowIdField?: string;
}

export default function DataGrid({
    columns,
    rows,
    dataSource = {},
    selectedRows = [],
    onRowSelect,
    onDataChange,
    rowIdField = 'id',
}: DataGridProps) {
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [filters, setFilters] = useState<{ [key: string]: ColumnFilter }>({});
    const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleSort = (field: string) => {
        const isAsc = sortField === field && sortOrder === 'asc';
        setSortOrder(isAsc ? 'desc' : 'asc');
        setSortField(field);
    };

    const handleFilterChange = (field: string, value: string) => {
        setFilters((prev) => ({
            ...prev,
            [field]: { 
                value, 
                operator: prev[field]?.operator || 'contains' 
            },
        }));
        setPage(0); // Reset to first page when filtering
    };

    const handleFilterOperatorChange = (field: string, operator: FilterOperator) => {
        setFilters((prev) => ({
            ...prev,
            [field]: { 
                value: prev[field]?.value || '', 
                operator 
            },
        }));
        setPage(0);
    };

    const handleCellEdit = (rowId: string, field: string, value: any) => {
        if (onDataChange) {
            onDataChange(rowId, field, value);
        }
        setEditingCell(null);
    };

    const handleSelectAll = (checked: boolean) => {
        if (onRowSelect) {
            if (checked) {
                const allIds = paginatedRows.map((row) => row[rowIdField]);
                onRowSelect(allIds);
            } else {
                onRowSelect([]);
            }
        }
    };

    const handleSelectRow = (rowId: string) => {
        if (onRowSelect) {
            const currentIndex = selectedRows.indexOf(rowId);
            const newSelected = [...selectedRows];

            if (currentIndex === -1) {
                newSelected.push(rowId);
            } else {
                newSelected.splice(currentIndex, 1);
            }

            onRowSelect(newSelected);
        }
    };

    const formatCellValue = useCallback((value: any, column: ColumnMeta): string => {
        if (value === null || value === undefined) return '-';

        switch (column.type) {
            case 'date':
                return moment(value).format(column.format || 'YYYY-MM-DD');
            case 'number':
                return typeof value === 'number'
                    ? column.format
                        ? value.toLocaleString()
                        : value.toString()
                    : value;
            case 'boolean':
                return value ? 'Yes' : 'No';
            case 'select':
                if (column.dataSourceKey && dataSource[column.dataSourceKey]) {
                    const option = dataSource[column.dataSourceKey].find(
                        (opt) => opt.value === value
                    );
                    return option?.text || value;
                }
                return value;
            default:
                return value.toString();
        }
    }, [dataSource]);

    const applyFilter = useCallback((value: any, filter: ColumnFilter, column: ColumnMeta): boolean => {
        if (!filter.value) return true;

        const cellValue = value === null || value === undefined ? '' : formatCellValue(value, column).toLowerCase();
        const filterValue = filter.value.toLowerCase();

        switch (filter.operator) {
            case 'startsWith':
                return cellValue.startsWith(filterValue);
            case 'endsWith':
                return cellValue.endsWith(filterValue);
            case 'equals':
                return cellValue === filterValue;
            case 'contains':
            default:
                return cellValue.includes(filterValue);
        }
    }, [formatCellValue]);

    // Filter rows
    const filteredRows = useMemo(() => {
        return rows.filter((row) => {
            return Object.keys(filters).every((field) => {
                const filter = filters[field];
                if (!filter.value) return true;

                const cellValue = row[field];
                const column = columns.find((col) => col.field === field);
                if (!column) return true;

                return applyFilter(cellValue, filter, column);
            });
        });
    }, [rows, filters, columns, applyFilter]);

    // Sort rows
    const sortedRows = useMemo(() => {
        if (!sortField) return filteredRows;

        return [...filteredRows].sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            let comparison = 0;
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                comparison = aValue - bValue;
            } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                comparison = aValue.localeCompare(bValue);
            } else {
                comparison = String(aValue).localeCompare(String(bValue));
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [filteredRows, sortField, sortOrder]);

    // Paginate rows
    const start = page * rowsPerPage;
    const paginatedRows = sortedRows.slice(start, start + rowsPerPage);

    const isAllSelected = useMemo(() => {
        return paginatedRows.length > 0 && paginatedRows.every(row => selectedRows.includes(row[rowIdField]));
    }, [paginatedRows, selectedRows, rowIdField]);

    const isSomeSelected = useMemo(() => {
        return paginatedRows.some(row => selectedRows.includes(row[rowIdField])) && !isAllSelected;
    }, [paginatedRows, selectedRows, rowIdField, isAllSelected]);

    const frozenColumns = useMemo(() => columns.filter(col => col.frozen), [columns]);
    const scrollableColumns = useMemo(() => columns.filter(col => !col.frozen), [columns]);

    const renderCell = (row: RowData, column: ColumnMeta, rowId: string) => {
        const value = row[column.field];
        const isEditing = editingCell?.rowId === rowId && editingCell?.field === column.field;

        if (isEditing && column.editable) {
            if (column.type === 'select' && column.dataSourceKey && dataSource[column.dataSourceKey]) {
                return (
                    <Select
                        size="small"
                        value={value || ''}
                        onChange={(e) => handleCellEdit(rowId, column.field, e.target.value)}
                        onBlur={() => setEditingCell(null)}
                        autoFocus
                        fullWidth
                    >
                        {dataSource[column.dataSourceKey].map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.text}
                            </MenuItem>
                        ))}
                    </Select>
                );
            } else {
                return (
                    <TextField
                        size="small"
                        type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
                        value={value || ''}
                        onChange={(e) => handleCellEdit(rowId, column.field, e.target.value)}
                        onBlur={() => setEditingCell(null)}
                        autoFocus
                        fullWidth
                    />
                );
            }
        }

        return (
            <Box
                onClick={() => column.editable && setEditingCell({ rowId, field: column.field })}
                sx={{
                    cursor: column.editable ? 'pointer' : 'default',
                    '&:hover': column.editable ? { backgroundColor: 'action.hover' } : {},
                }}
            >
                {formatCellValue(value, column)}
            </Box>
        );
    };

    return (
        <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow>
                        {onRowSelect && (
                            <TableCell 
                                padding="checkbox" 
                                rowSpan={2}
                                sx={{
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 3,
                                    backgroundColor: 'background.paper',
                                }}
                            >
                                <Checkbox
                                    indeterminate={isSomeSelected}
                                    checked={isAllSelected}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                />
                            </TableCell>
                        )}
                        {frozenColumns.map((column, index) => {
                            const leftPosition = onRowSelect ? 56 : 0;
                            const offset = frozenColumns.slice(0, index).reduce((sum, col) => sum + (col.width || 100), 0);
                            
                            return (
                                <TableCell
                                    key={column.field}
                                    align={column.align || 'left'}
                                    style={{ minWidth: column.width }}
                                    sx={{
                                        position: 'sticky',
                                        left: leftPosition + offset,
                                        zIndex: 2,
                                        backgroundColor: 'background.paper',
                                        borderRight: '2px solid',
                                        borderColor: 'divider',
                                    }}
                                >
                                    {column.sortable ? (
                                        <TableSortLabel
                                            active={sortField === column.field}
                                            direction={sortField === column.field ? sortOrder : 'asc'}
                                            onClick={() => handleSort(column.field)}
                                        >
                                            {column.header}
                                        </TableSortLabel>
                                    ) : (
                                        column.header
                                    )}
                                </TableCell>
                            );
                        })}
                        {scrollableColumns.map((column) => (
                            <TableCell
                                key={column.field}
                                align={column.align || 'left'}
                                style={{ minWidth: column.width }}
                            >
                                {column.sortable ? (
                                    <TableSortLabel
                                        active={sortField === column.field}
                                        direction={sortField === column.field ? sortOrder : 'asc'}
                                        onClick={() => handleSort(column.field)}
                                    >
                                        {column.header}
                                    </TableSortLabel>
                                ) : (
                                    column.header
                                )}
                            </TableCell>
                        ))}
                    </TableRow>
                    <TableRow>
                        {frozenColumns.map((column, index) => {
                            const leftPosition = onRowSelect ? 56 : 0;
                            const offset = frozenColumns.slice(0, index).reduce((sum, col) => sum + (col.width || 100), 0);
                            
                            return (
                                <TableCell
                                    key={`filter-${column.field}`}
                                    align={column.align || 'left'}
                                    sx={{
                                        py: 1,
                                        position: 'sticky',
                                        left: leftPosition + offset,
                                        zIndex: 2,
                                        backgroundColor: 'background.paper',
                                        borderRight: '2px solid',
                                        borderColor: 'divider',
                                    }}
                                >
                                    {column.filterable && (
                                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                            <FormControl size="small" sx={{ minWidth: 40 }}>
                                                <Select
                                                    value={filters[column.field]?.operator || 'contains'}
                                                    onChange={(e) => handleFilterOperatorChange(column.field, e.target.value as FilterOperator)}
                                                    variant="outlined"
                                                    sx={{ 
                                                        '& .MuiSelect-select': { 
                                                            py: 0.5,
                                                            pr: '24px !important',
                                                        },
                                                    }}
                                                >
                                                    <MenuItem value="contains">⊃</MenuItem>
                                                    <MenuItem value="startsWith">A*</MenuItem>
                                                    <MenuItem value="endsWith">*Z</MenuItem>
                                                    <MenuItem value="equals">=</MenuItem>
                                                </Select>
                                            </FormControl>
                                            <TextField
                                                size="small"
                                                placeholder="Filter..."
                                                value={filters[column.field]?.value || ''}
                                                onChange={(e) => handleFilterChange(column.field, e.target.value)}
                                                sx={{ flex: 1, minWidth: 80 }}
                                                inputProps={{ style: { fontSize: '0.875rem' } }}
                                            />
                                        </Box>
                                    )}
                                </TableCell>
                            );
                        })}
                        {scrollableColumns.map((column) => (
                            <TableCell
                                key={`filter-${column.field}`}
                                align={column.align || 'left'}
                                sx={{ py: 1 }}
                            >
                                {column.filterable && (
                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                        <FormControl size="small" sx={{ minWidth: 40 }}>
                                            <Select
                                                value={filters[column.field]?.operator || 'contains'}
                                                onChange={(e) => handleFilterOperatorChange(column.field, e.target.value as FilterOperator)}
                                                variant="outlined"
                                                sx={{ 
                                                    '& .MuiSelect-select': { 
                                                        py: 0.5,
                                                        pr: '24px !important',
                                                    },
                                                }}
                                            >
                                                <MenuItem value="contains">⊃</MenuItem>
                                                <MenuItem value="startsWith">A*</MenuItem>
                                                <MenuItem value="endsWith">*Z</MenuItem>
                                                <MenuItem value="equals">=</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <TextField
                                            size="small"
                                            placeholder="Filter..."
                                            value={filters[column.field]?.value || ''}
                                            onChange={(e) => handleFilterChange(column.field, e.target.value)}
                                            sx={{ flex: 1, minWidth: 80 }}
                                            inputProps={{ style: { fontSize: '0.875rem' } }}
                                        />
                                    </Box>
                                )}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {paginatedRows.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length + (onRowSelect ? 1 : 0)}
                                align="center"
                                sx={{ py: 4, color: 'text.secondary' }}
                            >
                                No data available
                            </TableCell>
                        </TableRow>
                    ) : (
                        paginatedRows.map((row) => {
                            const rowId = row[rowIdField];
                            const isSelected = selectedRows.indexOf(rowId) !== -1;

                            return (
                                <TableRow
                                    key={rowId}
                                    hover
                                    selected={isSelected}
                                    sx={{ cursor: onRowSelect ? 'pointer' : 'default' }}
                                >
                                    {onRowSelect && (
                                        <TableCell 
                                            padding="checkbox"
                                            onClick={() => handleSelectRow(rowId)}
                                            sx={{
                                                position: 'sticky',
                                                left: 0,
                                                zIndex: 1,
                                                backgroundColor: 'background.paper',
                                            }}
                                        >
                                            <Checkbox checked={isSelected} />
                                        </TableCell>
                                    )}
                                    {frozenColumns.map((column, index) => {
                                        const leftPosition = onRowSelect ? 56 : 0;
                                        const offset = frozenColumns.slice(0, index).reduce((sum, col) => sum + (col.width || 100), 0);
                                        
                                        return (
                                            <TableCell
                                                key={column.field}
                                                align={column.align || 'left'}
                                                sx={{
                                                    position: 'sticky',
                                                    left: leftPosition + offset,
                                                    zIndex: 1,
                                                    backgroundColor: 'background.paper',
                                                    borderRight: '2px solid',
                                                    borderColor: 'divider',
                                                }}
                                            >
                                                {renderCell(row, column, rowId)}
                                            </TableCell>
                                        );
                                    })}
                                    {scrollableColumns.map((column) => (
                                        <TableCell
                                            key={column.field}
                                            align={column.align || 'left'}
                                        >
                                            {renderCell(row, column, rowId)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
            <TablePagination
                component="div"
                count={sortedRows.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                sx={{
                    borderTop: '1px solid',
                    borderColor: 'divider',
                }}
            />
        </TableContainer>
    );
}
