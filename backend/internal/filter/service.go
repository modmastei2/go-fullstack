package filter

import (
	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
)

type FilterService struct {
	redisClient *redis.Client
}

func NewFilterService(redisClient *redis.Client) *FilterService {
	return &FilterService{
		redisClient: redisClient,
	}
}

func (s *FilterService) GetFilter(c *fiber.Ctx) error {
	var param GetFilterParam
	if err := c.BodyParser(&param); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	return c.JSON(GetFilterResponse{
		Criteria: []CriteriaModel{
			{
				Name:        "client_code",
				DisplayExpr: "Client Code",
				Type:        "text",
				DataSource: []DataSourceModel{
					{
						Text:        "Nattawut.W",
						Value:       "000001",
						DisplayExpr: "000001: Nattawut.W",
						ValueExpr:   "000001",
						Disabled:    false,
					},
				},
			},
			{
				Name:        "client_name",
				DisplayExpr: "Client Name",
				Type:        "dropdown",
				DataSource: []DataSourceModel{
					{
						Text:        "Nattawut.W",
						Value:       "000001",
						DisplayExpr: "000001: Nattawut.W",
						ValueExpr:   "000001",
						Disabled:    false,
					},
				},
			},
			{
				Name:        "product_type",
				DisplayExpr: "Product",
				Type:        "dropdown",
				DataSource: []DataSourceModel{
					{
						Text:        "Mutual Fund",
						Value:       "MF",
						DisplayExpr: "MF: Mutual Fund",
						ValueExpr:   "MF",
						Disabled:    false,
					},
					{
						Text:        "Bond",
						Value:       "BOND",
						DisplayExpr: "BOND: Bond",
						ValueExpr:   "BOND",
						Disabled:    false,
					},
					{
						Text:        "Structured Note",
						Value:       "SN",
						DisplayExpr: "SN: Structured Note",
						ValueExpr:   "SN",
						Disabled:    false,
					},
				},
			},
		},
	})
}
