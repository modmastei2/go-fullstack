package middleware

import (
	"go-backend/internal/config"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func CorsMiddleware() fiber.Handler {
	cfg := config.GetConfig()
	allowOrigins := cfg.Env.CORS_ALLOW_ORIGINS
	if cfg.Env.APP_ENV == "development" {
		allowOrigins = "http://localhost:3000, http://localhost:5173"
	}
	return cors.New(cors.Config{
		AllowOrigins: allowOrigins,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST",
	})
}
