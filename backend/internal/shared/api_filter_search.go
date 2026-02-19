package shared

type FilterParam struct {
	FilterKey string `json:"filter_key"`
}

type FilterModel struct { // head
	SearchParam map[string]any       `json:"search_param"`
	Dest        string               `json:"dest,omitempty"`
	Template    GeneralDetailSection `json:"template,omitempty"`
}
