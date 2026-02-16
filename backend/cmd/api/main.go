package main

import (
	"go-backend/internal/bootstrap"
	"log"

	"github.com/gofiber/fiber/v2"
	fiberSwagger "github.com/swaggo/fiber-swagger"
)

// @title KS_Wealth API
// @version 1.0
// @description This is the API documentation for the KS_Wealth backend server. Authentication uses HTTP-only cookies.
// @host localhost:8080
// @BasePath /api/v1
// @securityDefinitions.apikey CookieAuth
// @in cookie
// @name access_token
// @description Access token stored in HTTP-only cookie. Login via /auth/login to set cookie automatically.
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

	log.Fatal(app.Listen(":8080"))
}
