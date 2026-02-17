package filter

import (
	"context"
	"go-backend/internal/client"
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
	var filterPayload FilterPayload
	if err := c.BodyParser(&filterPayload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}

	var result = new(ResponseModel)
	err := s.httpClient.Do(context.Background(), http.MethodPost, "/filters/search", filterPayload, result)
	log.Printf("📁 GetFilter called with payload: %+v, result: %+v, error: %v\n", filterPayload, result, err)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch filter",
		})
	}

	return c.Status(fiber.StatusOK).JSON(result)
}
