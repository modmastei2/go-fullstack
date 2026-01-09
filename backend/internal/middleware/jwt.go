package middleware

import (
	"context"
	"go-backend/internal/shared"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
)

func AuthMiddleware(redisClient *redis.Client) fiber.Handler {
	return func(c *fiber.Ctx) error {
		JWT_SECRET := []byte(os.Getenv("JWT_SECRET"))
		authHeader := c.Get("Authorization")

		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
				ErrorCode: "MISSING_TOKEN",
				Message:   "Authorization token is required",
			})
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
				ErrorCode: "INVALID_TOKEN_FORMAT",
				Message:   "Authorization token format is invalid",
			})
		}

		tokenString := parts[1]
		claims := &shared.Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return JWT_SECRET, nil
		})

		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
				ErrorCode: "INVALID_OR_EXPIRED_TOKEN",
				Message:   "Authorization token is invalid or expired",
			})
		}

		// check of session exists in redis
		sessionKey := "session:" + claims.UserID
		exists, err := redisClient.Exists(context.Background(), sessionKey).Result()
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(shared.ErrorResponse{
				ErrorCode: "SESSION_CHECK_FAILED",
				Message:   "Failed to verify session",
			})
		}

		if exists == 0 {
			return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
				ErrorCode: "SESSION_NOT_FOUND",
				Message:   "Session not found or has expired",
			})
		}

		// store user information in context locals
		c.Locals("userId", claims.UserID)
		c.Locals("username", claims.Username)

		return c.Next()
	}
}
