package main

import (
	"go-backend/internal/bootstrap"

	"github.com/gofiber/fiber/v2"
)

func main() {
	app := fiber.New(fiber.Config{
		AppName: "KS_WEALTH_API",
	})

	bootstrap.InitializeApp(app)

	app.Listen(":8080")
}
