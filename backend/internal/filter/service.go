package filter

import (
	"context"
	"go-backend/internal/client"
	"go-backend/internal/shared"
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
	var filterPayload FilterPayload
	if err := c.BodyParser(&filterPayload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}

	var response = new(ResponseModel[shared.FilterSearchParam])
	err := s.httpClient.Do(context.Background(), http.MethodPost, "/filters/search", filterPayload, response)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch filter",
		})
	}

	return c.Status(fiber.StatusOK).JSON(response)
}
