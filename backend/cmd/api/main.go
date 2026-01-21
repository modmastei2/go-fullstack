package main

import (
	"go-backend/internal/bootstrap"
	"go-backend/internal/config"
	"log"

	"github.com/gofiber/fiber/v2"
	fiberSwagger "github.com/swaggo/fiber-swagger"
)

// @title KS_Wealth API
// @version 1.0
// @description This is the API documentation for the KS_Wealth backend server.
// @host localhost:8080
// @BasePath /api/v1
func main() {
	app := fiber.New(fiber.Config{
		AppName:               "KS_WEALTH_API",
		ServerHeader:          "",
		DisableStartupMessage: true,
	})

	// ******* Setup Swagger and Static File Serving *******
	app.Get("/swagger/*", fiberSwagger.WrapHandler)
	app.Static("/docs", "./docs")
	app.Static("/redoc", "./public/redoc")

	bootstrap.InitializeApp(app)

	cfg := config.GetConfig()

	if cfg.Env.APP_ENV == "production" {
		log.Fatal(app.ListenTLS(":443", cfg.Env.TLS_CERT_PATH, cfg.Env.TLS_KEY_PATH))
	} else if cfg.Env.APP_FORCE_HTTPS {
		log.Fatal(app.ListenTLS(":8080", cfg.Env.TLS_CERT_PATH, cfg.Env.TLS_KEY_PATH))
	} else {
		log.Fatal(app.Listen(":8080"))
	}
}
