package shared

type GeneralResponseModel[T FilterModel | GeneralDetailSection | TableModel | CalendarModel | EventModel] struct {
	Success   bool                  `json:"success"`
	Status    int                   `json:"status"`
	Message   string                `json:"message"`
	Timestamp string                `json:"timestamp"`
	Info      GeneralInfoModel      `json:"info,omitempty"`
	Result    GeneralResultModel[T] `json:"result,omitempty"`
}

type GeneralInfoModel struct {
	ApiCode        string `json:"api_code"`
	ApiName        string `json:"api_name"`
	ApiDescription string `json:"api_description"`
}

type GeneralResultModel[T any] struct {
	Data T `json:"data"`
}

// ===== use common for grid display
type GeneralDetailSection struct { // head
	DetailSection GeneralGridSection `json:"detail_section"`
}

type GeneralGridSection struct {
	Grid    Grid      `json:"grid"`
	Details []Details `json:"details"`
}

type Grid struct {
	Columns   int `json:"columns"`
	RowGap    int `json:"rowGap"`
	ColumnGap int `json:"columnGap"`
}

type Details struct {
	Id      string     `json:"id"`
	Row     int        `json:"row"`
	Order   int        `json:"order"`
	ColSpan int        `json:"col_span"`
	Icon    IconValue  `json:"icon,omitempty"`  // for icon component
	Label   LabelValue `json:"label,omitempty"` // for label component
	Value   InputValue `json:"value"`           // for input component
}
