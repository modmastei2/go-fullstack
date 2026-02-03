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
} from '@mui/material';
import type { ColumnDefPremium, ColumnCategory } from './DataGridPremiumModel';

type CategoryType = 'all' | ColumnCategory;

interface ColumnSelectorPremiumProps {
    columns: ColumnDefPremium[];
    visibleColumns: string[];
    onVisibilityChange: (columnFields: string[]) => void;
}

export default function ColumnSelectorPremium({
    columns,
    visibleColumns,
    onVisibilityChange,
}: ColumnSelectorPremiumProps) {
    const coreColumns = useMemo(
        () => columns.filter((col) => col.category === 'core').map((col) => col.field!),
        [columns]
    );

    const categoryColumns = useMemo(() => ({
        all: columns.filter((col) => col.category !== 'core').map((col) => col.field!),
        bond: columns.filter((col) => col.category === 'bond').map((col) => col.field!),
        mf: columns.filter((col) => col.category === 'mf').map((col) => col.field!),
        sn: columns.filter((col) => col.category === 'sn').map((col) => col.field!),
    }), [columns]);

    const selectedCategories = useMemo<CategoryType[]>(() => {
        const categories: CategoryType[] = [];
        
        // Check which categories are fully visible
        const hasAllBond = categoryColumns.bond.every(field => visibleColumns.includes(field));
        const hasAllMf = categoryColumns.mf.every(field => visibleColumns.includes(field));
        const hasAllSn = categoryColumns.sn.every(field => visibleColumns.includes(field));

        if (hasAllBond) categories.push('bond');
        if (hasAllMf) categories.push('mf');
        if (hasAllSn) categories.push('sn');
        
        // Check if all non-core columns are visible
        if (hasAllBond && hasAllMf && hasAllSn) {
            categories.length = 0;
            categories.push('all');
        }

        return categories;
    }, [visibleColumns, categoryColumns]);

    const handleCategoryChange = (categories: CategoryType[]) => {
        const newColumns = new Set(coreColumns); // Always include core

        // If 'all' is selected, select everything
        if (categories.includes('all')) {
            categoryColumns.all.forEach(field => newColumns.add(field));
        } else {
            // Add columns based on selected categories
            categories.forEach((category) => {
                if (category !== 'all' && category !== 'core') {
                    categoryColumns[category].forEach((field: string) => newColumns.add(field));
                }
            });
        }

        onVisibilityChange(Array.from(newColumns));
    };

    const getCategoryLabel = (category: CategoryType): string => {
        const labels: Record<CategoryType, string> = {
            all: 'All Assets',
            core: 'Core',
            bond: 'Bond',
            mf: 'Mutual Fund',
            sn: 'Structure Note',
        };
        return labels[category];
    };

    const getColumnLabel = (field: string) => {
        return columns.find((c) => c.field === field)?.headerName || field;
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
                {visibleColumns.length > 0 ? (
                    visibleColumns.map((field) => {
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
                        No columns visible
                    </Box>
                )}
            </Box>
        </Box>
    );
}
