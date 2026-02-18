package main

import "github.com/gofiber/fiber/v2"

func EncryptionMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// require headers pretoken and token
		allowEndpoints := []string{
			"/",
		}

		path := c.Path()
		isAllowedPath := false
		for _, endpoint := range allowEndpoints {
			if path == endpoint {
				isAllowedPath = true
				break
			}
		}

		if isAllowedPath {
			return c.Next()
		}

		preToken := c.Get("pretoken")
		token := c.Get("token")

		if preToken == "" || token == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing pretoken or token headers",
			})
		}

		request := new(RequestModel)
		if err := c.BodyParser(request); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid request body",
			})
		}

		return c.Next()
	}
}
