package log

import (
	"encoding/json"
	"go-backend/internal/config"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
)

type Logger struct {
}

var logger *Logger

func GetLogger() *Logger {
	if logger == nil {
		initLogger()
	}
	return logger
}

func initLogger() {
	logger = &Logger{}
}

func (l *Logger) Info(c *fiber.Ctx, msg string, fields map[string]interface{}) {
	cfg := config.GetConfig()
	// Implement info level logging
	structured := map[string]interface{}{
		"timestamp":   time.Now().Format(time.RFC3339),
		"level":       "INFO",
		"system_name": cfg.Env.SYSTEM_NAME,
		"method":      c.Method(),
		"path":        c.Path(),
		"client_ip":   c.IP(),
		"user_agent":  c.Get("User-Agent"),
		"message":     msg,
	}

	for k, v := range fields {
		structured[k] = v
	}

	logData, _ := json.Marshal(structured)
	log.Println(string(logData))
}

func (l *Logger) Error(c *fiber.Ctx, err error, fields map[string]interface{}) {
	cfg := config.GetConfig()
	// Implement error level logging
	structured := map[string]interface{}{
		"timestamp":   time.Now().Format(time.RFC3339),
		"level":       "ERROR",
		"system_name": cfg.Env.SYSTEM_NAME,
		"method":      c.Method(),
		"path":        c.Path(),
		"client_ip":   c.IP(),
		"user_agent":  c.Get("User-Agent"),
		"error":       err.Error(),
	}

	for k, v := range fields {
		structured[k] = v
	}

	logData, _ := json.Marshal(structured)
	log.Println(string(logData))
}
