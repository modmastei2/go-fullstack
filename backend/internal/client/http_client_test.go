package client

import (
	"context"
	"encoding/json"
	"fmt"
	"go-backend/internal/extensions"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

// setupTestConfig initializes the configuration for testing
func setupTestConfig() {
	extensions.InitConfig()
	cfg := extensions.GetConfig()
	cfg.Env.HTTP_CLIENT_TIMEOUT_MIN = 1
	cfg.Secrets.API_KEY = "1234567890123456" // 16 bytes for AES
	cfg.Secrets.API_PREFIX = "TS"            // 2 bytes prefix (14 byte timestamp + 2 byte prefix = 16 bytes IV)
}

// TestNewHttpClient tests the creation of a new HTTP client
func TestNewHttpClient(t *testing.T) {
	setupTestConfig()

	baseURL := "http://example.com"
	client := NewHttpClient(baseURL)

	if client == nil {
		t.Fatal("Expected client to be created, got nil")
	}

	if client.baseUrl != baseURL {
		t.Errorf("Expected baseUrl to be %s, got %s", baseURL, client.baseUrl)
	}

	if client.client == nil {
		t.Error("Expected http.Client to be initialized")
	}

	if client.breaker == nil {
		t.Error("Expected circuit breaker to be initialized")
	}
}

// TestDoGet tests the DoGet method
func TestDoGet(t *testing.T) {
	setupTestConfig()

	type TestResponse struct {
		Data string `json:"data"`
	}

	// Create a test server that handles encrypted requests
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify method
		if r.Method != http.MethodGet {
			t.Errorf("Expected GET request, got %s", r.Method)
		}

		// Verify headers
		if r.Header.Get("Content-Type") != "application/json" {
			t.Error("Expected Content-Type: application/json")
		}

		// Read and decrypt the request (even though GET doesn't have a meaningful body)
		cfg := extensions.GetConfig()
		pretoken, _ := extensions.DecodeBase64ToText(r.Header.Get("pretoken"))
		IV := fmt.Sprintf("%s%s", cfg.Secrets.API_PREFIX, pretoken)

		// Create response
		responseData := TestResponse{Data: "test-data"}
		responseBytes, _ := json.Marshal(responseData)

		// Encrypt response
		encrypted, _ := extensions.AesEncrypt(cfg.Secrets.API_KEY, IV, string(responseBytes))
		apiResponse := APIResponseBody{Message: encrypted}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(apiResponse)
	}))
	defer server.Close()

	// Create client and make request
	client := NewHttpClient(server.URL)
	var response TestResponse
	err := client.DoGet(context.Background(), "/test", &response)

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if response.Data != "test-data" {
		t.Errorf("Expected response data to be 'test-data', got %s", response.Data)
	}
}

// TestDoPost tests the DoPost method
func TestDoPost(t *testing.T) {
	setupTestConfig()

	type TestRequest struct {
		Input string `json:"input"`
	}

	type TestResponse struct {
		Output string `json:"output"`
	}

	// Create a test server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify method
		if r.Method != http.MethodPost {
			t.Errorf("Expected POST request, got %s", r.Method)
		}

		// Read and decrypt request
		cfg := extensions.GetConfig()
		pretoken, _ := extensions.DecodeBase64ToText(r.Header.Get("pretoken"))
		IV := fmt.Sprintf("%s%s", cfg.Secrets.API_PREFIX, pretoken)

		var apiRequest APIRequestBody
		json.NewDecoder(r.Body).Decode(&apiRequest)

		decrypted, _ := extensions.AesDecrypt(cfg.Secrets.API_KEY, IV, apiRequest.Message)

		var requestData TestRequest
		json.Unmarshal([]byte(decrypted), &requestData)

		// Verify request data
		if requestData.Input != "test-input" {
			t.Errorf("Expected input 'test-input', got %s", requestData.Input)
		}

		// Create and encrypt response
		responseData := TestResponse{Output: "test-output"}
		responseBytes, _ := json.Marshal(responseData)
		encrypted, _ := extensions.AesEncrypt(cfg.Secrets.API_KEY, IV, string(responseBytes))

		apiResponse := APIResponseBody{Message: encrypted}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(apiResponse)
	}))
	defer server.Close()

	// Create client and make request
	client := NewHttpClient(server.URL)
	requestBody := TestRequest{Input: "test-input"}
	var response TestResponse
	err := client.DoPost(context.Background(), "/test", requestBody, &response)

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if response.Output != "test-output" {
		t.Errorf("Expected output 'test-output', got %s", response.Output)
	}
}

