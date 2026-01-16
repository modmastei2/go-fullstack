package bootstrap

import (
	"context"
	"fmt"
	"go-backend/internal/config"
	"log"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

func InitializeMinio() (*minio.Client, error) {
	cfg := config.GetConfig()

	endpoint := fmt.Sprintf("%s:%s", cfg.Env.MINIO_HOST, cfg.Env.MINIO_PORT)
	if endpoint == ":" {
		return nil, fmt.Errorf("invalid minio endpoint")
	}
	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.Secrets.MINIO_ROOT_USER, cfg.Secrets.MINIO_ROOT_PASSWORD, ""),
		Secure: cfg.Env.MINIO_USE_SSL,
	})

	if err != nil {
		return nil, err
	}

	maxRetry := cfg.Env.INIT_MAX_RETRY

	for attempt := 1; attempt <= maxRetry; attempt++ {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		_, err = minioClient.BucketExists(ctx, cfg.Env.MINIO_BUCKET)

		if err == nil {
			log.Println("✓ MinIO client initialized successfully")
			return minioClient, nil
		}

		log.Printf("MinIO not ready (%d/%d): %v\n", attempt, maxRetry, err)
		time.Sleep(time.Duration(attempt) * time.Second)
	}

	return nil, fmt.Errorf("MinIO initialization failed after %d attempts", maxRetry)
}
