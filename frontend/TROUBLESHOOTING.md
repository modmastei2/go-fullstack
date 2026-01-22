## ปัญหาที่พบบ่อย

### 1. ตั้งค่า Dark mode ด้วยตัวเองแต่ dark:* ❌ ไม่ทำงาน

#### เช็ค 1: ตรวจสอบว่ามีไฟล์ tailwind.config.ts ไหม ?

ค่า default ของ Tailwind คือ 
```ts
    darkMode: 'media'
```
นั่นหมายถึงว่า
- Tailwind จะใช้ ```@media (prefers-color-schema: dark) ```
- ไม่สน class dark ที่เรากำหนด
- จะอ่าน dark / light ตาม OS / Browser เท่านั้น

📌 อาจจะรู้สึกว่า "มันใช้ได้" แต่ที่จริงมันเลือกอ่านตามระบบ

#### เช็ค 2: มีไฟล์ tailwind.config.ts แต่ไม่ถูกโหลดมาใช้ ?

ใน Tailwind CSS v4 มีการเปลี่ยนการอ่าน config
ถ้าใช้ 
```@import "tailwindcss"```
Tailwind จะไม่โหลด tailwind.config.ts อัตโนมัติ ต้องบอกมันผ่าน css ด้วย ```@config```

``` css
@import "tailwindcss"; 
@config "../tailwind.config.ts";
```