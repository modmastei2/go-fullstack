package main

import (
	"encoding/json"
	"fmt"

	"github.com/gofiber/fiber/v2"
)

func UnlockPayload[T any](c *fiber.Ctx, KEY string, IV string, message string) (*T, error) {
	decrypt, err := AesDecrypt(KEY, IV, message)
	if err != nil {
		return nil, fmt.Errorf("Failed to decrypt message: %w", err)
	}

	var result T
	if err := json.Unmarshal([]byte(decrypt), &result); err != nil {
		return nil, fmt.Errorf("Failed to unmarshal decrypted message: %w", err)
	}
	return &result, nil
}

func LockResult(c *fiber.Ctx, KEY string, IV string, result any) (string, error) {
	responseBytes, err := json.Marshal(result)
	if err != nil {
		return "", fmt.Errorf("Failed to marshal response: %w", err)
	}

	encrypt, err := AesEncrypt(KEY, IV, string(responseBytes))
	if err != nil {
		return "", fmt.Errorf("Failed to encrypt response: %w", err)
	}

	return encrypt, nil
}
