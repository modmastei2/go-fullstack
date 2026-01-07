package main

import (
	"context"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	UserId   string `json:"userId"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type ErrorResponse struct {
	ErrorCode string `json:"errorCode"`
	Message   string `json:"message"`
}

// Mock database
var users = map[string]User{
	"admin": {
		UserId:   "1",
		Username: "admin",
		Password: "$2a$10$UbDFYt/ybeIfPnvIQp4rnu2PI4BckMLcPVN7SCVvD1prr2zUw9Sr.", // password
	},
	"user2": {
		UserId:   "2",
		Username: "user2",
		Password: "user2", // password
	},
}

var (
	ctx                   = context.Background()
	redisClient           *redis.Client
	jwtSecret             []byte
	allowMultipleSessions bool
)

func main() {
	jwtSecret = []byte(getEnv("JWT_SECRET", "default_secret"))
	allowMultipleSessions = getEnv("ALLOW_MULTIPLE_SESSIONS", "false") == "true"

	// Initialize Redis
	r, err := initRedis()
	if err != nil {
		panic(err)
	}
	redisClient = r
	defer redisClient.Close()

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName: "KS_Wealth",
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000, http://localhost:5173",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST",
		AllowCredentials: true,
	}))

	// security header protocol
	app.Use(func(c *fiber.Ctx) error {
		c.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		c.Set("Content-Security-Policy", "default-src 'self'")
		c.Set("X-Content-Type-Options", "nosniff")
		c.Set("X-Frame-Options", "DENY")
		return c.Next()
	})

	// create group
	api := app.Group("/api")

	api.Post("/hash", func(c *fiber.Ctx) error {
		type HashRequest struct {
			Password string `json:"password"`
		}

		var req HashRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{
				ErrorCode: "INVALID_REQUEST",
				Message:   "Invalid request body",
			})
		}
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{
				ErrorCode: "HASHING_FAILED",
				Message:   "Failed to hash password",
			})
		}
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"hashedPassword": string(hashedPassword),
		})
	})

	api.Get("/health", func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"ServerStatus": "OK",
			"ServerTime":   time.Now(),
		})
	})

	api.Post("/login", loginHandler)
	api.Post("/refresh-token", refreshTokenHandler)

	// create protected route
	protected := api.Group("", authMiddleware)
	protected.Get("/profile", func(c *fiber.Ctx) error {
		userId := c.Locals("userId").(string)
		username := c.Locals("username").(string)

		// get session info
		sessionKey := fmt.Sprintf("session:%s", userId)
		sessionData, err := redisClient.HGetAll(ctx, sessionKey).Result()

		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{
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
	protected.Post("/logout", logoutHandler)

	port := getEnv("PORT", "8080")

	if err := app.Listen(":" + port); err != nil {
		panic(err)
	}
}
