package shared

type EventModel struct {
	EventTemplateId int    `json:"event_template_id"`
	ProductCode     string `json:"product_code"`
	EventCode       string `json:"event_code"`
	EventMasterId   int    `json:"event_master_id"`
	EventColor      string `json:"event_color"`

	HeaderSection HeaderSection        `json:"header_section"`
	DetailSection GeneralDetailSection `json:"detail_section"`
	TableSection  TableModel           `json:"table_section"`
}

type HeaderSection struct {
	Details []HeaderSectionDetail `json:"details"`
}

type HeaderSectionDetail struct {
	Row   int          `json:"row"`
	Text  string       `json:"text"`
	Attrs GeneralAttrs `json:"attrs,omitempty"`
}
