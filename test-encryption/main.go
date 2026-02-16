package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	_ "github.com/joho/godotenv/autoload"
)

func main() {
	app := fiber.New(fiber.Config{
		AppName: "Endpoint Encryption Test",
	})

	app.Use(EncryptionMiddleware())

	app.Use(func(c *fiber.Ctx) error {
		// log request info
		// get header
		headers := c.GetReqHeaders()
		strHeader := ""
		for key, value := range headers {
			strHeader += fmt.Sprintf("Header: %s=%s", key, value)
		}
		log.Printf("📁 Request Method: %s, Request Path: %s, Headers: %s", c.Method(), c.Path(), strHeader)

		return c.Next()
	})

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Welcome to the Endpoint Encryption Test API!")
	})

	api := app.Group("/api/v1/wealth")

	api.Post("/filters/search", func(c *fiber.Ctx) error {
		pretoken, err := DecodeBase64ToText(c.Get("pretoken"))
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid pretoken",
			})
		}

		KEY := os.Getenv("API_KEY")
		PREFIX := os.Getenv("PREFIX")
		IV := fmt.Sprintf("%s%s", PREFIX, pretoken)

		request := new(RequestModel)
		if err := c.BodyParser(request); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid request body",
			})
		}

		encrypt, err := AesDecrypt(KEY, IV, request.Message)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Encryption failed",
			})
		}

		fmt.Println("Encrypted and Encoded Message:", encrypt)

		return c.SendString("Encryption Test Successful with pretoken: " + pretoken)
	})

	log.Fatal(app.Listen(":9090"))
}
