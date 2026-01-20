package middleware

import "github.com/gofiber/fiber/v2"

func SecurityHeaderMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")

		csp := "default-src 'self'; " +
			"object-src 'none'; " +
			"frame-ancestors 'none'; " +
			"base-uri 'self'; " +
			"form-action 'self'; " +
			"upgrade-insecure-requests"

		c.Set("Content-Security-Policy", csp)
		c.Set("X-Content-Type-Options", "nosniff")
		c.Set("X-Frame-Options", "DENY")
		return c.Next()
	}
}
