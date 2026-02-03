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
		Data_Source: map[string][]DataSourceModel{
			"product": {
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
			"sale_id": {
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
			"sale_name": {
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
			"sale_team": {
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
		Meta_Group: []MetaGroupModel{
			{
				Text:  "Search",
				SmCol: 1,
				MdCol: 2,
				LgCol: 3,
				Meta: []MetaModel{
					{
						Name:        "client_code",
						DisplayExpr: "Client Code",
						Type:        "text",
						ColSpan:     1,
					},
					{
						Name:        "client_name",
						DisplayExpr: "Client Name",
						Type:        "text",
						ColSpan:     1,
					},
					{
						Name:          "product",
						DisplayExpr:   "Product",
						Type:          "dropdown",
						ColSpan:       1,
						DataSourceKey: "product",
					},
					{
						Name:          "sale_id",
						DisplayExpr:   "Sale ID",
						Type:          "dropdown",
						ColSpan:       1,
						DataSourceKey: "sale_id",
					},
					{
						Name:          "sale_name",
						DisplayExpr:   "Sale Name",
						Type:          "dropdown",
						ColSpan:       1,
						DataSourceKey: "sale_name",
					},
					{
						Name:          "sale_team",
						DisplayExpr:   "Sale Team",
						Type:          "dropdown",
						ColSpan:       1,
						DataSourceKey: "sale_team",
					},
				},
			},
			{
				Text:  "Period",
				SmCol: 1,
				MdCol: 2,
				LgCol: 2,
				Meta: []MetaModel{
					{
						Name:        "period",
						DisplayExpr: "Select period",
						Type:        "date_range",
						ColSpan:     2,
					},
				},
			},
		},
	})
}
