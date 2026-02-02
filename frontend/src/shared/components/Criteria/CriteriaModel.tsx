export interface GetFilterParam {
    Sale_Id?: string;
}

export interface GetFilterResponse {
    group: CriteriaGroupModel[];
}

export interface CriteriaGroupModel {
    text: string;
    sm_col: number;
    md_col: number;
    lg_col: number;
    criteria: CriteriaModel[];
}

export interface CriteriaModel {
    name: string;
    display_expr: string;
    type: string; // dropdown, date, date_range, text, number
    col_span: number;
    data_source?: DataSourceModel[];
}

export interface DataSourceModel {
    text: string;
    value: any;
    display_expr?: string;
    value_expr?: string;
    disabled?: boolean;
}