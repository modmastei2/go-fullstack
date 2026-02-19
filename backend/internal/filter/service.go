package filter

import (
	"context"
	"go-backend/internal/client"
	"go-backend/internal/shared"
	"log"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
)

type FilterService struct {
	redisClient *redis.Client
	httpClient  *client.XHttpClient
}

func NewFilterService(redisClient *redis.Client, httpClient *client.XHttpClient) *FilterService {
	return &FilterService{
		redisClient: redisClient,
		httpClient:  httpClient,
	}
}

func (s *FilterService) GetFilter(c *fiber.Ctx) error {
	// use model : shared api_filter_search.go
	var filterPayload shared.FilterParam
	if err := c.BodyParser(&filterPayload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}

	allowFilterKeys := map[string]bool{
		"client_360":   true,
		"sales_report": true,
	}

	if !allowFilterKeys[filterPayload.FilterKey] {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid filter_key",
		})
	}

	// use model : shared api_general_response.go > api_filter_search.go
	var response = new(shared.GeneralResponseModel[shared.FilterModel])
	err := s.httpClient.Do(context.Background(), http.MethodPost, "/filters/search", filterPayload, response)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch filter",
		})
	}

	response.Result.Data.Dest = "/customers/search"

	return c.Status(fiber.StatusOK).JSON(response.Result)
}

func (s *FilterService) FireSearch(c *fiber.Ctx) error {
	// use model : shared api_general_response.go > api_filter_search.go
	var param shared.GeneralResultModel[shared.FilterModel]
	if err := c.BodyParser(&param); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}
	log.Printf("Received search param: %+v\n", param)
	if param.Data.Dest == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Dest is required in the request payload",
		})
	}

	// use model : shared api_general_response.go
	var response = new(shared.GeneralResponseModel[shared.TableModel])
	err := s.httpClient.Do(context.Background(), http.MethodPost, param.Data.Dest, param.Data.SearchParam, response)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fire search",
		})
	}

	return c.Status(fiber.StatusOK).JSON(response.Result)
}
