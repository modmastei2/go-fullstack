package bootstrap

import (
	"context"
	"fmt"
	"os"
	"strconv"

	_ "github.com/joho/godotenv/autoload"
	"github.com/redis/go-redis/v9"
)

func InitializeRedis() (*redis.Client, error) {
	dbStr := os.Getenv("REDIS_DB")

	dbParsed, err := strconv.Atoi(dbStr)
	if err != nil {
		return nil, err
	}

	REDIS_ADDR := os.Getenv("REDIS_ADDR")
	REDIS_PASSWORD := os.Getenv("REDIS_PASSWORD")

	redisClient := redis.NewClient(&redis.Options{
		Addr:     REDIS_ADDR,
		Password: REDIS_PASSWORD, // no password set
		DB:       dbParsed,       // use default DB
	})

	_, err = redisClient.Ping(context.Background()).Result()
	if err != nil {
		return nil, err
	}

	fmt.Println("✓ Redis client initialized successfully")

	return redisClient, nil
}
