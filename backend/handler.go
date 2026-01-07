package main

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type TokenResponse struct {
	AccessToken  string      `json:"accessToken"`
	RefreshToken string      `json:"refreshToken"`
	User         interface{} `json:"user,omitempty"`
}

func loginHandler(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{
			ErrorCode: "INVALID_REQUEST",
			Message:   "Invalid request body",
		})
	}

	// validate
	if req.Username == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{
			ErrorCode: "MISSING_CREDENTIALS",
			Message:   "Username and password are required",
		})
	}

	// check user
	user, exists := users[req.Username]
	if !exists {
		return c.Status(fiber.StatusUnauthorized).JSON(ErrorResponse{
			ErrorCode: "INVALID_CREDENTIALS",
			Message:   "Invalid username or password",
		})
	}

	// verify password
	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(ErrorResponse{
			ErrorCode: "INVALID_CREDENTIALS",
			Message:   "Invalid username or password",
		})
	}

	// Single Session Policy: Delete existing session and refresh tokens if multiple sessions not allowed
	if !allowMultipleSessions {
		// Delete all refresh tokens for the user
		pattern := fmt.Sprintf("refresh_token:%s:*", user.UserId)
		keys, err := redisClient.Keys(ctx, pattern).Result()
		if err == nil && len(keys) > 0 {
			redisClient.Del(ctx, keys...)
		}

		// Delete existing session
		existingSessionKey := fmt.Sprintf("session:%s", user.UserId)
		redisClient.Del(ctx, existingSessionKey)
	}

	// generate tokens (access and refresh)
	accessToken, refreshToken, err := generateTokens(user.UserId, user.Username)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{
			ErrorCode: "TOKEN_GENERATION_FAILED",
			Message:   "Failed to generate tokens",
		})
	}

	// store session in Redis
	sessionKey := fmt.Sprintf("session:%s", user.UserId)
	sessionData := map[string]interface{}{
		"username":  user.Username,
		"loginTime": time.Now().Unix(),
		"ip":        c.IP(),
		"userAgent": c.Get("User-Agent"),
	}

	err = redisClient.HSet(ctx, sessionKey, sessionData).Err()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{
			ErrorCode: "SESSION_STORAGE_FAILED",
			Message:   "Failed to store session data",
		})
	}
	redisClient.Expire(ctx, sessionKey, 15*time.Minute)

	return c.JSON(TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         fiber.Map{"id": user.UserId, "username": user.Username},
	})
}

type Claims struct {
	UserID   string `json:"userId"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func generateTokens(userID, username string) (string, string, error) {
	accessClaims := &Claims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString(jwtSecret)
	if err != nil {
		return "", "", err
	}

	refreshTokenID := uuid.New().String()
	refreshClaims := &Claims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        refreshTokenID,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString(jwtSecret)
	if err != nil {
		return "", "", err
	}

	// store refresh token in Redis
	key := fmt.Sprintf("refresh_token:%s:%s", userID, refreshTokenID)
	err = redisClient.Set(ctx, key, refreshTokenString, 7*24*time.Hour).Err()
	if err != nil {
		return "", "", err
	}

	return accessTokenString, refreshTokenString, nil
}

func logoutHandler(c *fiber.Ctx) error {
	userId := c.Locals("userId").(string)

	// delete all refresh tokens for the user
	pattern := fmt.Sprintf("refresh_token:%s:*", userId)
	keys, err := redisClient.Keys(ctx, pattern).Result()
	if err == nil && len(keys) > 0 {
		redisClient.Del(ctx, keys...)
	}

	// delete session
	sessionKey := fmt.Sprintf("session:%s", userId)
	redisClient.Del(ctx, sessionKey)

	return c.JSON(fiber.Map{
		"message": "Logged out successfully",
	})

}

func refreshTokenHandler(c *fiber.Ctx) error {
	// Placeholder for refresh token logic
	return c.SendString("Refresh Token endpoint")
}
