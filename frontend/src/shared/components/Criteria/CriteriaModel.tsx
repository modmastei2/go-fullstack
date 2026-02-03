export interface GetFilterParam {
    Sale_Id?: string;
}

export interface GetFilterResponse {
    meta_group: MetaGroupModel[];
    data_source: { [key: string]: DataSourceModel[] };
    value: { [key: string]: any };
}

export interface MetaGroupModel {
    text: string;
    sm_col: number;
    md_col: number;
    lg_col: number;
    meta: MetaModel[];
}

export interface MetaModel {
    name: string;
    display_expr: string;
    type: string; // dropdown, date, date_range, text, number
    col_span: number;
    data_source_key?: string;
}

export interface DataSourceModel {
    text: string;
    value: any;
    display_expr?: string;
    value_expr?: string;
    disabled?: boolean;
}