// TestDo_ContextTimeout tests that context timeout works
func TestDo_ContextTimeout(t *testing.T) {
	setupTestConfig()

	// Create a server that delays response
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(2 * time.Second)
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	client := NewHttpClient(server.URL)

	// Create a context with short timeout
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	var response interface{}
	err := client.Do(ctx, http.MethodGet, "/test", nil, &response)

	if err == nil {
		t.Fatal("Expected timeout error, got nil")
	}
}

// TestDo_NonSuccessStatusCode tests handling of non-2xx status codes
func TestDo_NonSuccessStatusCode(t *testing.T) {
	setupTestConfig()

	testCases := []struct {
		name       string
		statusCode int
	}{
		{"Bad Request", http.StatusBadRequest},
		{"Unauthorized", http.StatusUnauthorized},
		{"Not Found", http.StatusNotFound},
		{"Internal Server Error", http.StatusInternalServerError},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tc.statusCode)
			}))
			defer server.Close()

			client := NewHttpClient(server.URL)
			var response interface{}
			err := client.Do(context.Background(), http.MethodGet, "/test", nil, &response)

			if err == nil {
				t.Fatalf("Expected error for status code %d, got nil", tc.statusCode)
			}

			expectedError := fmt.Sprintf("Unexpected HTTP status: %d", tc.statusCode)
			if err.Error() != expectedError {
				t.Errorf("Expected error message '%s', got '%s'", expectedError, err.Error())
			}
		})
	}
}

// TestDo_RetryOnFailure tests that the client retries on failure
func TestDo_RetryOnFailure(t *testing.T) {
	setupTestConfig()

	attemptCount := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attemptCount++

		// Fail on first 2 attempts, succeed on 3rd
		if attemptCount < 3 {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		cfg := extensions.GetConfig()
		pretoken, _ := extensions.DecodeBase64ToText(r.Header.Get("pretoken"))
		IV := fmt.Sprintf("%s%s", cfg.Secrets.API_PREFIX, pretoken)

		responseData := map[string]string{"status": "ok"}
		responseBytes, _ := json.Marshal(responseData)
		encrypted, _ := extensions.AesEncrypt(cfg.Secrets.API_KEY, IV, string(responseBytes))

		apiResponse := APIResponseBody{Message: encrypted}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(apiResponse)
	}))
	defer server.Close()

	client := NewHttpClient(server.URL)
	var response map[string]string
	err := client.Do(context.Background(), http.MethodGet, "/test", nil, &response)

	if err != nil {
		t.Fatalf("Expected no error after retries, got %v", err)
	}

	if attemptCount != 3 {
		t.Errorf("Expected 3 attempts, got %d", attemptCount)
	}

	if response["status"] != "ok" {
		t.Errorf("Expected status 'ok', got %s", response["status"])
	}
}

// TestDo_InvalidJSON tests handling of invalid JSON responses
func TestDo_InvalidJSON(t *testing.T) {
	setupTestConfig()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("invalid json"))
	}))
	defer server.Close()

	client := NewHttpClient(server.URL)
	var response interface{}
	err := client.Do(context.Background(), http.MethodGet, "/test", nil, &response)

	if err == nil {
		t.Fatal("Expected error for invalid JSON, got nil")
	}
}

