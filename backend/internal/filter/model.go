package filter

type GetFilterParam struct {
	Sale_Id string `json:"sale_id"`
}

type GetFilterResponse struct {
	Criteria []CriteriaModel `json:"criteria"`
}

type CriteriaModel struct {
	Name        string            `json:"name"`
	DisplayExpr string            `json:"display_expr"`
	Type        string            `json:"type"` // dropdown, date, date_range, text, number
	DataSource  []DataSourceModel `json:"data_source,omitempty"`
}

type DataSourceModel struct {
	Text        string `json:"text"`
	Value       string `json:"value"`
	DisplayExpr string `json:"display_expr"`
	ValueExpr   string `json:"value_expr"`
	Disabled    bool   `json:"disabled"`
}
