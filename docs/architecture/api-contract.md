# StockFlow API Contract Specification

Dokumen ini mendefinisikan spesifikasi teknis dan kontrak API resmi untuk sistem StockFlow.

---

## 1. Konvensi & Standar Respons

### 1.1 Protokol & Format Data
* **Base URL**: `/api`
* **Format**: `application/json`
* **Mata Uang**: Integer minor units (cents / satuan terkecil rupiah). Tidak menggunakan tipe floating point.
* **Format Waktu**: ISO 8601 UTC String (`YYYY-MM-DDTHH:mm:ss.sssZ`).
* **Autentikasi**: Header `Authorization: Bearer <jwt_token>` atau `httpOnly` cookie.

### 1.2 Format Respons Standar

#### Respons Sukses:
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10
  }
}
```

#### Respons Error:
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Deskripsi kesalahan",
    "details": [
      {
        "field": "sku",
        "message": "SKU sudah terdaftar"
      }
    ]
  }
}
```

### 1.3 Kode Status & Error Mapping
| HTTP Status | Error Code | Keterangan |
| :--- | :--- | :--- |
| `200 OK` | - | Permintaan berhasil diproses. |
| `201 Created` | - | Data baru berhasil dibuat. |
| `400 Bad Request` | `BAD_REQUEST` | Payload atau parameter tidak valid / transisi status terlarang. |
| `401 Unauthorized` | `UNAUTHORIZED` | Kredensial salah, token tidak valid, atau header hilang. |
| `403 Forbidden` | `FORBIDDEN` | Akses ke sumber daya pengguna lain ditolak. |
| `404 Not Found` | `NOT_FOUND` | Data yang dicari tidak ditemukan. |
| `409 Conflict` | `CONFLICT` | Duplikasi data unik (email/SKU) atau ketergantungan relasi. |
| `422 Unprocessable Entity` | `UNPROCESSABLE_ENTITY` | Validasi bisnis gagal (misal: stok tidak mencukupi). |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Kesalahan internal pada server. |

---

## 2. Modul Autentikasi (`/api/auth`)

### 2.1 Register
Mendaftarkan akun pengguna baru.

* **Method / Path**: `POST /api/auth/register`
* **Akses**: Publik
* **Request Body**:
  ```json
  {
    "email": "staff@stockflow.dev",
    "password": "Password123!",
    "name": "Staff Distribution"
  }
  ```
* **Validation Rules**:
  * `email`: Format email valid, unik.
  * `password`: Minimal 8 karakter, di-hash dengan Argon2/Bcrypt.
  * `name`: Opsional, string.
* **Response `201 Created`**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "usr_01",
        "email": "staff@stockflow.dev",
        "name": "Staff Distribution",
        "createdAt": "2026-09-02T10:00:00.000Z"
      },
      "token": "eyJhbGciOi..."
    }
  }
  ```

### 2.2 Login
Melakukan autentikasi kredensial pengguna.

* **Method / Path**: `POST /api/auth/login`
* **Akses**: Publik
* **Request Body**:
  ```json
  {
    "email": "staff@stockflow.dev",
    "password": "Password123!"
  }
  ```
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "usr_01",
        "email": "staff@stockflow.dev",
        "name": "Staff Distribution"
      },
      "token": "eyJhbGciOi..."
    }
  }
  ```
* **Error `401 UNAUTHORIZED`**: Pesan generik tanpa membedakan kesalahan email atau password.

### 2.3 Logout
Mengakhiri sesi pengguna aktif.

* **Method / Path**: `POST /api/auth/logout`
* **Akses**: Terproteksi
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Sesi berhasil diakhiri."
    }
  }
  ```

### 2.4 Get Profile
Mengambil profil pengguna yang sedang login.

* **Method / Path**: `GET /api/auth/me`
* **Akses**: Terproteksi
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "id": "usr_01",
      "email": "staff@stockflow.dev",
      "name": "Staff Distribution",
      "createdAt": "2026-09-02T10:00:00.000Z"
    }
  }
  ```

---

## 3. Modul Produk & Inventaris (`/api/products`)

### 3.1 List Products
Mengambil daftar produk dengan fitur paginasi dan pencarian.

