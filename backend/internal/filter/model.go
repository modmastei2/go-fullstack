package filter

type GetFilterParam struct {
	Sale_Id string `json:"sale_id"`
}

type GetFilterResponse struct {
	Group []CriteriaGroupModel `json:"group"`
}

type CriteriaGroupModel struct {
	Text     string          `json:"text"`
	SmCol    int             `json:"sm_col"`
	MdCol    int             `json:"md_col"`
	LgCol    int             `json:"lg_col"`
	Criteria []CriteriaModel `json:"criteria"`
}

type CriteriaModel struct {
	Name        string            `json:"name"`
	DisplayExpr string            `json:"display_expr"`
	Type        string            `json:"type"` // dropdown, date, date_range, text, number
	ColSpan     int               `json:"col_span"`
	DataSource  []DataSourceModel `json:"data_source,omitempty"`
}

type DataSourceModel struct {
	Text        string `json:"text"`
	Value       string `json:"value"`
	DisplayExpr string `json:"display_expr"`
	ValueExpr   string `json:"value_expr"`
	Disabled    bool   `json:"disabled"`
}
