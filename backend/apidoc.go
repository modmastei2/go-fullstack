//go:build apidoc
// +build apidoc

package main

// Hash
// @Summary Hash Password route
// @Param password body string true "Password to hash"
// @Success 200 {string} string "hashed password"
// @Router /hash [post]
func HashDoc()