* **Method / Path**: `GET /api/products`
* **Akses**: Terproteksi
* **Query Parameters**:
  * `page` (integer, default: 1)
  * `limit` (integer, default: 10)
  * `search` (string, opsional - pencarian pada `name` atau `sku`)
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "prd_01",
        "sku": "KB-MCH-01",
        "name": "Mechanical Keyboard TKL",
        "description": "Wireless RGB Mechanical Keyboard",
        "unitPrice": 850000,
        "quantityOnHand": 25,
        "createdAt": "2026-09-02T10:00:00.000Z",
        "updatedAt": "2026-09-02T10:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalItems": 1,
      "totalPages": 1
    }
  }
  ```

### 3.2 Get Product by ID
Mengambil detail satu produk.

* **Method / Path**: `GET /api/products/{id}`
* **Akses**: Terproteksi
* **Response `200 OK`**: Detail objek produk.
* **Error `404 NOT_FOUND`**: Produk tidak ditemukan.

### 3.3 Create Product
Menambahkan produk baru ke katalog.

* **Method / Path**: `POST /api/products`
* **Akses**: Terproteksi
* **Request Body**:
  ```json
  {
    "sku": "KB-MCH-01",
    "name": "Mechanical Keyboard TKL",
    "description": "Wireless RGB Mechanical Keyboard",
    "unitPrice": 850000,
    "quantityOnHand": 25
  }
  ```
* **Validation Rules**:
  * `sku`: Wajib, unik per pengguna, non-empty string.
  * `name`: Wajib, non-empty string.
  * `unitPrice`: Wajib, integer `>= 0`.
  * `quantityOnHand`: Wajib, integer `>= 0`.
* **Response `201 Created`**: Objek produk yang baru dibuat.
* **Error `409 CONFLICT`**: SKU sudah digunakan.

### 3.4 Update Product
Memperbarui informasi produk.

* **Method / Path**: `PATCH /api/products/{id}`
* **Akses**: Terproteksi
* **Request Body**: Field yang ingin diubah (`name`, `description`, `unitPrice`, `quantityOnHand`).
* **Response `200 OK`**: Objek produk yang telah diperbarui.

### 3.5 Delete Product
Menghapus produk dari inventaris.

* **Method / Path**: `DELETE /api/products/{id}`
* **Akses**: Terproteksi
* **Response `200 OK`**: `{"success": true, "data": {"message": "Produk berhasil dihapus."}}`
* **Error `409 CONFLICT`**: Penghapusan ditolak jika produk pernah digunakan dalam transaksi faktur/invoice.

---

## 4. Modul Invoice (`/api/invoices`)

### 4.1 State Machine Transisi Status
Transisi status faktur divalidasi ketat di sisi server:

```
           [ Create ]
               |
               v
            +------+
            | DRAFT|
            +------+
           /        \
  [ Issue ]          [ Cancel ]
     /                  \
    v                    v
+--------+          +-----------+
| ISSUED | -------> | CANCELLED |
+--------+ [Cancel] +-----------+
    |
 [ Pay ]
    |
    v
+--------+
|  PAID  |
+--------+
```

* `DRAFT`: Faktur dapat diedit itemnya. Belum mengurangi stok.
* `ISSUED`: Faktur diterbitkan resmi. Stok berkurang secara atomik.
* `PAID`: Faktur telah lunas (status terminal).
* `CANCELLED`: Faktur dibatalkan (status terminal). Mengembalikan stok jika dibatalkan dari status `ISSUED`.

### 4.2 List Invoices
Mengambil daftar invoice dengan paginasi dan filter status.

* **Method / Path**: `GET /api/invoices`
* **Akses**: Terproteksi
* **Query Parameters**:
  * `page` (integer, default: 1)
  * `limit` (integer, default: 10)
  * `status` (string, opsional: `DRAFT` | `ISSUED` | `PAID` | `CANCELLED`)
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "inv_01",
        "invoiceNumber": "INV-2026-0001",
        "customerName": "PT Teknologi Maju",
        "issueDate": "2026-09-02T10:00:00.000Z",
        "dueDate": "2026-09-16T10:00:00.000Z",
        "status": "DRAFT",
        "subtotal": 1700000,
        "taxRate": 11,
        "taxAmount": 187000,
        "total": 1887000,
        "itemCount": 1,
        "createdAt": "2026-09-02T10:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalItems": 1,
      "totalPages": 1
    }
  }
  ```

### 4.3 Get Invoice by ID
Mengambil detail faktur beserta snapshot item produk dan rincian finansial.

