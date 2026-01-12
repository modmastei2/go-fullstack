package auth

import (
	"go-backend/internal/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
)

func RegisterRoutes(app *fiber.Router, redisClient *redis.Client) {
	authService := NewAuthService(redisClient)

	auth := (*app).Group("/auth")

	auth.Post("/login", authService.LoginHandler)

	protected := auth.Group("/", middleware.AuthMiddleware(redisClient))
	protected.Post("/logout", authService.LogoutHandler)
	protected.Get("/profile", authService.ProfileHandler)
}
