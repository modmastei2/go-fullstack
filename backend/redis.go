package main

import (
	"fmt"
	"strconv"

	"github.com/redis/go-redis/v9"
)

// Initialize Redis
func initRedis() (*redis.Client, error) {
	dbStr := getEnv("REDIS_DB", "0")
	dbParsed, err := strconv.Atoi(dbStr)
	if err != nil {
		return nil, err
	}

	redisClient := redis.NewClient(&redis.Options{
		Addr:     getEnv("REDIS_ADDR", "localhost:6379"),
		Password: getEnv("REDIS_PASSWORD", ""), // no password set
		DB:       dbParsed,                     // use default DB
	})

	_, err = redisClient.Ping(ctx).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %v", err)
	}

	fmt.Println("✓ Connect to Redis")

	return redisClient, nil
}
