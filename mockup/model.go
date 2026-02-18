package main

type RequestModel struct {
	Message string `json:"message"`
}

type ResponseModel[T any] struct {
	Success   bool           `json:"success"`
	Status    int            `json:"status"`
	Message   string         `json:"message"`
	Timestamp string         `json:"timestamp"`
	Info      infoModel      `json:"info,omitempty"`
	Result    ResultModel[T] `json:"result,omitempty"`
}

type infoModel struct {
	ApiCode        string `json:"api_code"`
	ApiName        string `json:"api_name"`
	ApiDescription string `json:"api_description"`
}

type ResultModel[T any] struct {
	Data T `json:"data"`
}

// ===== Get Filter & Search Param

type FilterSearchParam struct {
	SearchParam map[string]any `json:"search_param"`
	Template    FilterTemplate `json:"template"`
}

type FilterTemplate struct {
	DetailSection DetailSection `json:"detail_section"`
}

type DetailSection struct {
	Grid    Grid     `json:"grid"`
	Details []Detail `json:"details"`
}

type Grid struct {
	Columns   int `json:"columns"`
	RowGap    int `json:"rowGap"`
	ColumnGap int `json:"columnGap"`
}

type Detail struct {
	Row     int   `json:"row"`
	Order   int   `json:"order"`
	ColSpan int   `json:"col_span"`
	Value   Value `json:"value"`
}

type Value struct {
	Id              string                   `json:"id"`
	Type            string                   `json:"type"`
	Cascading       Cascading                `json:"cascading,omitempty"`
	Lines           []Lines                  `json:"lines,omitempty"`
	Required        bool                     `json:"required,omitempty"`
	Placeholder     string                   `json:"placeholder,omitempty"`
	ShowClearButton bool                     `json:"showClearButton,omitempty"`
	Disabled        bool                     `json:"disabled,omitempty"`
	Options         []map[string]interface{} `json:"options,omitempty"`
}

type Cascading struct {
	DependsOn string `json:"depends_on"`
	GroupKey  string `json:"group_key"`
}

type Lines struct {
	Segments []Segments `json:"segments"`
}

type Segments struct {
	Text  string `json:"text"`
	Attrs Attrs  `json:"attrs,omitempty"`
}

type Attrs struct {
	Class string `json:"class"`
}

// type SelectOptions struct {
// 	Text  string `json:"text"`
// 	Value string `json:"value"`
// }
