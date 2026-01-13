package bootstrap

import (
	"context"
	"fmt"
	"log"
	"time"

	"go-backend/internal/auth"
	"go-backend/internal/middleware"
	"go-backend/internal/shared"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	fiberSwagger "github.com/swaggo/fiber-swagger"
)

func InitializeApp(app *fiber.App) {
	ctx := context.Background()

	// ******* Initialize Redis *******
	redisClient, err := InitializeRedis()
	if err != nil {
		log.Fatal(err)
	}

	// ******* Setup Swagger and Static File Serving *******
	app.Get("/swagger/*", fiberSwagger.WrapHandler)
	app.Static("/docs", "./docs")
	app.Static("/redoc", "./public/redoc")

	// ******* CORS Middleware *******
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:3000, http://localhost:5173",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST",
	}))

	// ******* Security Header Protocol *******
	app.Use(func(c *fiber.Ctx) error {
		c.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		c.Set("Content-Security-Policy", "default-src 'self'")
		c.Set("X-Content-Type-Options", "nosniff")
		c.Set("X-Frame-Options", "DENY")
		return c.Next()
	})

	// ******* Create API routes group *******
	api := app.Group("/api/v1")

	// ******* Health Check Endpoint *******
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"ServerStatus": "OK",
			"ServerTime":   time.Now(),
		})
	})

	// ******* Register Auth routes *******
	auth.RegisterRoutes(&api, redisClient)

	// ******* Create protected routes group *******
	protected := api.Group("/", middleware.AuthMiddleware(redisClient))

	// Register other routes here, e.g., user, profile, etc.
	protected.Get("/profile", func(c *fiber.Ctx) error {
		userId := c.Locals("userId").(string)
		username := c.Locals("username").(string)

		// get session info
		sessionKey := fmt.Sprintf("session:%s", userId)
		sessionData, err := redisClient.HGetAll(ctx, sessionKey).Result()

		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(shared.ErrorResponse{
				ErrorCode: "SESSION_RETRIEVAL_FAILED",
				Message:   "Failed to retrieve session data",
			})
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"user": fiber.Map{
				"userId":   userId,
				"username": username,
			},
			"session": sessionData,
		})
	})

}
