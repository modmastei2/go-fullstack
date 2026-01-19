package middleware

import (
	"go-backend/internal/log"
	"time"

	"github.com/gofiber/fiber/v2"
)

func LoggerMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		duration := time.Since(start)

		lg := log.GetLogger()
		if c.Response().StatusCode() >= 500 {
			lg.Error(c, err, map[string]interface{}{
				"status_code": c.Response().StatusCode(),
				"duration_ms": duration.Milliseconds(),
			})
		} else {
			lg.Info(c, "Request processed", map[string]interface{}{
				"status_code": c.Response().StatusCode(),
				"duration_ms": duration.Milliseconds(),
			})
		}

		return err
	}
}
