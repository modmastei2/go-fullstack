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

		decrypt, err := UnlockPayload[FilterPayload](c, KEY, IV, request.Message)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		fmt.Println("Encrypted and Encoded Message:", decrypt)

		var response ResponseModel[FilterModel]
		response.Success = true
		response.Status = 200
		response.Message = "Decryption successful"
		response.Timestamp = fmt.Sprintf("%d", c.Context().Time().Unix())
		response.Info = infoModel{
			ApiCode:        "FILTER_SEARCH",
			ApiName:        "Filter Search",
			ApiDescription: "API for searching filters",
		}
		response.Result = ResultModel[FilterModel]{
			Data: FilterModel{
				SearchParam: map[string]any{
					"value_group": "1",
				},
				Template: FilterTemplate{
					DetailSection: DetailSection{
						Grid: Grid{
							Columns:   12,
							RowGap:    8,
							ColumnGap: 8,
						},
						Details: []Detail{
							{
								Row:     1,
								Order:   1,
								ColSpan: 4,
								Value: Value{
									Id:              "value_group",
									Type:            "dropdown",
									Required:        true,
									ShowClearButton: true, //	add new
									Multiple:        true, //	add new
									Lines: []Lines{
										{
											Segments: []Segments{
												{
													Text: "Selected Group :",
													Attrs: Attrs{
														Class: "modal_value_cyan",
													},
												},
												{
													Text: "Control view column apply:",
													Attrs: Attrs{
														Class: "text-xs text-gray-600 dark:text-gray-400",
													},
												},
											},
										},
									},
									Options: []map[string]any{
										{
											"text":  "Bond Transactions",
											"value": "1",
										},
										{
											"text":  "Equity Transactions",
											"value": "2",
										},
										{
											"text":  "Other Transactions",
											"value": "3",
										},
									},
								},
							},
							{
								Row:     1,
								Order:   2,
								ColSpan: 4,
								Value: Value{
									Id:              "sale_team",
									Type:            "dropdown",
									Required:        false,
									ShowClearButton: true,
									Lines: []Lines{
										{
											Segments: []Segments{
												{
													Text: "Sales Team :",
													Attrs: Attrs{
														Class: "modal_value_cyan",
													},
												},
											},
										},
									},
									Options: []map[string]any{
										{
											"text":  "Team A",
											"value": "TEAM_A",
										},
										{
											"text":  "Team B",
											"value": "TEAM_B",
										},
										{
											"text":  "Team C",
											"value": "TEAM_C",
										},
									},
								},
							},
							{
								Row:     1,
								Order:   3,
								ColSpan: 4,
								Value: Value{
									Id:       "sales_name",
									Type:     "dropdown",
									Required: true,
									Cascading: Cascading{
										DependsOn: "sale_team",
										GroupKey:  "team",
									},
									Lines: []Lines{
										{
											Segments: []Segments{
												{
													Text: "Sales Name :",
													Attrs: Attrs{
														Class: "modal_value_cyan",
													},
												},
											},
										},
									},
									Options: []map[string]any{
										{
											"text":  "Alice",
											"value": "ALICE",
											"team":  "TEAM_A",
										},
										{
											"text":  "Bob",
											"value": "BOB",
											"team":  "TEAM_B",
										},
										{
											"text":  "Charlie",
											"value": "CHARLIE",
											"team":  "TEAM_C",
										},
									},
								},
							},
						},
					},
				},
			},
		}

		encrypt, err := LockResult(c, KEY, IV, response)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to encrypt response",
			})
		}

		log.Printf("🔒 Encrypted API response: %s\n", encrypt)

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": encrypt,
		})
	})

	api.Post("/customers/search", func(c *fiber.Ctx) error {
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

		decrypt, err := UnlockPayload[ResultModel[FilterModel]](c, KEY, IV, request.Message)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		fmt.Println("Encrypted and Encoded Message:", decrypt)

		var response ResponseModel[any]
		response.Success = true
		response.Status = 200
		response.Message = "Customer search successful"
		response.Timestamp = fmt.Sprintf("%d", c.Context().Time().Unix())
		response.Info = infoModel{
			ApiCode:        "CUSTOMER_SEARCH",
			ApiName:        "Customer Search",
			ApiDescription: "API for searching customers based on filter criteria",
		}
		response.Result = ResultModel[any]{
			Data: map[string]any{
				"customers": []map[string]any{
					{
						"id":   "CUST001",
						"name": "John Doe",
					},
				},
			},
		}
		encrypt, err := LockResult(c, KEY, IV, response)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to encrypt response",
			})
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": encrypt,
		})
	})

	log.Fatal(app.Listen(":9090"))
}
