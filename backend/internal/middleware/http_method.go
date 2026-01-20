package middleware

import (
	"github.com/gofiber/fiber/v2"
)

func HttpMethodMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		method := c.Method()
		allowedMethods := map[string]bool{
			"GET":     true,
			"POST":    true,
			"PUT":     false,
			"DELETE":  false,
			"PATCH":   false,
			"OPTIONS": false,
			"HEAD":    false,
		}

		if allowed, exists := allowedMethods[method]; exists && allowed {
			return c.Next()
		}

		return c.Status(fiber.StatusMethodNotAllowed).JSON(fiber.Map{
			"error": "Method not allowed",
		})
	}
}
