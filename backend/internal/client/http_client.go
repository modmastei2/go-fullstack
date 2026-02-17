package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"go-backend/internal/extensions"
	"io"
	"log"
	"net"
	"net/http"
	"time"

	"github.com/sony/gobreaker"
)

type XHttpClient struct {
	baseUrl string
	client  *http.Client
	breaker *gobreaker.CircuitBreaker
}

type APIRequestBody struct {
	Message string `json:"message"`
}

type APIResponseBody struct {
	Message string `json:"message"`
}

func NewHttpClient(baseURL string) *XHttpClient {
	cfg := extensions.GetConfig()

	transport := &http.Transport{
		MaxIdleConns:        100,
		MaxIdleConnsPerHost: 20,
		IdleConnTimeout:     90 * time.Second,
		DialContext: (&net.Dialer{
			Timeout:   5 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		TLSHandshakeTimeout: 5 * time.Second,
	}

	httpClient := &http.Client{
		Transport: transport,
		Timeout:   time.Duration(cfg.Env.HTTP_CLIENT_TIMEOUT_MIN) * time.Minute,
	}

	breaker := gobreaker.NewCircuitBreaker(gobreaker.Settings{
		Name:        "HttpClientCircuitBreaker",
		MaxRequests: 3,
		Interval:    60 * time.Second,
		Timeout:     30 * time.Second,
		ReadyToTrip: func(counts gobreaker.Counts) bool {
			return counts.ConsecutiveFailures >= 5
		},
	})

	return &XHttpClient{
		baseUrl: baseURL,
		client:  httpClient,
		breaker: breaker,
	}
}

func (hc *XHttpClient) Do(ctx context.Context, method string, path string, requestBody interface{}, responseBody interface{}) error {
	ctx, cancel := context.WithTimeout(ctx, hc.client.Timeout)
	defer cancel()

	url := hc.baseUrl + path

	cfg := extensions.GetConfig()
	API_KEY := cfg.Secrets.API_KEY
	API_PREFIX := cfg.Secrets.API_PREFIX

	// Generate pretoken and token
	pretoken := time.Now().Format("20060102150405")
	encodedPreToken := extensions.EncodeTextToBase64(pretoken)
	IV := fmt.Sprintf("%s%s", API_PREFIX, pretoken)

	rawToken := time.Now().Format("20060102150405")
	// Encrypt the raw token to create the final token
	token, err := extensions.AesEncrypt(API_KEY, IV, rawToken)
	if err != nil {
		return err
	}

	rb, err := json.Marshal(requestBody)

	encrypted, err := extensions.AesEncrypt(API_KEY, IV, string(rb))
	log.Printf("↖️ Send Request to %s%s with method %s and headers: pretoken=%s, token=%s, encrypted=%s", hc.baseUrl, path, method, encodedPreToken, token, encrypted)
	if err != nil {
		return err
	}

	var APIRequest = APIRequestBody{
		Message: encrypted,
	}

	payload, err := json.Marshal(APIRequest)
	if err != nil {
		return err
	}

	httpRequest, err := http.NewRequestWithContext(ctx, method, url, bytes.NewBuffer(payload))
	if err != nil {
		return err
	}

	httpRequest.Header.Set("Content-Type", "application/json")

	// add header
	httpRequest.Header.Set("requester", "fiber-app")
	httpRequest.Header.Set("pretoken", encodedPreToken)
	httpRequest.Header.Set("token", token)
	httpRequest.Header.Set("application", "KSWP")

	_, err = hc.breaker.Execute(func() (interface{}, error) {
		return nil, extensions.Retry(3, 200*time.Millisecond, func() error {
			resp, err := hc.client.Do(httpRequest)
			if err != nil {
				return err
			}
			defer resp.Body.Close()

			responseBytes, err := io.ReadAll(resp.Body)
			if err != nil {
				return err
			}

			var APIResponse APIResponseBody
			if err := json.Unmarshal(responseBytes, &APIResponse); err != nil {
				return err
			}

			decrypted, err := extensions.AesDecrypt(API_KEY, IV, APIResponse.Message)
			if err != nil {
				return err
			}

			log.Printf("↘️ Received API response with headers: pretoken=%s, token=%s, response=%s", encodedPreToken, token, APIResponse.Message)

			return json.Unmarshal([]byte(decrypted), &responseBody)
		})
	})

	return err
}