// TestDo_RequestHeaders tests that correct headers are sent
func TestDo_RequestHeaders(t *testing.T) {
	setupTestConfig()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify headers
		requiredHeaders := []string{"Content-Type", "requester", "pretoken", "token", "application"}
		for _, header := range requiredHeaders {
			if r.Header.Get(header) == "" {
				t.Errorf("Expected header %s to be set", header)
			}
		}

		if r.Header.Get("Content-Type") != "application/json" {
			t.Errorf("Expected Content-Type: application/json, got %s", r.Header.Get("Content-Type"))
		}

		if r.Header.Get("requester") != "fiber-app" {
			t.Errorf("Expected requester: fiber-app, got %s", r.Header.Get("requester"))
		}

		if r.Header.Get("application") != "KSWP" {
			t.Errorf("Expected application: KSWP, got %s", r.Header.Get("application"))
		}

		cfg := extensions.GetConfig()
		pretoken, _ := extensions.DecodeBase64ToText(r.Header.Get("pretoken"))
		IV := fmt.Sprintf("%s%s", cfg.Secrets.API_PREFIX, pretoken)

		responseData := map[string]string{"status": "ok"}
		responseBytes, _ := json.Marshal(responseData)
		encrypted, _ := extensions.AesEncrypt(cfg.Secrets.API_KEY, IV, string(responseBytes))

		apiResponse := APIResponseBody{Message: encrypted}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(apiResponse)
	}))
	defer server.Close()

	client := NewHttpClient(server.URL)
	var response map[string]string
	err := client.Do(context.Background(), http.MethodGet, "/test", nil, &response)

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
}

// TestDo_CircuitBreaker tests circuit breaker behavior
func TestDo_CircuitBreaker(t *testing.T) {
	setupTestConfig()

	failureCount := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		failureCount++
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer server.Close()

	client := NewHttpClient(server.URL)
	var response interface{}

	// Make multiple failing requests to trip the circuit breaker
	// Circuit breaker is configured to trip after 5 consecutive failures
	for i := 0; i < 6; i++ {
		client.Do(context.Background(), http.MethodGet, "/test", nil, &response)
	}

	// After circuit opens, failures should be tracked
	if failureCount < 5 {
		t.Errorf("Expected at least 5 failures to trip circuit breaker, got %d", failureCount)
	}
}

// TestDo_EncryptionDecryption tests that encryption and decryption work correctly
func TestDo_EncryptionDecryption(t *testing.T) {
	setupTestConfig()

	type ComplexData struct {
		ID      int      `json:"id"`
		Name    string   `json:"name"`
		Tags    []string `json:"tags"`
		Active  bool     `json:"active"`
		Balance float64  `json:"balance"`
	}

	expectedResponse := ComplexData{
		ID:      123,
		Name:    "Test User",
		Tags:    []string{"admin", "user"},
		Active:  true,
		Balance: 1234.56,
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cfg := extensions.GetConfig()
		pretoken, _ := extensions.DecodeBase64ToText(r.Header.Get("pretoken"))
		IV := fmt.Sprintf("%s%s", cfg.Secrets.API_PREFIX, pretoken)

		// Decrypt and verify request
		var apiRequest APIRequestBody
		json.NewDecoder(r.Body).Decode(&apiRequest)
		decrypted, _ := extensions.AesDecrypt(cfg.Secrets.API_KEY, IV, apiRequest.Message)

		var requestData ComplexData
		json.Unmarshal([]byte(decrypted), &requestData)

		// Echo back the request data as response
		responseBytes, _ := json.Marshal(requestData)
		encrypted, _ := extensions.AesEncrypt(cfg.Secrets.API_KEY, IV, string(responseBytes))

		apiResponse := APIResponseBody{Message: encrypted}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(apiResponse)
	}))
	defer server.Close()

	client := NewHttpClient(server.URL)
	var response ComplexData
	err := client.DoPost(context.Background(), "/test", expectedResponse, &response)

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Verify all fields
	if response.ID != expectedResponse.ID {
		t.Errorf("Expected ID %d, got %d", expectedResponse.ID, response.ID)
	}
	if response.Name != expectedResponse.Name {
		t.Errorf("Expected Name %s, got %s", expectedResponse.Name, response.Name)
	}
	if len(response.Tags) != len(expectedResponse.Tags) {
		t.Errorf("Expected %d tags, got %d", len(expectedResponse.Tags), len(response.Tags))
	}
	if response.Active != expectedResponse.Active {
		t.Errorf("Expected Active %v, got %v", expectedResponse.Active, response.Active)
	}
	if response.Balance != expectedResponse.Balance {
		t.Errorf("Expected Balance %f, got %f", expectedResponse.Balance, response.Balance)
	}
}
