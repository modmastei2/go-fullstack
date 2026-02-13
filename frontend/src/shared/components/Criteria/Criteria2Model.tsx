export interface ResponseResult {
  data: Data
}

export interface Data {
  search_param: Record<string, any>;      // add
  cols_filter_groups: ColsFilterGroup[]
  transaction_history_search_template?: TransactionHistorySearchTemplate
}

export interface SearchView {
  view_id: number
  view_index: number
  view_text: string
}

export interface ColsFilterGroup {
  column_group_id: number
  column_group_index: number
  column_group_text: string
}

export interface ProductsEvent {
  product_code: string
  events: Event[]
}

export interface Event {
  event_master_id: number
  event_index: number
  event_code: string
}

export interface SaleTeam {
  sale_team_id: number
  sale_team_index: number
  sale_team_text: string
  sales: Sale[]
}

export interface Sale {
  sale_id: string
  sale_index: number
  sale_name_text: string
}

export interface TransactionHistorySearchTemplate {
  detail_section: DetailSection
}

export interface DetailSection {
  grid: Grid
  details: Detail[]
}

export interface Grid {
  columns: number
  rowGap: number
  columnGap: number
}

export interface Detail {
  row: number
  order: number
  col_span: number
  value: Value
}

export interface Value {
  id: string
  type: string
  cascading?: Cascading
  lines?: Line[]
  required?: boolean
  placeholder?: string
  showClearButton?: boolean
  disabled?: boolean
  options?: SelectOption[]
}

export interface Cascading{
  dependsOn: string
  groupKey: string
}

export interface Line {
  segments: Segment[]
}

export interface Segment {
  text: string
  attrs?: Attrs
}

export interface Attrs {
  class: string
}

export interface SelectOption {
  text: string
  value: string
  [key: string]: string // cascade key force to string because Select value is string
}
