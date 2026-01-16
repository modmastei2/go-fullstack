package shared

import (
	"testing"
)

func TestStringToInt(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    int
		wantErr bool
	}{
		{
			name:    "Valid positive integer",
			input:   "123",
			want:    123,
			wantErr: false,
		},
		{
			name:    "Valid negative integer",
			input:   "-456",
			want:    -456,
			wantErr: false,
		},
		{
			name:    "Zero",
			input:   "0",
			want:    0,
			wantErr: false,
		},
		{
			name:    "Invalid string with letters",
			input:   "abc",
			want:    0,
			wantErr: true,
		},
		{
			name:    "Invalid string with mixed characters",
			input:   "123abc",
			want:    0,
			wantErr: true,
		},
		{
			name:    "Empty string",
			input:   "",
			want:    0,
			wantErr: true,
		},
		{
			name:    "String with spaces",
			input:   " 123 ",
			want:    0,
			wantErr: true,
		},
		{
			name:    "Large number",
			input:   "2147483647",
			want:    2147483647,
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := StringToInt(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("StringToInt() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("StringToInt() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestStringToIntWithDefault(t *testing.T) {
	tests := []struct {
		name         string
		input        string
		defaultValue int
		want         int
	}{
		{
			name:         "Valid positive integer",
			input:        "123",
			defaultValue: 999,
			want:         123,
		},
		{
			name:         "Valid negative integer",
			input:        "-456",
			defaultValue: 999,
			want:         -456,
		},
		{
			name:         "Zero",
			input:        "0",
			defaultValue: 999,
			want:         0,
		},
		{
			name:         "Invalid string returns default",
			input:        "abc",
			defaultValue: 100,
			want:         100,
		},
		{
			name:         "Empty string returns default",
			input:        "",
			defaultValue: 50,
			want:         50,
		},
		{
			name:         "String with spaces returns default",
			input:        " 123 ",
			defaultValue: 75,
			want:         75,
		},
		{
			name:         "Mixed characters returns default",
			input:        "123abc",
			defaultValue: 200,
			want:         200,
		},
		{
			name:         "Default value is zero",
			input:        "invalid",
			defaultValue: 0,
			want:         0,
		},
		{
			name:         "Default value is negative",
			input:        "invalid",
			defaultValue: -1,
			want:         -1,
		},
		{
			name:         "Large valid number",
			input:        "2147483647",
			defaultValue: 999,
			want:         2147483647,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := StringToIntWithDefault(tt.input, tt.defaultValue)
			if got != tt.want {
				t.Errorf("StringToIntWithDefault() = %v, want %v", got, tt.want)
			}
		})
	}
}
