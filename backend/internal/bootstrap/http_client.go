package bootstrap

import (
	"go-backend/internal/extensions"
	"net/http"
	"time"
)

type HttpClient struct {
	baseUrl string
	client  *http.Client
}

func NewHttpClient(baseURL string) *HttpClient {
	cfg := extensions.GetConfig()

	return &HttpClient{
		baseUrl: baseURL,
		client: &http.Client{
			Timeout: time.Duration(cfg.Env.HTTP_CLIENT_TIMEOUT_MIN) * time.Minute,
		},
	}
}
