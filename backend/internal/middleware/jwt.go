package middleware

import (
	"context"
	"fmt"
	"go-backend/internal/config"
	"go-backend/internal/shared"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
)

func AuthMiddleware(redisClient *redis.Client) fiber.Handler {
	return func(c *fiber.Ctx) error {
		cfg := config.GetConfig()
		JWT_SECRET := []byte(cfg.Secrets.JWT_SECRET)

		tokenString := c.Cookies("access_token")

		if tokenString == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
				ErrorCode: "MISSING_TOKEN",
				Message:   "Authorization token is required",
			})
		}

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
		sessionKey := fmt.Sprintf("session:%s:%s", claims.UserID, claims.SessionID)
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
			// check lock over timeout
			if lockedAtStr, exists := sessionData["lockedAt"]; exists {
				lockedAt, _ := strconv.ParseInt(lockedAtStr, 10, 64)
				lockDuration := time.Now().Unix() - lockedAt

				cfg := config.GetConfig()
				lockTimeout := int64(cfg.Env.LOCK_SCREEN_TIMEOUT_MINUTES * 60)

				if lockDuration > lockTimeout {
					// delete this device's session
					deleteSession(redisClient, claims.UserID, claims.SessionID)
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
		c.Locals("sessionId", claims.SessionID)

		return c.Next()
	}
}

// Helper function for deleting device-specific session
func deleteSession(redisClient *redis.Client, userId, sessionId string) {
	// ลบ device-specific session
	sessionKey := fmt.Sprintf("session:%s:%s", userId, sessionId)
	redisClient.Del(context.Background(), sessionKey)

	// ลบเฉพาะ refresh tokens ของ session นี้
	pattern := fmt.Sprintf("refresh_token:%s:%s:*", userId, sessionId)
	keys, err := redisClient.Keys(context.Background(), pattern).Result()
	if err == nil && len(keys) > 0 {
		redisClient.Del(context.Background(), keys...)
	}
}