* **Method / Path**: `GET /api/invoices/{id}`
* **Akses**: Terproteksi
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "id": "inv_01",
      "invoiceNumber": "INV-2026-0001",
      "customerName": "PT Teknologi Maju",
      "issueDate": "2026-09-02T10:00:00.000Z",
      "dueDate": "2026-09-16T10:00:00.000Z",
      "status": "DRAFT",
      "notes": "Catatan pengiriman",
      "subtotal": 1700000,
      "taxRate": 11,
      "taxAmount": 187000,
      "total": 1887000,
      "items": [
        {
          "id": "itm_01",
          "productId": "prd_01",
          "productName": "Mechanical Keyboard TKL",
          "unitPrice": 850000,
          "quantity": 2,
          "lineTotal": 1700000
        }
      ],
      "createdAt": "2026-09-02T10:00:00.000Z",
      "updatedAt": "2026-09-02T10:00:00.000Z"
    }
  }
  ```

### 4.4 Create Invoice
Membuat invoice baru berstatus `DRAFT`. Total dihitung di server dan data produk di-snapshot.

* **Method / Path**: `POST /api/invoices`
* **Akses**: Terproteksi
* **Request Body**:
  ```json
  {
    "customerName": "PT Teknologi Maju",
    "issueDate": "2026-09-02T10:00:00.000Z",
    "dueDate": "2026-09-16T10:00:00.000Z",
    "notes": "Catatan pengiriman",
    "items": [
      {
        "productId": "prd_01",
        "quantity": 2
      }
    ]
  }
  ```
* **Validation Rules**:
  * `customerName`: Wajib, non-empty string.
  * `dueDate`: Wajib, ISO 8601 date.
  * `items`: Minimal 1 item, `quantity > 0`.
  * **Stock Guard**: Kuantitas tidak boleh melebihi `quantityOnHand` saat pembuatan.
* **Response `201 Created`**: Objek invoice yang berhasil dibuat.
* **Error `422 UNPROCESSABLE_ENTITY`**: Stok tidak mencukupi.

### 4.5 Update Draft Invoice
Memperbarui item atau informasi pada invoice berstatus `DRAFT`.

* **Method / Path**: `PATCH /api/invoices/{id}`
* **Akses**: Terproteksi
* **Request Body**: Field yang ingin diperbarui (`customerName`, `dueDate`, `notes`, `items`).
* **Response `200 OK`**: Objek invoice yang diperbarui.
* **Error `400 BAD_REQUEST`**: Ditolak jika status invoice bukan `DRAFT`.

### 4.6 Issue Invoice
Menerbitkan invoice resmi dan mengurangi stok produk secara atomik (ACID Transaction).

* **Method / Path**: `POST /api/invoices/{id}/issue`
* **Akses**: Terproteksi
* **Response `200 OK`**: Objek invoice dengan status `ISSUED`.
* **Error `400 BAD_REQUEST`**: Transisi dari status saat ini tidak diizinkan.
* **Error `422 UNPROCESSABLE_ENTITY`**: Stok fisik tidak mencukupi saat proses penerbitan.

### 4.7 Mark as Paid
Menandai invoice telah lunas.

* **Method / Path**: `POST /api/invoices/{id}/pay`
* **Akses**: Terproteksi
* **Response `200 OK`**: Objek invoice dengan status `PAID`.
* **Error `400 BAD_REQUEST`**: Hanya invoice berstatus `ISSUED` yang dapat ditandai `PAID`.

### 4.8 Cancel Invoice
Membatalkan invoice. Merestorasi stok produk jika status sebelumnya adalah `ISSUED`.

* **Method / Path**: `POST /api/invoices/{id}/cancel`
* **Akses**: Terproteksi
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "id": "inv_01",
      "status": "CANCELLED",
      "restoredStock": true,
      "updatedAt": "2026-09-02T10:30:00.000Z"
    }
  }
  ```
* **Error `400 BAD_REQUEST`**: Invoice dengan status `PAID` atau `CANCELLED` tidak dapat dibatalkan kembali.

---

## 5. Aturan Kalkulasi Finansial

1. **Line Total**: `lineTotal = unitPrice * quantity`
2. **Subtotal**: `subtotal = sum(lineTotal)`
3. **Tax Amount** (Konfigurasi default `TAX_RATE_PERCENT=11`):
   $$\text{taxAmount} = \lfloor(\text{subtotal} \times \text{TAX\_RATE\_PERCENT}) / 100\rfloor$$
4. **Total**: `total = subtotal + taxAmount`
5. **Snapshot Immutability**: Perubahan harga atau nama pada katalog produk tidak akan mengubah data riwayat yang tersimpan pada `InvoiceItem`.
