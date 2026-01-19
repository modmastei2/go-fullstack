package middleware

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
)

func LoggerMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		duration := time.Since(start)

		logStructured := map[string]interface{}{
			"timestamp":   time.Now().Format(time.RFC3339),
			"method":      c.Method(),
			"path":        c.Path(),
			"status":      c.Response().StatusCode(),
			"duration_ms": duration.Milliseconds(),
			"client_ip":   c.IP(),
			"user_agent":  c.Get("User-Agent"),
			"request_id":  c.Get("X-Request-ID"),
		}

		if c.Response().StatusCode() >= 500 {
			logStructured["level"] = "ERROR"
			logStructured["error"] = err.Error()
		} else {
			logStructured["level"] = "INFO"
		}

		// log as string
		logData, _ := json.Marshal(logStructured)
		log.Println(string(logData))

		return err
	}
}
