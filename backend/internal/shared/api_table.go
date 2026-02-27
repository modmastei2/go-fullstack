package shared

type TableModel struct { // head for client360, historical transaction, event notification
	TableTemplate  TableTemplate        `json:"table_template"`
	LegendTemplate GeneralDetailSection `json:"legend_template"`
}

type TableTemplate struct {
	TableSection []TableSection   `json:"table_section"`
	ColsData     []map[string]any `json:"cols_data"`
}

type TableSection struct {
	ColIndex      int    `json:"col_index"`
	ColType       string `json:"col_type"`
	ColHeaderText string `json:"col_header_text"`
	ColValueField string `json:"col_value_field"` // key
	ColLinkField  string `json:"col_link_field,omitempty"`
	ColFreeze     bool   `json:"col_freeze"`
	ColShow       bool   `json:"col_show"`
	ColFormat     string `json:"col_format,omitempty"`

	Attrs TableAttrs `json:"attrs,omitempty"`
}

type TableAttrs struct {
	TableHeader GeneralAttrs `json:"table_header,omitempty"`
	TableCell   GeneralAttrs `json:"table_cell,omitempty"`
}
