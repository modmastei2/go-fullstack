package shared

type CalendarParam struct {
	CalendarDateFrom string `json:"calendar_date_from"`
	CalendarDateTo   string `json:"calendar_date_to"`
}

type CalendarModel struct { // head
	Calendars []Calendar `json:"calendars"`
}

type Calendar struct {
	CalendarDate  string         `json:"calendar_date"`
	CalendarItems []CalendarItem `json:"calendar_items"`
}

type CalendarItem struct {
	ProductCode      string          `json:"product_code"`
	EventCode        string          `json:"event_code"`
	EventId          int             `json:"event_id"`
	EventColor       string          `json:"event_color"`
	EventBorderColor string          `json:"event_border_color"`
	EventIsRead      bool            `json:"event_is_read"`
	CalendarSection  CalendarSection `json:"calendar_section"`
}

type CalendarSection struct {
	Row   int          `json:"row"`
	Text  string       `json:"text"`
	Attrs GeneralAttrs `json:"attrs,omitempty"`
}
