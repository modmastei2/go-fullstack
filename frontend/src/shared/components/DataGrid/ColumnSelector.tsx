import { useMemo } from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    Chip,
    Box,
    OutlinedInput,
} from '@mui/material';
import type { ColumnMeta } from './DataGridModel';

type CategoryType = 'all' | 'bond' | 'mf' | 'sn';

interface ColumnSelectorProps {
    columns: ColumnMeta[];
    selectedColumns: string[];
    onColumnsChange: (columns: string[]) => void;
}

export default function ColumnSelector({
    columns,
    selectedColumns,
    onColumnsChange,
}: ColumnSelectorProps) {
    const coreColumns = useMemo(
        () => columns.filter((col) => col.category === 'core').map((col) => col.field),
        [columns]
    );

    const categoryColumns = useMemo(() => ({
        all: columns.filter((col) => col.category !== 'core').map((col) => col.field),
        bond: columns.filter((col) => col.category === 'bond').map((col) => col.field),
        mf: columns.filter((col) => col.category === 'mf').map((col) => col.field),
        sn: columns.filter((col) => col.category === 'sn').map((col) => col.field),
    }), [columns]);

    const selectedCategories = useMemo<CategoryType[]>(() => {
        const categories: CategoryType[] = [];
        
        // Check which categories are fully selected
        const hasAllBond = categoryColumns.bond.every(field => selectedColumns.includes(field));
        const hasAllMf = categoryColumns.mf.every(field => selectedColumns.includes(field));
        const hasAllSn = categoryColumns.sn.every(field => selectedColumns.includes(field));

        if (hasAllBond) categories.push('bond');
        if (hasAllMf) categories.push('mf');
        if (hasAllSn) categories.push('sn');
        
        // Check if all non-core columns are selected
        if (hasAllBond && hasAllMf && hasAllSn) {
            categories.length = 0;
            categories.push('all');
        }

        return categories;
    }, [selectedColumns, categoryColumns]);

    const handleCategoryChange = (categories: CategoryType[]) => {
        const newColumns = new Set(coreColumns); // Always include core

        // If 'all' is selected, select everything
        if (categories.includes('all')) {
            categoryColumns.all.forEach(field => newColumns.add(field));
        } else {
            // Add columns based on selected categories
            categories.forEach((category) => {
                if (category !== 'all') {
                    categoryColumns[category].forEach(field => newColumns.add(field));
                }
            });
        }

        onColumnsChange(Array.from(newColumns));
    };

    const getCategoryLabel = (category: CategoryType): string => {
        const labels: Record<CategoryType, string> = {
            all: 'All Assets',
            bond: 'Bond',
            mf: 'Mutual Fund',
            sn: 'Structure Note',
        };
        return labels[category];
    };

    const getColumnLabel = (field: string) => {
        return columns.find((c) => c.field === field)?.header || field;
    };

    const categoryOptions: CategoryType[] = ['all', 'bond', 'mf', 'sn'];

    return (
        <Box display="flex" flexDirection="column" gap={2} mb={3}>
            {/* Category Multi-Select */}
            <FormControl size="small" fullWidth>
                <InputLabel>Asset Categories</InputLabel>
                <Select
                    multiple
                    value={selectedCategories}
                    label="Asset Categories"
                    onChange={(e) => handleCategoryChange(e.target.value as CategoryType[])}
                    input={<OutlinedInput label="Asset Categories" />}
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((category) => (
                                <Chip
                                    key={category}
                                    label={getCategoryLabel(category)}
                                    size="small"
                                    color="primary"
                                />
                            ))}
                        </Box>
                    )}
                >
                    {categoryOptions.map((category) => (
                        <MenuItem key={category} value={category}>
                            <Checkbox checked={selectedCategories.includes(category)} />
                            <ListItemText primary={getCategoryLabel(category)} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Selected Columns Display */}
            <Box 
                sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 1,
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    minHeight: 52,
                    bgcolor: 'background.paper',
                }}
            >
                {selectedColumns.length > 0 ? (
                    selectedColumns.map((field) => {
                        const isCore = coreColumns.includes(field);
                        return (
                            <Chip
                                key={field}
                                label={getColumnLabel(field)}
                                size="small"
                                color={isCore ? 'default' : 'primary'}
                                variant={isCore ? 'outlined' : 'filled'}
                                disabled={isCore}
                            />
                        );
                    })
                ) : (
                    <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                        No columns selected
                    </Box>
                )}
            </Box>
        </Box>
    );
}
