package main

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"errors"
	"log"
)

func Pkcs5Padding(data []byte, blockSize int) []byte {
	padding := blockSize - len(data)%blockSize
	padText := bytes.Repeat([]byte{byte(padding)}, padding)
	return append(data, padText...)
}

func Pkcs5UnPadding(data []byte) []byte {
	length := len(data)
	unPadding := int(data[length-1])
	return data[:(length - unPadding)]
}

func AesEncrypt(key string, iv string, plaintext string) (string, error) {
	if iv == "" || len(iv) != 16 {
		return "", errors.New("invalid initial vector")
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

	log.Printf("🔐 Encrypted Text %s to CipherText: %s", plaintext, str)

	return EncodeTextToBase64(str), nil
}

func AesDecrypt(key string, iv string, cipherText string) (string, error) {
	if iv == "" || len(iv) != 16 {
		return "", errors.New("invalid initial vector")
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
	plainText = Pkcs5UnPadding(plainText)

	log.Printf("🔓 Decrypted CipherText %s to PlainText: %s", cipherText, string(plainText))

	return string(plainText), nil
}
