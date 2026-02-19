export interface FilterPayload {
  filter_key: string
}

export interface FilterSearchParam {
  search_param: Record<string, any>;      // add
  dest: string
  cols_filter_groups: ColsFilterGroup[]
  template: FilterTemplate
}

export interface ColsFilterGroup {
  column_group_id: number
  column_group_index: number
  column_group_text: string
}

export interface FilterTemplate {
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
  multiple?: boolean
  disabled?: boolean
  options?: SelectOption[]
}

export interface Cascading{
  depends_on: string
  group_key: string
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
