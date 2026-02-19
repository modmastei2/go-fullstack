import React, { useEffect, useRef } from 'react';
import layoutMap from '../../constants/layout';
import FormControl from '@mui/material/FormControl';
import SelectBox from '../SelectBox/SelectBox';
import api from '../../handlers/api.handler';
import { ResponseResult as ResultModel } from '../../models/response_result.model';
import type { Detail, FilterPayload, FilterSearchParam } from '../../models/filter.model';

export default function Criteria2() {
    const [result, setResult] = React.useState<ResultModel<FilterSearchParam>>();
    const isInitialized = useRef(false);
    // call axios to /get-filter
    useEffect(() => {
        if (isInitialized.current) return;

        isInitialized.current = true;

        api.post<FilterPayload, any>('/filter/get-filter', { filter_key: 'client_360' })
            .then((response) => {
                setResult(response.data);
            })
            .catch((error) => {
                console.error('Error fetching filter data:', error);
            });
    }, []);

    const onChangeHandler = (id: string, value: any) => {
        console.log(id, value);
        setResult((prev: ResultModel<FilterSearchParam> | undefined) => {
            if (!prev) return prev;

            const newSearchParam = {
                ...prev.data.search_param,
                [id]: value,
            };

            const details = prev.data.template.detail_section.details || [];

            // clear children
            const clearChildren = (parentId: string) => {
                details.forEach((detail) => {
                    if (detail.value.cascading?.depends_on === parentId) {
                        // clear value
                        const childId = detail.value.id ?? '';
                        newSearchParam[childId] = '';
                        // recursive clear
                        clearChildren(childId);
                    }
                });
            };

            clearChildren(id);

            return {
                ...prev,
                data: {
                    ...prev.data,
                    search_param: newSearchParam,
                },
            };
        });
    };

    const onClearHandler = (id: string) => {
        onChangeHandler(id, '');
    };

    const renderInput = (detail: Detail) => {
        switch (detail.value.type) {
            case 'dropdown': {
                const key = detail.value.id ?? '';
                const value = result?.data?.search_param?.[key] ?? '';
                const parentValue = detail.value.cascading?.depends_on
                    ? result?.data?.search_param?.[detail.value.cascading.depends_on]
                    : undefined;

                return (
                    <FormControl fullWidth size="small">
                        <SelectBox
                            id={key}
                            value={value}
                            placeholder={detail.value.placeholder ?? `Select an option`}
                            options={detail.value.options ?? []}
                            cascading={detail.value.cascading}
                            parentValue={parentValue}
                            showClearButton={detail.value.showClearButton ?? false}
                            multiple={detail.value.multiple ?? false}
                            disabled={detail.value.disabled ?? false}
                            onChange={onChangeHandler}
                            onClear={onClearHandler}
                        />
                    </FormControl>
                );
            }

            default:
                return null;
        }
    };

    const onClick = () => {
        api.post('/filter/fire-search', { ...result })
            .then((response) => {
                console.log('Search result:', response.data);
            })
            .catch((error) => {
                console.error('Error firing search:', error);
            });
    };

    if (!result) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <div
                className={`grid grid-cols-1 ${layoutMap.mapGridColLg[result.data.template.detail_section.grid.columns]} ${layoutMap.mapColumnGap[result.data.template.detail_section.grid.columnGap]} ${layoutMap.mapRowGap[result.data.template.detail_section.grid.rowGap]}`}>
                {result.data.template.detail_section.details.map((detail, index) => (
                    <div key={detail.value.id + '_' + index} className={`${layoutMap.mapColumnSpanLg[detail.col_span!]}`}>
                        {detail.value.lines?.map((line, lineIndex) => (
                            <div
                                key={detail.value.id + '_' + index + '_' + lineIndex}
                                className={`grid grid-cols-1 lg:flex items-center ${layoutMap.mapColumnGap[result.data.template.detail_section.grid.columnGap]} ${layoutMap.mapRowGap[result.data.template.detail_section.grid.rowGap]}`}>
                                <div className="col-auto">
                                    {line.segments.map((segment, segmentIndex) => (
                                        <React.Fragment key={detail.value.id + '_' + index + '_' + lineIndex + '_' + segmentIndex}>
                                            <span
                                                className={`line-clamp-1 ${segment.attrs?.class || ''} ${layoutMap.mapRequired[detail.value.required && segmentIndex == 0 ? 'true' : 'false']}`}>
                                                {segment.text}
                                            </span>
                                        </React.Fragment>
                                    ))}
                                </div>

                                <div className="lg:flex-1">{renderInput(detail)}</div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <div onClick={onClick}>click</div>
        </>
    );
}
