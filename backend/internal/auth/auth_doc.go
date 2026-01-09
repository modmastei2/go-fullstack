//go:build api_doc
// +build api_doc

package auth

// Login
// @Summary Login route
// @Tags Auth
// @Param username body string true "Username"
// @Param password body string true "Password"
// @Success 200 {object} TokenResponse "Tokens and user info"
// @Failure 400 {object} shared.ErrorResponse "Invalid request"
// @Failure 401 {object} shared.ErrorResponse "Unauthorized"
// @Failure 500 {object} shared.ErrorResponse "Internal server error"
// @Router /login [post]
func Login()

// Logout
// @Security ApiKeyAuth
// @Tags Auth
// @Summary Logout route
// @Success 200 {string} string "Logout successful"
// @Router /logout [post]
func Logout()
