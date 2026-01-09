package shared

type ErrorResponse struct {
	ErrorCode string `json:"code"`
	Message   string `json:"message"`
}
