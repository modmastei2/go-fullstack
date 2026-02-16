package log

import (
	"encoding/json"
	"go-backend/internal/extensions"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
)

type Logger struct {
	cfg *extensions.Config
}

var logger *Logger

func GetLogger() *Logger {
	if logger == nil {
		initLogger()
	}
	return logger
}

func initLogger() {
	logger = &Logger{
		cfg: extensions.GetConfig(),
	}
}

func (l *Logger) baseFields(c *fiber.Ctx, level, msg string) map[string]interface{} {
	return map[string]interface{}{
		"timestamp":  time.Now().Format(time.RFC3339),
		"level":      level,
		"system":     l.cfg.Env.SYSTEM_NAME,
		"method":     c.Method(),
		"path":       c.OriginalURL(),
		"client_ip":  c.IP(),
		"user_agent": c.Get("User-Agent"),
		"message":    msg,
	}
}

func (l *Logger) Info(c *fiber.Ctx, msg string, fields ...map[string]interface{}) {
	// Implement info level logging
	structured := l.baseFields(c, "INFO", msg)

	if len(fields) > 0 {
		for k, v := range fields[0] {
			structured[k] = v
		}
	}

	logData, _ := json.Marshal(structured)
	log.Println(string(logData))
}

func (l *Logger) Error(c *fiber.Ctx, err error, fields ...map[string]interface{}) {
	// Implement error level logging
	structured := l.baseFields(c, "ERROR", err.Error())

	if len(fields) > 0 {
		for k, v := range fields[0] {
			structured[k] = v
		}
	}

	logData, _ := json.Marshal(structured)
	log.Println(string(logData))
}
