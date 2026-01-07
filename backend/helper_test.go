package main

import (
	"os"
	"testing"
)

func TestGetEnv(t *testing.T) {
	tests := []struct {
		name         string
		key          string
		defaultValue string
		envValue     string
		setEnv       bool
		want         string
	}{
		{
			name:         "returns environment variable when set",
			key:          "TEST_KEY_1",
			defaultValue: "default",
			envValue:     "from_env",
			setEnv:       true,
			want:         "from_env",
		},
		{
			name:         "returns default value when env variable not set",
			key:          "TEST_KEY_2",
			defaultValue: "default_value",
			envValue:     "",
			setEnv:       false,
			want:         "default_value",
		},
		{
			name:         "returns default value when env variable is empty string",
			key:          "TEST_KEY_3",
			defaultValue: "default",
			envValue:     "",
			setEnv:       true,
			want:         "default",
		},
		{
			name:         "handles empty default value",
			key:          "TEST_KEY_4",
			defaultValue: "",
			envValue:     "",
			setEnv:       false,
			want:         "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			if tt.setEnv {
				os.Setenv(tt.key, tt.envValue)
				defer os.Unsetenv(tt.key)
			} else {
				os.Unsetenv(tt.key)
			}

			// Execute
			got := getEnv(tt.key, tt.defaultValue)

			// Assert
			if got != tt.want {
				t.Errorf("getEnv(%q, %q) = %q, want %q", tt.key, tt.defaultValue, got, tt.want)
			}
		})
	}
}

func TestGetEnv_RealWorldScenarios(t *testing.T) {
	t.Run("JWT_SECRET with default", func(t *testing.T) {
		os.Unsetenv("JWT_SECRET")
		got := getEnv("JWT_SECRET", "default_secret")
		if got != "default_secret" {
			t.Errorf("Expected default_secret, got %s", got)
		}
	})

	t.Run("REDIS_ADDR with environment value", func(t *testing.T) {
		os.Setenv("REDIS_ADDR", "redis:6379")
		defer os.Unsetenv("REDIS_ADDR")

		got := getEnv("REDIS_ADDR", "localhost:6379")
		if got != "redis:6379" {
			t.Errorf("Expected redis:6379, got %s", got)
		}
	})

	t.Run("ALLOW_MULTIPLE_SESSIONS boolean flag", func(t *testing.T) {
		os.Setenv("ALLOW_MULTIPLE_SESSIONS", "true")
		defer os.Unsetenv("ALLOW_MULTIPLE_SESSIONS")

		got := getEnv("ALLOW_MULTIPLE_SESSIONS", "false")
		if got != "true" {
			t.Errorf("Expected true, got %s", got)
		}
	})
}
