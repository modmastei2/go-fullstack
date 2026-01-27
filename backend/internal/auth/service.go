package auth

import (
	"context"
	"fmt"
	"strconv"
	"strings"

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

type TokenResult struct {
	AccessToken        string
	RefreshToken       string
	SessionID          string
	AccessTokenExpire  time.Duration
	RefreshTokenExpire time.Duration
	SessionExpire      time.Duration
}

func NewAuthService(redisClient *redis.Client) *AuthService {
	return &AuthService{
		redisClient: redisClient,
	}
}

func (s *AuthService) GenerateToken(userID, username string, existingSessionID ...string) (*TokenResult, error) {
	cfg := config.GetConfig()
	JWT_SECRET := []byte(cfg.Secrets.JWT_SECRET)

	accessTokenExpire := time.Duration(cfg.Env.ACCESS_TOKEN_EXPIRE_MINUTES) * time.Minute
	refreshTokenExpire := time.Duration(cfg.Env.REFRESH_TOKEN_EXPIRE_DAYS) * 24 * time.Hour
	sessionExpire := time.Duration(cfg.Env.SESSION_EXPIRE_DAYS) * 24 * time.Hour

	// Generate unique session ID for this device/browser or reuse existing one
	var sessionID string
	if len(existingSessionID) > 0 && existingSessionID[0] != "" {
		sessionID = existingSessionID[0]
	} else {
		sessionID = uuid.New().String()
	}

	accessClaims := &shared.Claims{
		UserID:    userID,
		Username:  username,
		SessionID: sessionID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(accessTokenExpire)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString(JWT_SECRET)
	if err != nil {
		return nil, err
	}

	refreshTokenID := uuid.New().String()
	refreshClaims := &shared.Claims{
		UserID:    userID,
		Username:  username,
		SessionID: sessionID,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        refreshTokenID,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(refreshTokenExpire)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString(JWT_SECRET)
	if err != nil {
		return nil, err
	}

	// Only check session limits when creating NEW session (not during refresh)
	isNewSession := len(existingSessionID) == 0 || existingSessionID[0] == ""

	if isNewSession {
		// MULTIPLE_SESSION_USER: limit concurrent sessions per user
		if cfg.Env.MULTIPLE_SESSION_USER > 0 {
			// Get all existing sessions for this user
			pattern := fmt.Sprintf("session:%s:*", userID)
			keys, err := s.redisClient.Keys(context.Background(), pattern).Result()

			if err == nil && len(keys) >= cfg.Env.MULTIPLE_SESSION_USER {
				// Need to delete oldest session(s) to make room
				type sessionInfo struct {
					key       string
					sessionId string
					loginTime int64
				}

				sessions := []sessionInfo{}
				for _, key := range keys {
					// Get loginTime from session data
					data, err := s.redisClient.HGetAll(context.Background(), key).Result()
					if err == nil {
						loginTime, _ := strconv.ParseInt(data["loginTime"], 10, 64)
						parts := strings.Split(key, ":")
						if len(parts) == 3 {
							sessions = append(sessions, sessionInfo{
								key:       key,
								sessionId: parts[2],
								loginTime: loginTime,
							})
						}
					}
				}

				// Sort by loginTime (oldest first)
				for i := 0; i < len(sessions)-1; i++ {
					for j := i + 1; j < len(sessions); j++ {
						if sessions[i].loginTime > sessions[j].loginTime {
							sessions[i], sessions[j] = sessions[j], sessions[i]
						}
					}
				}

				// Delete oldest session(s) to make room for new one
				toDelete := len(sessions) - cfg.Env.MULTIPLE_SESSION_USER + 1
				for i := 0; i < toDelete; i++ {
					// Delete session
					s.redisClient.Del(context.Background(), sessions[i].key)
					// Delete associated refresh tokens
					refreshPattern := fmt.Sprintf("refresh_token:%s:%s:*", userID, sessions[i].sessionId)
					refreshKeys, _ := s.redisClient.Keys(context.Background(), refreshPattern).Result()
					if len(refreshKeys) > 0 {
						s.redisClient.Del(context.Background(), refreshKeys...)
					}
				}
			}
		} else if cfg.Env.MULTIPLE_SESSION_USER == 0 {
			// Single session mode: delete all existing sessions and refresh tokens
			pattern := fmt.Sprintf("session:%s:*", userID)
			keys, err := s.redisClient.Keys(context.Background(), pattern).Result()
			if err == nil && len(keys) > 0 {
				s.redisClient.Del(context.Background(), keys...)
			}
			refreshPattern := fmt.Sprintf("refresh_token:%s:*", userID)
			refreshKeys, err := s.redisClient.Keys(context.Background(), refreshPattern).Result()
			if err == nil && len(refreshKeys) > 0 {
				s.redisClient.Del(context.Background(), refreshKeys...)
			}
		}
		// If MULTIPLE_SESSION_USER < 0: unlimited sessions (no cleanup)
	}

	// store refresh token in Redis with sessionId in key
	key := fmt.Sprintf("refresh_token:%s:%s:%s", userID, sessionID, refreshTokenID)
	err = s.redisClient.Set(context.Background(), key, refreshTokenString, refreshTokenExpire).Err()
	if err != nil {
		return nil, err
	}

	return &TokenResult{
		AccessToken:        accessTokenString,
		RefreshToken:       refreshTokenString,
		SessionID:          sessionID,
		AccessTokenExpire:  accessTokenExpire,
		RefreshTokenExpire: refreshTokenExpire,
		SessionExpire:      sessionExpire,
	}, nil
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
	tokenResult, err := s.GenerateToken(user.UserId, user.Username)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(shared.ErrorResponse{
			ErrorCode: "TOKEN_GENERATION_FAILED",
			Message:   "Failed to generate tokens",
		})
	}

	// store session in Redis with device-specific key
	sessionKey := fmt.Sprintf("session:%s:%s", user.UserId, tokenResult.SessionID)
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

	s.redisClient.Expire(context.Background(), sessionKey, tokenResult.SessionExpire)

	// Set access token as HTTP-Only cookie
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    tokenResult.AccessToken,
		Expires:  time.Now().Add(tokenResult.AccessTokenExpire),
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
		Path:     "/",
	})

	// Set refresh token as HTTP-Only cookie
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    tokenResult.RefreshToken,
		Expires:  time.Now().Add(tokenResult.RefreshTokenExpire),
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
		Path:     "/",
	})

	return c.JSON(TokenResponse{
		Message: "Login successful",
		User:    fiber.Map{"id": user.UserId, "username": user.Username},
	})
}

