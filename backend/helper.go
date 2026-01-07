package main

import (
	"fmt"
	"os"

	_ "github.com/joho/godotenv/autoload"
)

func getEnv(key, defaultValue string) string {
	var value string

	defer func() {
		fmt.Println("Config_Code: ", key, ", Config_Value:", value)
	}()

	if value = os.Getenv(key); value != "" {
		return value
	}

	value = defaultValue

	return value
}
