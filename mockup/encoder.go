package main

import (
	"encoding/base64"
	"log"
)

func EncodeTextToBase64(text string) string {
	bytes := []byte(text)

	encoded := base64.StdEncoding.EncodeToString(bytes)
	log.Printf("🔐 Encoded Text %s to Base64: %s", text, encoded)
	return encoded
}

func DecodeBase64ToText(encoded string) (string, error) {
	bytes, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return "", err
	}

	log.Printf("🔐 Decoded Base64 %s to Text: %s", encoded, string(bytes))

	return string(bytes), nil
}