func (s *AuthService) RefreshTokenHandler(c *fiber.Ctx) error {
	refreshTokenFromCookie := c.Cookies("refresh_token")

	if refreshTokenFromCookie == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
			ErrorCode: "MISSING_REFRESH_TOKEN",
			Message:   "Refresh token is required",
		})
	}

	cfg := config.GetConfig()
	JWT_SECRET := []byte(cfg.Secrets.JWT_SECRET)
	claims := &shared.Claims{}
	token, err := jwt.ParseWithClaims(refreshTokenFromCookie, claims, func(token *jwt.Token) (interface{}, error) {
		return JWT_SECRET, nil
	})

	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
			ErrorCode: "INVALID_REFRESH_TOKEN",
			Message:   "Refresh token is invalid or expired",
		})
	}

	key := fmt.Sprintf("refresh_token:%s:%s:%s", claims.UserID, claims.SessionID, claims.ID)
	storedToken, err := s.redisClient.Get(context.Background(), key).Result()
	if err != nil || storedToken != refreshTokenFromCookie {
		return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
			ErrorCode: "REFRESH_TOKEN_NOT_FOUND",
			Message:   "Refresh token not found or has been revoked",
		})
	}

	// Check device-specific session using sessionId from token
	sessionKey := fmt.Sprintf("session:%s:%s", claims.UserID, claims.SessionID)
	exists, err := s.redisClient.Exists(context.Background(), sessionKey).Result()
	if err != nil || exists == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
			ErrorCode: "SESSION_EXPIRED",
			Message:   "Session has expired, please login again",
		})
	}

	// generate tokens (access and refresh) - reuse existing sessionId
	tokenResult, err := s.GenerateToken(claims.UserID, claims.Username, claims.SessionID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(shared.ErrorResponse{
			ErrorCode: "TOKEN_GENERATION_FAILED",
			Message:   "Failed to generate tokens",
		})
	}

	// expand expire session in redis
	s.redisClient.Expire(context.Background(), sessionKey, tokenResult.SessionExpire)

	// Set access token as HTTP-Only cookie
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    tokenResult.AccessToken,
		Expires:  time.Now().Add(tokenResult.AccessTokenExpire),
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
		Path:     "/",
	})

	// Set refresh token as HTTP-Only cookie
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    tokenResult.RefreshToken,
		Expires:  time.Now().Add(tokenResult.RefreshTokenExpire),
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
		Path:     "/",
	})

	return c.JSON(fiber.Map{
		"message": "Token refreshed successfully",
	})
}

