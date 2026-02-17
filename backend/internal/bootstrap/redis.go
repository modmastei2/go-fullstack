package bootstrap

import (
	"context"
	"fmt"
	"go-backend/internal/extensions"
	"log"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

func InitializeRedis() (*redis.Client, error) {
	cfg := extensions.GetConfig()

	dbParsed, err := strconv.Atoi(cfg.Env.REDIS_DB)
	if err != nil {
		return nil, err
	}

	endpoint := fmt.Sprintf("%s:%s", cfg.Env.REDIS_HOST, cfg.Env.REDIS_PORT)
	if endpoint == ":" {
		return nil, fmt.Errorf("invalid redis endpoint")
	}
	redisClient := redis.NewClient(&redis.Options{
		Addr:         endpoint,
		Password:     cfg.Secrets.REDIS_PASSWORD,
		DB:           dbParsed,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
	})

	maxRetry := cfg.Env.INIT_MAX_RETRY

	err = extensions.Retry(maxRetry, 1*time.Second, func() error {
		return verifyRedis(redisClient)
	})

	if err != nil {
		log.Printf("❌ Redis initialization failed after %d attempts: %v\n", maxRetry, err)
		return nil, err
	}

	log.Println("✅ Redis client initialized successfully")
	return redisClient, nil
}

func verifyRedis(client *redis.Client) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	err := client.Ping(ctx).Err()

	return err
}
