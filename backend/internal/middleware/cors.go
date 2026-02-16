package middleware

import (
	"go-backend/internal/extensions"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func CorsMiddleware() fiber.Handler {
	cfg := extensions.GetConfig()
	allowOrigins := cfg.Env.CORS_ALLOW_ORIGINS
	if cfg.Env.APP_ENV == "development" {
		allowOrigins = "http://localhost:3000, http://localhost:5173"
	}
	return cors.New(cors.Config{
		AllowOrigins: allowOrigins,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST",
	})

	// สำหรับการเปิดใช้งาน CORS อย่างละเอียด + Cookies
	// app.Use(cors.New(cors.Config{
	// AllowOrigins:     allowedOrigins,
	// AllowCredentials: true,  // เปิดเพราะใช้ cookies
	// AllowHeaders:     "Origin, Content-Type, Accept",
	// AllowMethods:     "GET, POST, PUT, DELETE",
	// MaxAge:           3600,
	// ExposeHeaders:    "Content-Length",
	// }))
}
