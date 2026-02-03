package filter

type GetFilterParam struct {
	Sale_Id string `json:"sale_id"`
}

type GetFilterResponse struct {
	Meta_Group  []MetaGroupModel             `json:"meta_group"`
	Data_Source map[string][]DataSourceModel `json:"data_source"`
	// value dynamic field
	Value map[string]interface{} `json:"value"`
}

type MetaGroupModel struct {
	Text  string      `json:"text"`
	SmCol int         `json:"sm_col"`
	MdCol int         `json:"md_col"`
	LgCol int         `json:"lg_col"`
	Meta  []MetaModel `json:"meta"`
}

type MetaModel struct {
	Name          string `json:"name"`
	DisplayExpr   string `json:"display_expr"`
	Type          string `json:"type"` // dropdown, date, date_range, text, number
	ColSpan       int    `json:"col_span"`
	DataSourceKey string `json:"data_source_key,omitempty"`
}

type DataSourceModel struct {
	Text        string `json:"text"`
	Value       string `json:"value"`
	DisplayExpr string `json:"display_expr"`
	ValueExpr   string `json:"value_expr"`
	Disabled    bool   `json:"disabled"`
}
