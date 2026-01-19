//go:build api_doc
// +build api_doc

package auth

// Login godoc
// @Summary      User login
// @Description  Authenticate user with username and password
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        request body LoginRequest true "Login credentials"
// @Success      200 {object} TokenResponse "Successfully logged in with access and refresh tokens"
// @Failure      400 {object} shared.ErrorResponse "Invalid request body"
// @Failure      401 {object} shared.ErrorResponse "Invalid username or password"
// @Failure      500 {object} shared.ErrorResponse "Internal server error"
// @Router       /auth/login [post]
func Login() {}

// RefreshToken godoc
// @Summary      Refresh access token
// @Description  Generate new access token using refresh token
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        request body RefreshTokenRequest true "Refresh token"
// @Success      200 {object} TokenResponse "New access token generated"
// @Failure      400 {object} shared.ErrorResponse "Invalid request body"
// @Failure      401 {object} shared.ErrorResponse "Invalid or expired refresh token"
// @Failure      500 {object} shared.ErrorResponse "Internal server error"
// @Router       /auth/refresh-token [post]
func RefreshToken() {}

// Logout godoc
// @Summary      User logout
// @Description  Invalidate current session and remove tokens
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} map[string]string "Successfully logged out"
// @Failure      401 {object} shared.ErrorResponse "Unauthorized - invalid or missing token"
// @Failure      500 {object} shared.ErrorResponse "Internal server error"
// @Router       /auth/logout [post]
func Logout() {}

// LockSession godoc
// @Summary      Lock user session
// @Description  Lock current session temporarily (similar to screen lock)
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        request body LockSessionRequest true "Lock timestamp"
// @Success      200 {object} map[string]interface{} "Session locked successfully"
// @Failure      400 {object} shared.ErrorResponse "Invalid request body"
// @Failure      401 {object} shared.ErrorResponse "Unauthorized - invalid or missing token"
// @Failure      500 {object} shared.ErrorResponse "Internal server error"
// @Router       /auth/lock [post]
func LockSession() {}

// UnlockSession godoc
// @Summary      Unlock user session
// @Description  Unlock previously locked session by verifying password
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        request body UnlockRequest true "Password for verification"
// @Success      200 {object} map[string]interface{} "Session unlocked successfully"
// @Failure      400 {object} shared.ErrorResponse "Invalid request body"
// @Failure      401 {object} shared.ErrorResponse "Invalid password"
// @Failure      403 {object} shared.ErrorResponse "Session is not locked"
// @Failure      500 {object} shared.ErrorResponse "Internal server error"
// @Router       /auth/unlock [post]
func UnlockSession() {}

// CheckSession godoc
// @Summary      Check session status
// @Description  Get current user session information and lock status
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} map[string]interface{} "Session information including lock status and user data"
// @Failure      401 {object} shared.ErrorResponse "Unauthorized - invalid or missing token"
// @Failure      500 {object} shared.ErrorResponse "Internal server error"
// @Router       /auth/check-session [get]
func CheckSession() {}

// Profile godoc
// @Summary      Get user profile
// @Description  Retrieve authenticated user's profile information
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} map[string]interface{} "User profile with session data"
// @Failure      401 {object} shared.ErrorResponse "Unauthorized - invalid or missing token"
// @Failure      500 {object} shared.ErrorResponse "Internal server error"
// @Router       /auth/profile [get]
func Profile() {}
