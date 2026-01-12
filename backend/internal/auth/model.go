package auth

type User struct {
	UserId   string `json:"userId"`
	Username string `json:"username"`
	Password string `json:"password"`
}

// Mock database
var users = map[string]User{
	"user1": {
		UserId:   "1",
		Username: "user1",
		Password: "$2a$10$UbDFYt/ybeIfPnvIQp4rnu2PI4BckMLcPVN7SCVvD1prr2zUw9Sr.", // password
	},
	"user2": {
		UserId:   "2",
		Username: "user2",
		Password: "$2a$10$UbDFYt/ybeIfPnvIQp4rnu2PI4BckMLcPVN7SCVvD1prr2zUw9Sr.", // password
	},
	"user3": {
		UserId:   "3",
		Username: "user3",
		Password: "$2a$10$UbDFYt/ybeIfPnvIQp4rnu2PI4BckMLcPVN7SCVvD1prr2zUw9Sr.", // password
	},
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type TokenResponse struct {
	AccessToken  string      `json:"accessToken"`
	RefreshToken string      `json:"refreshToken"`
	User         interface{} `json:"user,omitempty"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token"`
}
type LockSessionRequest struct {
	Timestamp int64 `json:"timestamp"`
}

type UnlockRequest struct {
	Password string `json:"password"`
}
