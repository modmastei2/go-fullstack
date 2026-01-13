package bootstrap

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"time"

	_ "github.com/joho/godotenv/autoload"
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

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = redisClient.Ping(ctx).Result()
	if err != nil {
		return nil, err
	}

	fmt.Println("✓ Redis client initialized successfully")

	return redisClient, nil
}
