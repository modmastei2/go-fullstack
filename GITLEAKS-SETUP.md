# 🔐 Gitleaks Setup Guide

คู่มือการติดตั้งและใช้งาน Gitleaks สำหรับนักพัฒนา

---

## การติดตั้ง Gitleaks

### Windows (Chocolatey)

```powershell
choco install gitleaks -y
```

### Windows (Scoop)

```powershell
scoop install gitleaks
```

### macOS (Homebrew)

```bash
brew install gitleaks
```

### Linux

```bash
# Download latest release
wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.0/gitleaks_8.18.0_linux_x64.tar.gz
tar -xzf gitleaks_8.18.0_linux_x64.tar.gz
sudo mv gitleaks /usr/local/bin/
```

### ตรวจสอบการติดตั้ง

```bash
gitleaks version
```

---

## การข้ามการตรวจสอบ

⚠️ **ไม่แนะนำให้ข้ามการตรวจสอบ** เว้นแต่คุณแน่ใจ 100% ว่าไม่มีข้อมูลสำคัญในโค้ด

```bash
git commit --no-verify -m "your commit message"
```

---

## วิธีแก้ไขเมื่อพบ Secrets

### 1. อ่านข้อความแจ้งเตือน
```
❌ Gitleaks found secrets!

Finding:     AWS_SECRET_KEY=abcd1234...
File:        backend/config/dev.env
Line:        15
```

### 2. แก้ไขโค้ด

**❌ ก่อนแก้:**
```javascript
const apiKey = "sk-1234567890abcdef";
const dbPassword = "MyPassword123!";
```

**✅ หลังแก้:**
```javascript
const apiKey = process.env.API_KEY;
const dbPassword = process.env.DB_PASSWORD;
```

### 3. ใช้ไฟล์ .env

สร้างไฟล์ `.env` (ห้าม commit):
```bash
API_KEY=sk-1234567890abcdef
DB_PASSWORD=MyPassword123!
```

เพิ่มใน `.gitignore`:
```bash
.env
.env.local
*.env
```

### 4. Commit อีกครั้ง
```bash
git add .
git commit -m "use environment variables for secrets"
```

---

## การตรวจสอบแบบ Manual

### สแกนไฟล์ที่ Staged

```bash
gitleaks git --staged --verbose --config=.gitleaks.toml
```

### สแกนทั้ง Repository

```bash
gitleaks detect --source . --verbose --config=.gitleaks.toml
```

### สแกน Commit History

```bash
gitleaks git --log-opts="--all" --verbose --config=.gitleaks.toml
```

### สแกนก่อน Push

```bash
gitleaks git --log-opts="origin/main..HEAD" --verbose
```

### สแกนไฟล์เฉพาะ

```bash
gitleaks detect --source ./path/to/file.js --verbose
```ทั้ง Repository
```bash
gitleaks detect --source . --verbose --config=.gitleaks.toml
```

### สแกนไฟล์ที่ Staged
```bash
gitleaks git --staged --verbose --config=.gitleaks.toml
```

---

## หมายเหตุ

- Pre-commit hook อยู่ที่ `.git/hooks/pre-commit`
- Configuration อยู่ที่ `.gitleaks.toml`
- ถ้าพบปัญหา ให้ตรวจสอบการติดตั้งและ configuration ก่อน