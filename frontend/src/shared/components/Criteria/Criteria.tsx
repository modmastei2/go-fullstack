import { useRef, useState, useEffect } from 'react';
import type { GetFilterResponse, CriteriaGroupModel, CriteriaModel } from './CriteriaModel';
import api from '../../handlers/api.handler';

export type CriteriaKey = 'dashboard' | 'historical';

export interface CriteriaProps {
    criteriaKey?: CriteriaKey;
}

export default function Criteria({ criteriaKey = 'dashboard' }: CriteriaProps) {
    const isInitialized = useRef(false);
    const [groups, setGroups] = useState<CriteriaGroupModel[] | null>(null);

    useEffect(() => {
        if (isInitialized.current) return;

        api.post(`/filter/get-${criteriaKey}-filter`, {
            Sale_Id: '12345',
        }).then((response) => {
            console.log('Filter Response:', response.data);
            const data = response.data as GetFilterResponse;
            setGroups(data.group);
        });

        isInitialized.current = true;
    }, [criteriaKey]);

    const renderInput = (criterion: CriteriaModel) => {
        const inputClass = "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
        
        switch (criterion.type) {
            case 'dropdown':
                return (
                    <select className={inputClass}>
                        {criterion.data_source && criterion.data_source.length > 0 && criterion.data_source[0].value === '' ? (
                            <>
                                {criterion.data_source.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.text}
                                    </option>
                                ))}
                            </>
                        ) : (
                            <>
                                <option value="">Select {criterion.display_expr}</option>
                                {criterion.data_source?.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.text}
                                    </option>
                                ))}
                            </>
                        )}
                    </select>
                );
            case 'date':
                return <input type="date" className={inputClass} />;
            case 'date_range':
                return (
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">From</label>
                            <input type="date" className={inputClass} defaultValue="2025-08-01" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">To</label>
                            <input type="date" className={inputClass} defaultValue="2026-08-01" />
                        </div>
                    </div>
                );
            case 'text':
                return <input type="text" className={inputClass} />;
            case 'number':
                return <input type="number" className={inputClass} />;
            default:
                return null;
        }
    };

    return (
        <>
            {groups?.map((group, groupIndex) => (
                <div key={groupIndex} >
                    <h3 className="text-lg font-semibold mb-4">{group.text}</h3>
                    <div className={`grid grid-cols-1 md:grid-cols-${group.md_col} lg:grid-cols-${group.lg_col} gap-4`}>
                        {group.criteria.map((criterion) => (
                            <div 
                                key={criterion.name} 
                                className={criterion.col_span > 1 ? `md:col-span-${criterion.col_span} lg:col-span-${criterion.col_span}` : ''}
                            >
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {criterion.display_expr}
                                </label>
                                {renderInput(criterion)}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </>
    );
}
