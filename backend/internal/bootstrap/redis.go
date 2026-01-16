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
	fmt.Println("REDIS_PASSWORD:", cfg.Secrets.REDIS_PASSWORD)
	redisClient := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.Env.REDIS_HOST, cfg.Env.REDIS_PORT),
		Password: cfg.Secrets.REDIS_PASSWORD,
		DB:       dbParsed,
	})

	for i := 0; i <= 5; i++ {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		err := redisClient.Ping(ctx).Err()
		defer cancel()

		if err == nil {
			log.Println("✓ Redis client initialized successfully")
			return redisClient, nil
		}

		log.Printf("Redis not ready (%d/5): %v\n", i, err)
		time.Sleep(2 * time.Second)
	}

	return nil, fmt.Errorf("Redis not available")
}