func (s *AuthService) LogoutHandler(c *fiber.Ctx) error {
	userId := c.Locals("userId").(string)
	sessionId := c.Locals("sessionId").(string)
	refreshTokenFromCookie := c.Cookies("refresh_token")

	// delete only current refresh token (not all sessions)
	if refreshTokenFromCookie != "" {
		cfg := config.GetConfig()
		JWT_SECRET := []byte(cfg.Secrets.JWT_SECRET)
		claims := &shared.Claims{}
		token, err := jwt.ParseWithClaims(refreshTokenFromCookie, claims, func(token *jwt.Token) (interface{}, error) {
			return JWT_SECRET, nil
		})

		// delete current refresh token from Redis
		if err == nil && token.Valid && claims.ID != "" {
			refreshTokenKey := fmt.Sprintf("refresh_token:%s:%s:%s", userId, sessionId, claims.ID)
			s.redisClient.Del(context.Background(), refreshTokenKey)
		}
	}

	// Delete device-specific session
	sessionKey := fmt.Sprintf("session:%s:%s", userId, sessionId)
	s.redisClient.Del(context.Background(), sessionKey)

	// clear access token cookie
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    "",
		Expires:  time.Now().Add(-time.Hour),
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
		Path:     "/",
	})

	// clear refresh token cookie
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Expires:  time.Now().Add(-time.Hour),
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
		Path:     "/",
	})

	return c.JSON(fiber.Map{
		"message": "Logged out successfully",
	})
}

func (s *AuthService) ProfileHandler(c *fiber.Ctx) error {
	userId := c.Locals("userId").(string)
	username := c.Locals("username").(string)
	sessionId := c.Locals("sessionId").(string)

	// get session info
	sessionKey := fmt.Sprintf("session:%s:%s", userId, sessionId)
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
	sessionId := c.Locals("sessionId").(string)
	sessionKey := fmt.Sprintf("session:%s:%s", userId, sessionId)

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
	sessionId := c.Locals("sessionId").(string)

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
	sessionKey := fmt.Sprintf("session:%s:%s", userId, sessionId)
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

	// check lock over timeout
	if lockedAtStr, exists := sessionData["lockedAt"]; exists {
		lockedAt, _ := strconv.ParseInt(lockedAtStr, 10, 64)
		lockDuration := time.Now().Unix() - lockedAt

		cfg := config.GetConfig()
		lockTimeout := int64(cfg.Env.LOCK_SCREEN_TIMEOUT_SECONDS)

		if lockDuration > lockTimeout {
			s.deleteSession(userId, sessionId)
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

func (s *AuthService) deleteSession(userId, sessionId string) {
	// delete device-specific session
	sessionKey := fmt.Sprintf("session:%s:%s", userId, sessionId)
	s.redisClient.Del(context.Background(), sessionKey)

	// delete only refresh tokens associated with THIS session
	pattern := fmt.Sprintf("refresh_token:%s:%s:*", userId, sessionId)
	keys, err := s.redisClient.Keys(context.Background(), pattern).Result()
	if err == nil && len(keys) > 0 {
		s.redisClient.Del(context.Background(), keys...)
	}
}

// Handler สำหรับเช็คสถานะ session
func (s *AuthService) CheckSessionHandler(c *fiber.Ctx) error {
	userId := c.Locals("userId").(string)
	sessionId := c.Locals("sessionId").(string)

	sessionKey := fmt.Sprintf("session:%s:%s", userId, sessionId)
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

			cfg := config.GetConfig()
			lockTimeout := int64(cfg.Env.LOCK_SCREEN_TIMEOUT_SECONDS)

			// ถ้า lock เกิน timeout ให้ logout
			if lockDuration > lockTimeout {
				s.deleteSession(userId, sessionId)
				return c.Status(fiber.StatusUnauthorized).JSON(shared.ErrorResponse{
					ErrorCode: "LOCK_TIMEOUT",
					Message:   "Session expired due to inactivity",
				})
			}

			response["lockedAt"] = lockedAt
			response["timeRemaining"] = lockTimeout - lockDuration
		}
	}

	return c.JSON(response)
}
