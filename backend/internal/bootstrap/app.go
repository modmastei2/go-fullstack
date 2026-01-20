package bootstrap

import (
	"context"
	"fmt"
	"log"
	"time"

	"go-backend/internal/auth"
	"go-backend/internal/config"
	"go-backend/internal/middleware"
	"go-backend/internal/shared"

	"github.com/gofiber/fiber/v2"
)

func InitializeApp(app *fiber.App) {
	// ******* Allow HTTP Methods *******
	app.Use(middleware.HttpMethodMiddleware())

	// ******* Security Header Protocol Middleware *******
	app.Use(middleware.SecurityHeaderMiddleware())

	// ******* Initialize Config *******
	config.InitConfig()
	config.LoadEnv()

	cfg := config.GetConfig()

	if cfg.Env.APP_ENV == "" ||
		cfg.Env.VAULT_HOST == "" ||
		cfg.Env.VAULT_PORT == "" ||
		(cfg.Env.VAULT_TOKEN == "" && cfg.Env.VAULT_DEV_MODE) ||
		(cfg.Env.VAULT_ROLE == "" && !cfg.Env.VAULT_DEV_MODE) {
		log.Fatal("Missing required environment variables")
	}

	// ******* Initialize Vault Client *******
	vaultClient, err := InitializeVault()
	if err != nil {
		log.Fatal(err)
	}

	// ******* Load Secrets from Vault *******
	err = config.LoadSecrets(vaultClient)
	if err != nil {
		log.Fatal(err)
	}

	// ******* Initialize Redis *******
	redisClient, err := InitializeRedis()
	if err != nil {
		log.Fatal(err)
	}

	// ******* Initialize MinIO *******
	_, err = InitializeMinio()
	if err != nil {
		log.Fatal(err)
	}

	// ******* CORS Middleware ******* (load after config)
	app.Use(middleware.CorsMiddleware())

	// ******* Logging Middleware *******
	app.Use(middleware.LoggerMiddleware())

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
		sessionData, err := redisClient.HGetAll(context.Background(), sessionKey).Result()

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
