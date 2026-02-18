package main

import (
	"encoding/json"
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

		decrypt, err := AesDecrypt(KEY, IV, request.Message)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Encryption failed",
			})
		}

		fmt.Println("Encrypted and Encoded Message:", decrypt)

		var response ResponseModel
		response.Success = true
		response.Status = 200
		response.Message = "Decryption successful"
		response.Timestamp = fmt.Sprintf("%d", c.Context().Time().Unix())
		response.Info = infoModel{
			ApiCode:        "FILTER_SEARCH",
			ApiName:        "Filter Search",
			ApiDescription: "API for searching filters",
		}
		response.Result = ResultModel{
			Data: map[string]interface{}{
				"search_param": map[string]interface{}{
					"filter_type": "example",
					"query":       "example query",
				},
				"template": map[string]interface{}{
					"detail_section": map[string]interface{}{
						"grid": map[string]interface{}{
							"columns":   12,
							"rowGap":    8,
							"columnGap": 8,
						},
						// array
						"details": []map[string]interface{}{
							{
								"row":      1,
								"order":    1,
								"col_span": 6,
								"value": map[string]interface{}{
									"id":       "value_group",
									"type":     "dropdown",
									"required": true,
									"lines": []map[string]interface{}{
										{
											"segments": []map[string]interface{}{
												{
													"text": "Selected Group",
													"attrs": map[string]interface{}{
														"class": "modal_value_cyan",
													},
												},
												{
													"text": "Control view column apply:",
													"attrs": map[string]interface{}{
														"class": "text-xs text-gray-600 dark:text-gray-400",
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		}

		message, err := json.Marshal(response)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to marshal response",
			})
		}

		encrypt, _ := AesEncrypt(KEY, IV, string(message))

		log.Printf("🔒 Encrypted API response: %s\n", encrypt)

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": encrypt,
		})
	})

	log.Fatal(app.Listen(":9090"))
}
