package main

import (
	"go-backend/internal/bootstrap"

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
		AppName: "KS_WEALTH_API",
	})

	// ******* Setup Swagger and Static File Serving *******
	app.Get("/swagger/*", fiberSwagger.WrapHandler)
	app.Static("/docs", "./docs")
	app.Static("/redoc", "./public/redoc")

	bootstrap.InitializeApp(app)

	app.Listen(":8080")
}
