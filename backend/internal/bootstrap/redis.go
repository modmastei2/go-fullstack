package bootstrap

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

func InitializeRedis() (*redis.Client, error) {
	dbStr := os.Getenv("REDIS_DB")

	dbParsed, err := strconv.Atoi(dbStr)
	if err != nil {
		return nil, err
	}

	REDIS_HOST := os.Getenv("REDIS_HOST")
	REDIS_PORT := os.Getenv("REDIS_PORT")
	REDIS_PASSWORD := os.Getenv("REDIS_PASSWORD")

	redisClient := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", REDIS_HOST, REDIS_PORT),
		Password: REDIS_PASSWORD, // no password set
		DB:       dbParsed,       // use default DB
	})

	for i := 0; i <= 5; i++ {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		err := redisClient.Ping(ctx).Err()
		defer cancel()

		if err == nil {
			fmt.Println("✓ Redis client initialized successfully")
			return redisClient, nil
		}

		fmt.Printf("Redis not ready (%d/5): %v\n", i, err)
		time.Sleep(2 * time.Second)
	}

	return nil, fmt.Errorf("Redis not available")
}
