package auth

import (
	"context"
	"fmt"
	"strconv"

	"go-backend/internal/config"
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
	cfg := config.GetConfig()
	JWT_SECRET := []byte(cfg.Secrets.JWT_SECRET)
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
	var req RefreshTokenRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(shared.ErrorResponse{
			ErrorCode: "INVALID_REQUEST",
			Message:   "Invalid request body",
		})
	}

	if req.RefreshToken == "" {
		return c.Status(fiber.StatusBadRequest).JSON(shared.ErrorResponse{
			ErrorCode: "MISSING_REFRESH_TOKEN",
			Message:   "Refresh token is required",
		})
	}

	cfg := config.GetConfig()
	JWT_SECRET := []byte(cfg.Secrets.JWT_SECRET)
	claims := &shared.Claims{}
	token, err := jwt.ParseWithClaims(req.RefreshToken, claims, func(token *jwt.Token) (interface{}, error) {
		return JWT_SECRET, nil
	})

	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
			ErrorCode: "INVALID_REFRESH_TOKEN",
			Message:   "Refresh token is invalid or expired",
		})
	}

	key := fmt.Sprintf("refresh_token:%s:%s", claims.UserID, claims.ID)
	storedToken, err := s.redisClient.Get(context.Background(), key).Result()
	if err != nil || storedToken != req.RefreshToken {
		return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
			ErrorCode: "REFRESH_TOKEN_NOT_FOUND",
			Message:   "Refresh token not found or has been revoked",
		})
	}

	sessionKey := fmt.Sprintf("session:%s", claims.UserID)
	exists, err := s.redisClient.Exists(context.Background(), sessionKey).Result()
	if err != nil || exists == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
			ErrorCode: "SESSION_EXPIRED",
			Message:   "Session has expired, please login again",
		})
	}

	// Generate new access tokens
	accessClaims := &shared.Claims{
		UserID:   claims.UserID,
		Username: claims.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString(JWT_SECRET)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(shared.ErrorResponse{
			ErrorCode: "TOKEN_GENERATION_FAILED",
			Message:   "Failed to generate access token",
		})
	}

	return c.JSON(TokenResponse{
		AccessToken: accessTokenString,
	})
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

func (s *AuthService) LockSessionHandler(c *fiber.Ctx) error {
	userId := c.Locals("userId").(string)
	sessionKey := fmt.Sprintf("session:%s", userId)

	// update session to locked
	err := s.redisClient.HSet(context.Background(), sessionKey, map[string]interface{}{
		"locked":   true,
		"lockedAt": time.Now().Unix(),
	}).Err()

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(shared.ErrorResponse{
			ErrorCode: "SESSION_LOCK_FAILED",
			Message:   "Failed to lock session",
		})
	}

	return c.JSON(fiber.Map{
		"message":  "Session locked successfully",
		"lockedAt": time.Now().Unix(),
	})
}

func (s *AuthService) UnlockSessionHandler(c *fiber.Ctx) error {
	userId := c.Locals("userId").(string)
	username := c.Locals("username").(string)

	var req UnlockRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(shared.ErrorResponse{
			ErrorCode: "INVALID_REQUEST",
			Message:   "Invalid request body",
		})
	}

	if req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(shared.ErrorResponse{
			ErrorCode: "MISSING_PASSWORD",
			Message:   "Password is required to unlock session",
		})
	}

	// check session
	sessionKey := fmt.Sprintf("session:%s", userId)
	sessionData, err := s.redisClient.HGetAll(context.Background(), sessionKey).Result()

	if err != nil || len(sessionData) == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
			ErrorCode: "SESSION_NOT_FOUND",
			Message:   "Session not found or has expired",
		})
	}

	// check if session is locked
	if sessionData["locked"] != "1" && sessionData["locked"] != "true" {
		return c.Status(fiber.StatusBadRequest).JSON(shared.ErrorResponse{
			ErrorCode: "SESSION_NOT_LOCKED",
			Message:   "Session is not locked",
		})
	}

	// check lock over 10 min
	if lockedAtStr, exists := sessionData["lockedAt"]; exists {
		lockedAt, _ := strconv.ParseInt(lockedAtStr, 10, 64)
		lockDuration := time.Now().Unix() - lockedAt

		if lockDuration > 600 {
			s.deleteUserSession(userId)
			return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
				ErrorCode: "LOCK_TIMEOUT",
				Message:   "Session lock timeout. Please login again.",
			})
		}
	}

	// verify password
	user, exists := users[username]
	if !exists {
		return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
			ErrorCode: "USER_NOT_FOUND",
			Message:   "User not found",
		})
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
			ErrorCode: "INVALID_PASSWORD",
			Message:   "Invalid password",
		})
	}

	// unlock session
	err = s.redisClient.HSet(context.Background(), sessionKey, map[string]interface{}{
		"locked":     false,
		"lockedAt":   0,
		"unlockedAt": time.Now().Unix(),
	}).Err()

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(shared.ErrorResponse{
			ErrorCode: "SESSION_UNLOCK_FAILED",
			Message:   "Failed to unlock session",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Unlocked successfully",
		"user": fiber.Map{
			"userId":   userId,
			"username": username,
		},
	})
}

func (s *AuthService) deleteUserSession(userId string) {
	// delete all refresh tokens for the user
	pattern := fmt.Sprintf("refresh_token:%s:*", userId)
	keys, err := s.redisClient.Keys(context.Background(), pattern).Result()

	if err == nil && len(keys) > 0 {
		s.redisClient.Del(context.Background(), keys...)
	}

	// delete session
	sessionKey := fmt.Sprintf("session:%s", userId)
	s.redisClient.Del(context.Background(), sessionKey)
}

// Handler สำหรับเช็คสถานะ session
func (s *AuthService) CheckSessionHandler(c *fiber.Ctx) error {
	userId := c.Locals("userId").(string)

	sessionKey := fmt.Sprintf("session:%s", userId)
	sessionData, err := s.redisClient.HGetAll(context.Background(), sessionKey).Result()

	if err != nil || len(sessionData) == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
			ErrorCode: "SESSION_EXPIRED",
			Message:   "Session has expired",
		})
	}

	isLocked := sessionData["locked"] == "1" || sessionData["locked"] == "true"

	response := fiber.Map{
		"locked": isLocked,
	}

	if isLocked {
		if lockedAtStr, exists := sessionData["lockedAt"]; exists {
			lockedAt, _ := strconv.ParseInt(lockedAtStr, 10, 64)
			lockDuration := time.Now().Unix() - lockedAt

			// ถ้า lock เกิน 10 นาที ให้ logout
			if lockDuration > 600 {
				s.deleteUserSession(userId)
				return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
					ErrorCode: "LOCK_TIMEOUT",
					Message:   "Session expired due to inactivity",
				})
			}

			response["lockedAt"] = lockedAt
			response["timeRemaining"] = 600 - lockDuration
		}
	}

	return c.JSON(response)
}
