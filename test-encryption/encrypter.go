package main

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
)

func Pkcs5Padding(data []byte, blockSize int) []byte {
	padding := blockSize - len(data)%blockSize
	padText := bytes.Repeat([]byte{byte(padding)}, padding)
	return append(data, padText...)
}

func AesEncrypt(key string, iv string, plaintext string) (string, error) {
	if iv == "" || len(iv) != 16 {
		return "", nil
	}

	block, err := aes.NewCipher([]byte(key))
	if err != nil {
		return "", err
	}

	bytes := Pkcs5Padding([]byte(plaintext), block.BlockSize())

	mode := cipher.NewCBCEncrypter(block, []byte(iv))
	cipherText := make([]byte, len(bytes))
	mode.CryptBlocks(cipherText, bytes)

	str := string(cipherText)
	return EncodeTextToBase64(str), nil
}

func AesDecrypt(key string, iv string, cipherText string) (string, error) {
	if iv == "" || len(iv) != 16 {
		return "", nil
	}

	block, err := aes.NewCipher([]byte(key))
	if err != nil {
		return "", err
	}

	decoded, err := DecodeBase64ToText(cipherText)
	if err != nil {
		return "", err
	}

	mode := cipher.NewCBCDecrypter(block, []byte(iv))
	plainText := make([]byte, len(decoded))
	mode.CryptBlocks(plainText, []byte(decoded))

	return string(plainText), nil
}
