# 🚀 ELK + Fluent bit

### Serve
```sh
docker compose up -d
```

### Data Sources
- **Elasticsearch**: http://localhost:9200
- **Kibana**: http://localhost:5601
- **Fluent Bit**: รับ logs จาก Docker containers

### การดู Logs ใน Kibana
1. เปิด Kibana: http://localhost:5601
2. ไปที่ **Menu** → **Discover** เพื่อดู logs

> **Note**: Data view `docker-logs*` จะถูกสร้างอัตโนมัติตอน start up แล้ว ✨

### ⚠️ แก้ปัญหาไม่เห็น Logs (หลังเปลี่ยน config)
หากเปลี่ยน config ของ Fluent Bit แล้วไม่เห็น logs หรือเจอ error ให้ทำตามนี้:

**1. ตรวจสอบว่า Elasticsearch ทำงานหรือยัง**
```sh
curl http://localhost:9200
```

**2. ลบ index เก่าใน Elasticsearch (แก้ mapping conflict)**
```sh
# ลบ index ทั้งหมดที่ขึ้นต้นด้วย docker-logs
curl -X DELETE "http://localhost:9200/docker-logs-*?allow_no_indices=true"

# หรือดู index ที่มีก่อน
curl "http://localhost:9200/_cat/indices?v"

# แล้วลบทีละอันตามวันที่ เช่น
curl -X DELETE "http://localhost:9200/docker-logs-2026.01.19"
```

**3. Restart ELK Stack ทั้งหมด**
```sh
docker compose down
docker compose up -d
```

**4. ตรวจสอบ logs**
```sh
# ดู logs ของ Elasticsearch
docker compose logs elasticsearch

# ดู logs ของ Fluent Bit
docker compose logs fluent-bit
```

หรือ manual หากไม่ได้สร้าง kibana-init
1. เปิด Kibana: http://localhost:5601
2. ไปที่ **Menu** → **Stack Management** → **Data Views**
3. คลิก **Create data view**
4. ใส่ชื่อ: `docker-logs*`
5. เลือก **Timestamp field**: `@timestamp`
6. คลิก **Save data view to Kibana**
7. ไปที่ **Menu** → **Discover** เพื่อดู logs