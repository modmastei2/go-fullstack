import React from 'react';
import layoutMap from '../../constants/layout';
import type { Detail, ResponseResult } from './Criteria2Model';
import FormControl from '@mui/material/FormControl';
import SelectBox from '../SelectBox/SelectBox';

export default function Criteria2() {
    const [result, setResult] = React.useState<ResponseResult>({
        data: {
            search_param: {},
            cols_filter_groups: [],
            transaction_history_search_template: {
                detail_section: {
                    grid: {
                        columns: 12,
                        rowGap: 8,
                        columnGap: 8,
                    },
                    details: [
                        {
                            row: 1,
                            order: 1,
                            col_span: 6,
                            value: {
                                id: 'value_group',
                                type: 'dropdown',
                                required: true,
                                lines: [
                                    {
                                        segments: [
                                            {
                                                text: 'Selected Group:',
                                                attrs: {
                                                    class: 'modal_value_cyan',
                                                },
                                            },
                                            {
                                                text: 'Control view column apply:',
                                                attrs: {
                                                    class: 'text-xs text-gray-600 dark:text-gray-400',
                                                },
                                            },
                                        ],
                                    },
                                ],
                                options: [
                                    {
                                        text: 'Bond Transactions',
                                        value: '1',
                                    },
                                    {
                                        text: 'Mutual Fund Transactions',
                                        value: '2',
                                    },
                                ],
                            },
                        },
                        {
                            row: 1,
                            order: 1,
                            col_span: 3,
                            value: {
                                id: 'sale_team',
                                type: 'dropdown',
                                required: true,
                                placeholder: 'Select All',
                                showClearButton: true,
                                lines: [
                                    {
                                        segments: [
                                            {
                                                text: 'Selected Sale Team:',
                                                attrs: {
                                                    class: 'modal_value_cyan',
                                                },
                                            },
                                        ],
                                    },
                                ],
                                options: [
                                    {
                                        text: 'Team A',
                                        value: 'TEAM_A',
                                        cascadeValue: '1',
                                    },
                                    {
                                        text: 'Team B',
                                        value: 'TEAM_B',
                                        cascadeValue: '1',
                                    },
                                    {
                                        text: 'Team C',
                                        value: 'TEAM_C',
                                        cascadeValue: '2',
                                    },
                                    {
                                        text: 'Team D',
                                        value: 'TEAM_D',
                                        cascadeValue: '2',
                                    },
                                ],
                            },
                        },
                        {
                            row: 1,
                            order: 1,
                            col_span: 3,
                            value: {
                                id: 'sale_name',
                                type: 'dropdown',
                                cascading: {
                                    dependsOn: 'sale_team',
                                    groupKey: 'team',
                                },
                                required: true,
                                lines: [
                                    {
                                        segments: [
                                            {
                                                text: 'Selected Sale Name:',
                                                attrs: {
                                                    class: 'modal_value_cyan',
                                                },
                                            },
                                            {
                                                text: 'Cascading by Sale Team',
                                                attrs: {
                                                    class: 'text-xs text-gray-600 dark:text-gray-400',
                                                },
                                            },
                                        ],
                                    },
                                ],
                                options: [
                                    {
                                        text: 'Alice Wong',
                                        value: 'ALICE_W',
                                        team: 'TEAM_A',
                                    },
                                    {
                                        text: 'Chris Yamada',
                                        value: 'CHRIS_Y',
                                        team: 'TEAM_A',
                                    },
                                    {
                                        text: 'Darin Chai',
                                        value: 'DARIN_C',
                                        team: 'TEAM_C',
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
        },
    });

    const onChangeHandler = (id: string, value: any) => {
        console.log(id, value);
        setResult((prev) => {
            const newSearchParam = {
                ...prev.data.search_param,
                [id]: value,
            };

            const details = prev.data.transaction_history_search_template?.detail_section.details || [];

            // clear children
            const clearChildren = (parentId: string) => {
                details.forEach((detail) => {
                    if (detail.value.cascading?.dependsOn === parentId) {
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
                const parentValue = detail.value.cascading?.dependsOn
                    ? result?.data?.search_param?.[detail.value.cascading.dependsOn]
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
        console.log(JSON.stringify(result));
    };

    return (
        <>
            <div
                className={`grid grid-cols-1 ${layoutMap.mapGridColLg[result.data.transaction_history_search_template!.detail_section.grid.columns]} ${layoutMap.mapColumnGap[result.data.transaction_history_search_template!.detail_section.grid.columnGap]} ${layoutMap.mapRowGap[result.data.transaction_history_search_template!.detail_section.grid.rowGap]}`}>
                {result.data.transaction_history_search_template!.detail_section.details.map((detail, index) => (
                    <div key={detail.value.id + '_' + index} className={`${layoutMap.mapColumnSpanLg[detail.col_span!]}`}>
                        {detail.value.lines?.map((line, lineIndex) => (
                            <div
                                key={detail.value.id + '_' + index + '_' + lineIndex}
                                className={`grid grid-cols-1 lg:flex items-center ${layoutMap.mapColumnGap[result.data.transaction_history_search_template!.detail_section.grid.columnGap]} ${layoutMap.mapRowGap[result.data.transaction_history_search_template!.detail_section.grid.rowGap]}`}>
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
                                {/* input */}
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
