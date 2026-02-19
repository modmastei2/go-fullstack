package shared

// input component
type InputValue struct {
	Id              string                   `json:"id"`
	Type            string                   `json:"type"`
	Cascading       Cascading                `json:"cascading,omitempty"`
	Lines           []InputSegments          `json:"lines,omitempty"`
	Required        bool                     `json:"required,omitempty"`
	Placeholder     string                   `json:"placeholder,omitempty"`
	ShowClearButton bool                     `json:"showClearButton,omitempty"`
	Multiple        bool                     `json:"multiple,omitempty"`
	Disabled        bool                     `json:"disabled,omitempty"`
	Options         []map[string]interface{} `json:"options,omitempty"`
}

type Cascading struct {
	DependsOn string `json:"depends_on"`
	GroupKey  string `json:"group_key"`
}

type InputSegments struct {
	Segments []Segments `json:"segments"`
}

type Segments struct {
	Text  string       `json:"text"`
	Attrs GeneralAttrs `json:"attrs,omitempty"`
}
