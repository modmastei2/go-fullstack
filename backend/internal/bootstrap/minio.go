package bootstrap

import (
	"context"
	"fmt"
	"go-backend/internal/extensions"
	"log"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

func InitializeMinio() (*minio.Client, error) {
	cfg := extensions.GetConfig()

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

	err = extensions.Retry(maxRetry, 1*time.Second, func() error {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		_, err = minioClient.BucketExists(ctx, cfg.Env.MINIO_BUCKET)
		return err
	})

	if err != nil {
		return nil, fmt.Errorf("❌ MinIO initialization failed after %d attempts: %v", maxRetry, err)
	}

	log.Println("✅ MinIO client initialized successfully")
	return minioClient, nil
}
