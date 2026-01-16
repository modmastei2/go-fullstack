package config

import (
	"context"
	"encoding/json"
	"fmt"
	"go-backend/internal/shared"
	"log"
	"os"
	"sync"

	"github.com/hashicorp/vault/api"
	"github.com/joho/godotenv"
)

type Config struct {
	Env     EnvironmentConfig
	Secrets SecretsConfig
}

type EnvironmentConfig struct {
	APP_ENV        string
	INIT_MAX_RETRY int
	// vault
	VAULT_DEV_MODE bool
	VAULT_HOST     string
	VAULT_PORT     string
	VAULT_TOKEN    string
	VAULT_ROLE     string
	// redis
	REDIS_HOST string
	REDIS_PORT string
	REDIS_DB   string
	// minio
	MINIO_HOST    string
	MINIO_PORT    string
	MINIO_BUCKET  string
	MINIO_USE_SSL bool
}

type SecretsConfig struct {
	JWT_SECRET  string
	DB_PASSWORD string

	// redis
	REDIS_PASSWORD string

	// minio
	MINIO_ROOT_USER     string
	MINIO_ROOT_PASSWORD string
}

var (
	cfg  *Config
	once sync.Once
)

func InitConfig() {
	if cfg == nil {
		cfg = &Config{}
	}
}

func GetConfig() *Config {
	return cfg
}

func LoadEnv() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("No .env file found: %v", err)
	}

	APP_ENV := os.Getenv("APP_ENV")

	if APP_ENV != "production" {
		log.Printf("Warning: Application is running in %s mode (non-production)", APP_ENV)
	}

	cfg.Env = EnvironmentConfig{
		APP_ENV:        APP_ENV,
		INIT_MAX_RETRY: shared.StringToIntWithDefault(os.Getenv("INIT_MAX_RETRY"), 5),
		VAULT_DEV_MODE: os.Getenv("VAULT_DEV_MODE") == "true",
		VAULT_HOST:     os.Getenv("VAULT_HOST"),
		VAULT_PORT:     os.Getenv("VAULT_PORT"),
		VAULT_TOKEN:    os.Getenv("VAULT_TOKEN"),
		VAULT_ROLE:     os.Getenv("VAULT_ROLE"),
		REDIS_HOST:     os.Getenv("REDIS_HOST"),
		REDIS_PORT:     os.Getenv("REDIS_PORT"),
		REDIS_DB:       os.Getenv("REDIS_DB"),
		MINIO_HOST:     os.Getenv("MINIO_HOST"),
		MINIO_PORT:     os.Getenv("MINIO_PORT"),
		MINIO_BUCKET:   os.Getenv("MINIO_BUCKET"),
		MINIO_USE_SSL:  os.Getenv("MINIO_USE_SSL") == "true",
	}

	log.Println("✓ Environment variables loaded successfully")
	if cfg.Env.APP_ENV != "production" {
		envJson, _ := json.MarshalIndent(cfg.Env, "", "  ")
		fmt.Printf("Loaded Environment Config: %s\n", envJson)
	}
}

func LoadSecrets(client *api.Client) error {
	var err error

	jwt, err := getKV(client, "secret", "fiber-app", "jwt_secret")
	if err != nil {
		return err
	}

	dbPassword, err := getKV(client, "secret", "fiber-app", "db_password")
	if err != nil {
		return err
	}

	redisPassword, err := getKV(client, "secret", "fiber-app", "redis_password")
	if err != nil {
		return err
	}

	minioRootUser, err := getKV(client, "secret", "fiber-app", "minio_root_user")
	if err != nil {
		return err
	}

	minioRootPassword, err := getKV(client, "secret", "fiber-app", "minio_root_password")
	if err != nil {
		return err
	}

	cfg.Secrets = SecretsConfig{
		JWT_SECRET:          jwt,
		DB_PASSWORD:         dbPassword,
		REDIS_PASSWORD:      redisPassword,
		MINIO_ROOT_USER:     minioRootUser,
		MINIO_ROOT_PASSWORD: minioRootPassword,
	}

	log.Println("✓ Secrets loaded from Vault successfully")
	if cfg.Env.APP_ENV != "production" {
		secretJson, _ := json.MarshalIndent(cfg.Secrets, "", "  ")
		fmt.Printf("Loaded Secrets: %s\n", secretJson)
	}

	return nil
}

func getKV(client *api.Client, mount, path, key string) (string, error) {
	secret, err := client.KVv2(mount).Get(context.Background(), path)
	if err != nil {
		return "", err
	}

	val, ok := secret.Data[key]
	if !ok {
		return "", fmt.Errorf("getKV key %s not found", key)
	}

	return fmt.Sprintf("%v", val), nil
}
