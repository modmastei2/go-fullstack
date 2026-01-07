package main

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func authMiddleware(c *fiber.Ctx) error {
	// Get the Authorization header
	authHeader := c.Get("Authorization")

	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(ErrorResponse{
			ErrorCode: "MISSING_TOKEN",
			Message:   "Authorization token is required",
		})
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Status(fiber.StatusUnauthorized).JSON(ErrorResponse{
			ErrorCode: "INVALID_TOKEN_FORMAT",
			Message:   "Authorization token format is invalid",
		})
	}

	tokenString := parts[1]
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(ErrorResponse{
			ErrorCode: "INVALID_OR_EXPIRED_TOKEN",
			Message:   "Authorization token is invalid or expired",
		})
	}

	// Check if session exists in Redis
	sessionKey := "session:" + claims.UserID
	exists, err := redisClient.Exists(ctx, sessionKey).Result()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{
			ErrorCode: "SESSION_CHECK_FAILED",
			Message:   "Failed to verify session",
		})
	}

	if exists == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(ErrorResponse{
			ErrorCode: "SESSION_NOT_FOUND",
			Message:   "Session not found or has expired",
		})
	}

	// Store user information in context locals
	c.Locals("userId", claims.UserID)
	c.Locals("username", claims.Username)

	return c.Next()
}
