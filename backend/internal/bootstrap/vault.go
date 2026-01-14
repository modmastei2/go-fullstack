package bootstrap

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"go-backend/internal/config"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/hashicorp/vault/api"
)

func InitializeVault() (*api.Client, error) {
	cfg := config.GetConfig()

	apiConfig := api.DefaultConfig()
	apiConfig.Address = fmt.Sprintf("%s:%s", cfg.Env.VAULT_HOST, cfg.Env.VAULT_PORT)

	client, err := api.NewClient(apiConfig)
	if err != nil {
		return nil, err
	}

	const maxRetry = 5

	for attempt := 1; attempt <= maxRetry; attempt++ {
		var token string = cfg.Env.VAULT_TOKEN
		err = nil

		if !cfg.Env.VAULT_DEV_MODE {
			token, err = LoginWithK8s(cfg.Env.VAULT_HOST, cfg.Env.VAULT_ROLE)
		}

		if err != nil {
			log.Printf("Vault login failed (%d/%d): %v", attempt, maxRetry, err)
			time.Sleep(time.Duration(attempt) * time.Second)
			continue
		}

		// set the token
		client.SetToken(token)

		// verify the token
		err = verifyVault(client)

		if err == nil {
			log.Println("✓ Vault client initialized successfully")
			return client, nil
		}

		log.Printf("Vault not ready (%d/%d): %v", attempt, maxRetry, err)
		time.Sleep(time.Duration(attempt) * time.Second)
	}

	return nil, fmt.Errorf("vault initialization failed after %d attempts", maxRetry)
}

func LoginWithK8s(address string, role string) (string, error) {
	jwt, err := os.ReadFile("/var/run/secrets/kubernetes.io/serviceaccount/token")
	if err != nil {
		return "", err
	}

	data := map[string]interface{}{
		"role": role,
		"jwt":  string(jwt),
	}

	b, _ := json.Marshal(data)

	resp, err := http.Post(
		address+"/v1/auth/kubernetes/login",
		"application/json",
		bytes.NewBuffer(b),
	)

	if err != nil {
		return "", err
	}

	defer resp.Body.Close()

	var result struct {
		Auth struct {
			ClientToken string `json:"client_token"`
		} `json:"auth"`
	}

	json.NewDecoder(resp.Body).Decode(&result)
	return result.Auth.ClientToken, nil
}

func verifyVault(client *api.Client) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := client.Auth().Token().LookupSelfWithContext(ctx)

	return err
}
