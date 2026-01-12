package middleware

import (
	"context"
	"go-backend/internal/shared"
	"os"
	"strconv"
	"strings"
	"time"

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
		sessionData, err := redisClient.HGetAll(context.Background(), sessionKey).Result()
		if err != nil || len(sessionData) == 0 {
			return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
				ErrorCode: "SESSION_NOT_FOUND",
				Message:   "User session not found or has expired",
			})
		}

		// check if session is locked
		isLocked := sessionData["locked"] == "1" || sessionData["locked"] == "true"

		// allow access only to unlock route if session is locked
		allowedWhenLocked := []string{
			"/auth/unlock",
			"/auth/check-session",
			"/auth/logout",
		}

		path := c.Path()
		isAllowedPath := false
		for _, allowPath := range allowedWhenLocked {
			if strings.HasSuffix(path, allowPath) {
				isAllowedPath = true
				break
			}
		}

		if isLocked && !isAllowedPath {
			// check lock over 10 minutes
			if lockedAtStr, exists := sessionData["lockedAt"]; exists {
				lockedAt, _ := strconv.ParseInt(lockedAtStr, 10, 64)
				lockDuration := time.Now().Unix() - lockedAt

				if lockDuration > 600 {
					// delete session
					deleteUserSession(redisClient, claims.UserID)
					return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
						ErrorCode: "LOCK_TIMEOUT",
						Message:   "Session expire due to inactivity. Please login again.",
					})
				}
			}

			return c.Status(fiber.StatusForbidden).JSON(shared.ErrorResponse{
				ErrorCode: "SESSION_LOCKED",
				Message:   "User session is locked. Please unlock to continue.",
			})
		}

		// store user information in context locals
		c.Locals("userId", claims.UserID)
		c.Locals("username", claims.Username)

		return c.Next()
	}
}

// Helper function
func deleteUserSession(redisClient *redis.Client, userId string) {
	// ลบ refresh tokens
	pattern := "refresh_token:" + userId + ":*"
	keys, err := redisClient.Keys(context.Background(), pattern).Result()
	if err == nil && len(keys) > 0 {
		redisClient.Del(context.Background(), keys...)
	}

	// ลบ session
	sessionKey := "session:" + userId
	redisClient.Del(context.Background(), sessionKey)
}
