package filter

import (
	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
)

type HistoricalService struct {
	redisClient *redis.Client
}

func NewHistoricalService(redisClient *redis.Client) *HistoricalService {
	return &HistoricalService{
		redisClient: redisClient,
	}
}

func (s *HistoricalService) GetHistoricalFilter(c *fiber.Ctx) error {
	var param GetFilterParam
	if err := c.BodyParser(&param); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	return c.JSON(GetFilterResponse{
		Group: []CriteriaGroupModel{
			{
				Text:  "Search",
				SmCol: 1,
				MdCol: 2,
				LgCol: 3,
				Criteria: []CriteriaModel{
					{
						Name:        "client_code",
						DisplayExpr: "Client Code",
						Type:        "text",
						ColSpan:     1,
						DataSource:  []DataSourceModel{},
					},
					{
						Name:        "client_name",
						DisplayExpr: "Client Name",
						Type:        "text",
						ColSpan:     1,
						DataSource:  []DataSourceModel{},
					},
					{
						Name:        "product",
						DisplayExpr: "Product",
						Type:        "dropdown",
						ColSpan:     1,
						DataSource: []DataSourceModel{
							{
								Text:        "All Product",
								Value:       "",
								DisplayExpr: "All Product",
								ValueExpr:   "",
								Disabled:    false,
							},
							{
								Text:        "Mutual Fund",
								Value:       "MF",
								DisplayExpr: "Mutual Fund",
								ValueExpr:   "MF",
								Disabled:    false,
							},
							{
								Text:        "Bond",
								Value:       "BOND",
								DisplayExpr: "Bond",
								ValueExpr:   "BOND",
								Disabled:    false,
							},
							{
								Text:        "Structured Note",
								Value:       "SN",
								DisplayExpr: "Structured Note",
								ValueExpr:   "SN",
								Disabled:    false,
							},
						},
					},
					{
						Name:        "sale_id",
						DisplayExpr: "Sale ID",
						Type:        "dropdown",
						ColSpan:     1,
						DataSource: []DataSourceModel{
							{
								Text:        "S001",
								Value:       "S001",
								DisplayExpr: "S001",
								ValueExpr:   "S001",
								Disabled:    false,
							},
							{
								Text:        "S002",
								Value:       "S002",
								DisplayExpr: "S002",
								ValueExpr:   "S002",
								Disabled:    false,
							},
						},
					},
					{
						Name:        "sale_name",
						DisplayExpr: "Sale Name",
						Type:        "dropdown",
						ColSpan:     1,
						DataSource: []DataSourceModel{
							{
								Text:        "John Doe",
								Value:       "john",
								DisplayExpr: "John Doe",
								ValueExpr:   "john",
								Disabled:    false,
							},
							{
								Text:        "Jane Smith",
								Value:       "jane",
								DisplayExpr: "Jane Smith",
								ValueExpr:   "jane",
								Disabled:    false,
							},
						},
					},
					{
						Name:        "sale_team",
						DisplayExpr: "Sale Team",
						Type:        "dropdown",
						ColSpan:     1,
						DataSource: []DataSourceModel{
							{
								Text:        "Team A",
								Value:       "team_a",
								DisplayExpr: "Team A",
								ValueExpr:   "team_a",
								Disabled:    false,
							},
							{
								Text:        "Team B",
								Value:       "team_b",
								DisplayExpr: "Team B",
								ValueExpr:   "team_b",
								Disabled:    false,
							},
						},
					},
					{
						Name:        "period",
						DisplayExpr: "Select period",
						Type:        "date_range",
						ColSpan:     2,
						DataSource:  []DataSourceModel{},
					},
				},
			},
		},
	})
}
