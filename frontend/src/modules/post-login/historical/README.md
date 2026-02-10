# Historical Component - API Schema Integration

## การใช้งาน API Schema แบบใหม่

Component Historical ได้รับการปรับปรุงให้รองรับ API schema ที่มีโครงสร้างดังนี้:

### API Response Structure

```typescript
interface ApiSchema {
    table_section: TableSectionColumn[];  // คำนิยามคอลัมน์
    cols_data: Record<string, any>[];     // ข้อมูลแถว
}
```

### คำนิยามคอลัมน์ (table_section)

```typescript
interface TableSectionColumn {
    col_index: number;              // ลำดับคอลัมน์
    col_type: string;               // ประเภท: 'text', 'number', 'date', 'link', 'select'
    col_header_text: string;        // ข้อความหัวคอลัมน์
    col_value_field: string;        // ชื่อ field ในข้อมูล
    col_link_field: string | null;  // ชื่อ field ที่เก็บ URL (สำหรับ type='link')
    col_freeze: boolean;            // ปักหมุดคอลัมน์
    col_show: boolean;              // แสดง/ซ่อนคอลัมน์
    col_format: string | null;      // รูปแบบการแสดงผล (เช่น 'DD/MM/YYYY')
    attrs: {
        header: {
            class: string;
            style: string | null;
        };
        cell: {
            class: string;
            style: string | null;
        };
    };
}
```

## ตัวอย่างการใช้งาน

### 1. ข้อมูลจาก API

```json
{
  "table_section": [
    {
      "col_index": 1,
      "col_type": "text",
      "col_header_text": "Customer Code",
      "col_value_field": "customer_code",
      "col_link_field": null,
      "col_freeze": true,
      "col_show": true,
      "col_format": null,
      "attrs": {
        "header": {
          "class": "col-header-text",
          "style": "text-align:left;font-weight:600"
        },
        "cell": {
          "class": "col-cell-text",
          "style": "text-overflow:ellipsis;white-space:nowrap;overflow:hidden"
        }
      }
    },
    {
      "col_index": 2,
      "col_type": "TEXT",
      "col_header_text": "Customer Name",
      "col_value_field": "customer_name",
      "col_link_field": null,
      "col_freeze": true,
      "col_show": true,
      "col_format": null,
      "attrs": {
        "header": {
          "class": "col-header-number",
          "style": "text-align:right;font-weight:600"
        },
        "cell": {
          "class": "col-cell-number",
          "style": "text-align:right;white-space:nowrap"
        }
      }
    },
    {
      "col_index": 3,
      "col_type": "text",
      "col_header_text": "Transaction Date",
      "col_value_field": "transaction_date",
      "col_link_field": null,
      "col_freeze": false,
      "col_show": false,
      "col_format": null,
      "attrs": {
        "header": {
          "class": "col-header-text",
          "style": "text-align:left;font-weight:600"
        },
        "cell": {
          "class": "col-cell-text",
          "style": "text-align:left;white-space:nowrap"
        }
      }
    },
    {
      "col_index": 4,
      "col_type": "link",
      "col_header_text": "Action",
      "col_value_field": "profile",
      "col_link_field": "profile_link",
      "col_freeze": false,
      "col_show": true,
      "col_format": null,
      "attrs": {
        "header": {
          "class": "col-header-text",
          "style": null
        },
        "cell": {
          "class": "col-cell-text",
          "style": null
        }
      }
    }
  ],
  "cols_data": [
    {
      "customer_code": "641789",
      "customer_name": "นาย client 01",
      "transaction_date": "10/4/2026",
      "tel": "0810000000",
      "profile": "Profile",
      "profile_link": "http://localhost/profile_system/641789"
    },
    {
      "customer_code": "520964",
      "customer_name": "นาย client 02",
      "transaction_date": "10/4/2026",
      "tel": "0820000000",
      "profile": "Profile",
      "profile_link": "http://localhost/profile_system/520964"
    }
  ]
}
```

### 2. การแปลง Schema

ฟังก์ชัน `convertApiSchemaToGridConfig()` จะแปลง API schema เป็น DataGrid config โดยอัตโนมัติ:

```typescript
const { config: gridConfig, rows: apiRows } = convertApiSchemaToGridConfig(mockApiResponse);
```

### 3. คุณสมบัติที่รองรับ

#### Column Types
- **text**: ข้อความธรรมดา
- **number**: ตัวเลข (จัด align ขวาอัตโนมัติ)
- **date**: วันที่
- **link**: ลิงก์ที่คลิกได้ (ใช้ `col_link_field` เพื่อระบุ URL)
- **select**: Dropdown

#### Column Properties
- **col_freeze**: ปักหมุดคอลัมน์ทางซ้าย (sticky column)
- **col_show**: แสดง/ซ่อนคอลัมน์
- **col_format**: รูปแบบการแสดงผล
- **attrs.cell.style**: แยก text-align จาก style string

#### Link Column
สำหรับคอลัมน์ที่เป็น link จะต้องมี:
- `col_type: "link"`
- `col_value_field`: field ที่เก็บข้อความที่แสดง
- `col_link_field`: field ที่เก็บ URL ของลิงก์

ตัวอย่าง:
```json
{
  "col_type": "link",
  "col_value_field": "profile",
  "col_link_field": "profile_link"
}
```

ข้อมูลในแถว:
```json
{
  "profile": "Profile",
  "profile_link": "http://localhost/profile_system/641789"
}
```

ผลลัพธ์: จะแสดงเป็น `<a href="http://localhost/profile_system/641789">Profile</a>`

## การเรียกใช้ API จริง

เมื่อต้องการใช้งานกับ API จริง ให้แก้ไขใน Historical.tsx:

```typescript
import { useEffect, useState } from 'react';

export default function Historical() {
    const [gridConfig, setGridConfig] = useState<DataGridConfig | null>(null);
    const [gridData, setGridData] = useState<RowData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // เรียก API
        fetch('/api/search-transaction-history')
            .then(res => res.json())
            .then(response => {
                // แปลง schema
                const { config, rows } = convertApiSchemaToGridConfig(
                    response.result.data.search_trans_his_template
                );
                setGridConfig(config);
                setGridData(rows);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                setLoading(false);
            });
    }, []);

    if (loading || !gridConfig) {
        return <div>Loading...</div>;
    }

    // ... rest of component
}
```

## การปรับแต่งเพิ่มเติม

### เพิ่ม Custom Formatter

สามารถเพิ่มการจัดรูปแบบแสดงผลเพิ่มเติมใน `convertApiSchemaToGridConfig()`:

```typescript
// ตัวอย่าง: format ตัวเลขด้วย comma
if (col.col_format === 'number_with_comma') {
    columnDef.format = 'number_with_comma';
}
```

### กำหนด Width ของคอลัมน์

ปัจจุบันใช้ width เริ่มต้น 150px สามารถเพิ่มการคำนวณ width จาก API:

```typescript
// ถ้า API ส่ง col_width มา
width: col.col_width || 150,
```

## สรุป

ระบบนี้ช่วยให้:
1. ✅ Backend สามารถควบคุม column configuration ได้เต็มรูปแบบ
2. ✅ Frontend ไม่ต้อง hard-code column definition
3. ✅ รองรับ dynamic columns ตาม business logic
4. ✅ รองรับ link type พร้อม URL แยกต่างหาก
5. ✅ รองรับ frozen columns และ alignment
