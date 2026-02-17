package extensions

import (
	"math/rand"
	"time"
)

// ใข้ retry แบบ linear backoff + jitter แบบไม่ recursive เพื่อหลีกเลี่ยง stack overflow และควบคุมการเพิ่มขึ้นของเวลาระหว่าง retry ได้ดีขึ้น
func Retry(attempts int, sleep time.Duration, fn func() error) error {
	var err error

	for i := 1; i <= attempts; i++ {
		err = fn()

		if err == nil {
			return nil
		}

		if i == attempts {
			break
		}

		jitter := time.Duration(rand.Int63n(int64(sleep / 2)))
		time.Sleep(sleep + jitter)

		sleep *= 2
	}

	return err
}
