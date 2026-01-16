package shared

import (
	"strconv"
)

// StringToInt converts a string to an integer
// Returns the converted integer and an error if conversion fails
func StringToInt(s string) (int, error) {
	return strconv.Atoi(s)
}

// StringToIntWithDefault converts a string to an integer with a default fallback
// Returns the converted integer, or defaultValue if conversion fails
func StringToIntWithDefault(s string, defaultValue int) int {
	if i, err := strconv.Atoi(s); err == nil {
		return i
	}
	return defaultValue
}
