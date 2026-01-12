package auth

import (
	"context"
	"fmt"
	"os"

	"go-backend/internal/shared"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	redisClient *redis.Client
}

func NewAuthService(redisClient *redis.Client) *AuthService {
	return &AuthService{
		redisClient: redisClient,
	}
}

func (s *AuthService) GenerateToken(userID, username string) (string, string, error) {
	JWT_SECRET := []byte(os.Getenv("JWT_SECRET"))
	accessClaims := &shared.Claims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString(JWT_SECRET)
	if err != nil {
		return "", "", err
	}

	refreshTokenID := uuid.New().String()
	refreshClaims := &shared.Claims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        refreshTokenID,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString(JWT_SECRET)
	if err != nil {
		return "", "", err
	}

	// store refresh token in Redis
	key := fmt.Sprintf("refresh_token:%s:%s", userID, refreshTokenID)
	err = s.redisClient.Set(context.Background(), key, refreshTokenString, 7*24*time.Hour).Err()
	if err != nil {
		return "", "", err
	}

	return accessTokenString, refreshTokenString, nil
}

func (s *AuthService) LoginHandler(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(shared.ErrorResponse{
			ErrorCode: "INVALID_REQUEST",
			Message:   "Invalid request body",
		})
	}

	// validate
	if req.Username == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(shared.ErrorResponse{
			ErrorCode: "MISSING_CREDENTIALS",
			Message:   "Username and password are required",
		})
	}

	// check user
	user, exists := users[req.Username]
	if !exists {
		return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
			ErrorCode: "INVALID_CREDENTIALS",
			Message:   "Invalid username or password",
		})
	}

	// verify password
	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
			ErrorCode: "INVALID_CREDENTIALS",
			Message:   "Invalid username or password",
		})
	}

	// generate tokens (access and refresh)
	accessToken, refreshToken, err := s.GenerateToken(user.UserId, user.Username)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(shared.ErrorResponse{
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

	err = s.redisClient.HSet(context.Background(), sessionKey, sessionData).Err()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(shared.ErrorResponse{
			ErrorCode: "SESSION_STORAGE_FAILED",
			Message:   "Failed to store session data",
		})
	}
	s.redisClient.Expire(context.Background(), sessionKey, 24*7*time.Hour)

	return c.JSON(TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         fiber.Map{"id": user.UserId, "username": user.Username},
	})
}

func (s *AuthService) RefreshTokenHandler(c *fiber.Ctx) error {
	return nil
}

func (s *AuthService) LogoutHandler(c *fiber.Ctx) error {
	userId := c.Locals("userId").(string)

	// delete all refresh tokens for the user
	pattern := fmt.Sprintf("refresh_token:%s:*", userId)
	keys, err := s.redisClient.Keys(context.Background(), pattern).Result()
	if err == nil && len(keys) > 0 {
		s.redisClient.Del(context.Background(), keys...)
	}

	// delete session
	sessionKey := fmt.Sprintf("session:%s", userId)
	s.redisClient.Del(context.Background(), sessionKey)

	return c.JSON(fiber.Map{
		"message": "Logged out successfully",
	})
}

func (s *AuthService) ProfileHandler(c *fiber.Ctx) error {
	userId := c.Locals("userId").(string)
	username := c.Locals("username").(string)

	// get session info
	sessionKey := fmt.Sprintf("session:%s", userId)
	sessionData, err := s.redisClient.HGetAll(context.Background(), sessionKey).Result()

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
}
