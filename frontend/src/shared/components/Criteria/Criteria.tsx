import { useRef, useState, useEffect } from 'react';
import { TextField, Select, MenuItem, FormControl, Button } from '@mui/material';
import type { GetFilterResponse, MetaModel } from './CriteriaModel';
import api from '../../handlers/api.handler';
import moment from 'moment';

export type CriteriaKey = 'dashboard' | 'historical';

export interface CriteriaProps {
    criteriaKey?: CriteriaKey;
    onClickSearch?: (filters: any) => void;
}

export default function Criteria({ criteriaKey = 'dashboard', onClickSearch }: CriteriaProps) {
    const isInitialized = useRef(false);
    const [filter, setFilter] = useState<GetFilterResponse | null>(null);
    const [defaultFilter, setDefaultFilter] = useState<GetFilterResponse | null>(null);

    useEffect(() => {
        if (isInitialized.current) return;

        api.post(`/filter/get-${criteriaKey}-filter`, {
            Sale_Id: '12345',
        }).then((response) => {
            console.log('Filter Response:', response.data);
            const data = response.data as GetFilterResponse;
            setFilter(data);
            setDefaultFilter(data);
        });

        isInitialized.current = true;
    }, [criteriaKey]);

    const onChangeHandler = (criterionName: string, value: any) => {
        setFilter((prevFilter) => { 
            if (!prevFilter) return prevFilter;

            const newValue = { ...(prevFilter.value || {}), [criterionName]: value };
            return { ...prevFilter, value: newValue };
        });
    };

    const onChangeDateRangeHandler = (criterionName: string, range: {from?: string, to?: string}) => {
        setFilter((prevFilter) => {
            if (!prevFilter) return prevFilter;

            let from: string;
            let to: string;
            
            if (range.from) {
                from = moment(range.from).format('YYYY-MM-DD');
            } else {
                const existingValue = prevFilter.value?.[criterionName];
                from = existingValue?.from ? moment(existingValue.from).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
            }

            if (range.to) {
                to = moment(range.to).format('YYYY-MM-DD');
            } else {
                const existingValue = prevFilter.value?.[criterionName];
                to = existingValue?.to ? moment(existingValue.to).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
            }

            // if new from is greater than to, set to to from
            console.log('Date Range Change:', { criterionName, from, to });
            if (!!range.from && from > to) {
                to = from;
            }

            if (!!range.to &&to < from) {
                from = to;
            }

            const newValue = { ...(prevFilter.value || {}), [criterionName]: { from, to } };
            return { ...prevFilter, value: newValue };
        });
    };

    const renderInput = (criterion: MetaModel, value: any) => {
        switch (criterion.type) {
            case 'dropdown':
                return (
                    <FormControl fullWidth size="small">
                        <Select 
                            value={value || ''} 
                            onChange={(e) => onChangeHandler(criterion.name, e.target.value)}
                            displayEmpty
                        >
                            {criterion.data_source_key &&
                            filter?.data_source[criterion.data_source_key] &&
                            filter.data_source[criterion.data_source_key].length > 0 &&
                            filter.data_source[criterion.data_source_key][0].value === ''
                                ? filter.data_source[criterion.data_source_key].map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.text}
                                    </MenuItem>
                                ))
                                : [
                                    <MenuItem key="" value="">Select {criterion.display_expr}</MenuItem>,
                                    ...(filter?.data_source[criterion.data_source_key || '']?.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.text}
                                        </MenuItem>
                                    )) || [])
                                ]}
                        </Select>
                    </FormControl>
                );
            case 'date':
                return (
                    <TextField 
                        type="date" 
                        size="small" 
                        fullWidth 
                        value={value || ''} 
                        onChange={(e) => onChangeHandler(criterion.name, e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                );
            case 'date_range':
                return (
                    <div className="flex flex-wrap gap-2">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">From</label>
                            <TextField 
                                type="date" 
                                size="small" 
                                fullWidth 
                                value={value?.from || ''} 
                                onChange={(e) => onChangeDateRangeHandler(criterion.name, { from: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">To</label>
                            <TextField 
                                type="date" 
                                size="small" 
                                fullWidth 
                                value={value?.to || ''} 
                                onChange={(e) => onChangeDateRangeHandler(criterion.name, { to: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </div>
                    </div>
                );
            case 'text':
                return (
                    <TextField 
                        type="text" 
                        size="small" 
                        fullWidth 
                        value={value || ''} 
                        onChange={(e) => onChangeHandler(criterion.name, e.target.value)}
                    />
                );
            case 'number':
                return (
                    <TextField 
                        type="number" 
                        size="small" 
                        fullWidth 
                        value={value || ''} 
                        onChange={(e) => onChangeHandler(criterion.name, e.target.value)}
                    />
                );
            default:
                return null;
        }
    };

    const handleSearchClick = () => {
        if (onClickSearch) {
            onClickSearch(filter);
        }
    };

    const handleClearClick = () => {
        if (!defaultFilter) return;
        
        // Deep clone using JSON to ensure new object reference
        const resetFilter: GetFilterResponse = JSON.parse(JSON.stringify(defaultFilter));
        setFilter(resetFilter);
    }

    return (
        <>
            {filter?.meta_group.map((group, groupIndex) => (
                <div key={groupIndex}>
                    <h3 className="text-lg font-semibold mb-4">{group.text}</h3>
                    <div className={`grid grid-cols-1 md:grid-cols-${group.md_col} lg:grid-cols-${group.lg_col} gap-4`}>
                        {group.meta.map((criterion) => (
                            <div
                                key={criterion.name}
                                className={
                                    criterion.col_span > 1 ? `md:col-span-${criterion.col_span} lg:col-span-${criterion.col_span}` : ''
                                }>
                                <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">{criterion.display_expr}</label>
                                {renderInput(criterion, filter.value?.[criterion.name])}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            {/* search & clear button alignment right on md and larger screens sm left */}
            <div className="flex md:justify-end space-x-2">
                <Button
                    onClick={handleSearchClick}
                    variant="contained"
                    color="primary">
                    Search
                </Button>
                <Button
                    onClick={handleClearClick}
                    variant="outlined"
                    color="secondary">
                    Clear
                </Button>
            </div>
        </>
    );
}
