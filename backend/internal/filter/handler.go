package filter

import (
	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
)

func RegisterRoutes(app *fiber.Router, redisClient *redis.Client) {
	filterService := NewFilterService(redisClient)

	protected := (*app).Group("/filter")

	protected.Post("/get-filter", filterService.GetFilter)
}
