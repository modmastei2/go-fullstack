package bootstrap

import (
	"context"
	"fmt"
	"go-backend/internal/config"
	"log"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

func InitializeRedis() (*redis.Client, error) {
	cfg := config.GetConfig()

	dbParsed, err := strconv.Atoi(cfg.Env.REDIS_DB)
	if err != nil {
		return nil, err
	}

	endpoint := fmt.Sprintf("%s:%s", cfg.Env.REDIS_HOST, cfg.Env.REDIS_PORT)
	if endpoint == ":" {
		return nil, fmt.Errorf("invalid redis endpoint")
	}
	redisClient := redis.NewClient(&redis.Options{
		Addr:     endpoint,
		Password: cfg.Secrets.REDIS_PASSWORD,
		DB:       dbParsed,
	})

	maxRetry := cfg.Env.INIT_MAX_RETRY

	for attempt := 1; attempt <= maxRetry; attempt++ {
		err = verifyRedis(redisClient)

		if err == nil {
			log.Println("✓ Redis client initialized successfully")
			return redisClient, nil
		}

		log.Printf("Redis not ready (%d/%d): %v\n", attempt, maxRetry, err)
		time.Sleep(time.Duration(attempt) * time.Second)
	}

	return nil, fmt.Errorf("Redis initialization failed after %d attempts", maxRetry)
}

func verifyRedis(client *redis.Client) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	err := client.Ping(ctx).Err()

	return err
}
