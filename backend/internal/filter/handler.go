package filter

import (
	"go-backend/internal/client"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
)

func RegisterRoutes(app *fiber.Router, redisClient *redis.Client, httpClient *client.XHttpClient) {
	filterService := NewFilterService(redisClient, httpClient)

	protected := (*app).Group("/filter")

	protected.Post("/get-filter", filterService.GetFilter)
	protected.Post("/fire-search", filterService.FireSearch)
}
