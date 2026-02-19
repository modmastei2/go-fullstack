package shared

// label components
type LabelValue struct {
	Text  string       `json:"text"`
	Attrs GeneralAttrs `json:"attrs,omitempty"`
}
