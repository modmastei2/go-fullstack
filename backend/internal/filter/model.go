package filter

type FilterPayload struct {
	FilterKey string `json:"filter_key"`
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
