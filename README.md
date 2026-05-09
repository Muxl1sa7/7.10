# O'quv Markazi CRM — Backend API

NestJS + PostgreSQL + TypeORM asosida qurilgan o'quv markazi boshqaruv tizimi.

---

## Texnologiyalar

| Texnologiya | Versiya | Vazifa |
|-------------|---------|--------|
| NestJS | ^10.0.0 | Asosiy framework |
| PostgreSQL | 15+ | Malumotlar bazasi |
| TypeORM | ^0.3.17 | ORM (QueryBuilder) |
| Swagger | ^7.1.0 | API hujjatlari |
| JWT | ^10.1.0 | Autentifikatsiya |
| Passport | ^10.0.0 | OAuth strategiyalar |
| bcrypt | ^5.1.0 | Parol shifrlash |
| Winston | ^3.11.0 | Logging |
| Multer | ^1.4.5 | Fayl yuklash |
| Throttler | ^5.0.0 | Rate limiting |
| Docker | latest | Konteynerizatsiya |

---

## Boshlash

### 1. Paketlarni o'rnatish
```bash
npm install
```

### 2. .env fayl yaratish
```bash
cp .env.example .env
```

.env faylni to'ldiring:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
DB_DATABASE=crm_db

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m

JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

PORT=3000
NODE_ENV=development
CORS_ORIGIN=*

FRONTEND_URL=http://localhost:3000

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

SUPERADMIN_PHONE=+998901234567
SUPERADMIN_PASSWORD=superadmin123
SUPERADMIN_NAME=Super Admin
```

### 3. PostgreSQL database yaratish
```bash
psql -U postgres -c "CREATE DATABASE crm_db ENCODING 'UTF8' TEMPLATE template0;"
```

### 4. Migration ishga tushirish
```bash
npm run migration:run
```

### 5. SuperAdmin yaratish
```bash
npm run seed
```

### 6. Serverni ishga tushirish
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

### 7. Swagger hujjatlari
```
http://localhost:3000/api/docs
```

---

## Docker bilan ishga tushirish

```bash
docker-compose up -d
```

---

## Rollar tizimi

| Rol | Vakolat |
|-----|---------|
| SUPERADMIN | Admin/Teacher yaratish, barcha operatsiyalar |
| ADMIN | Oquvchi, guruh, tolov, davomat, murojat boshqaruvi |
| TEACHER | Faqat oz guruhi: davomat va royxat |

---

## Auth tizimi

### Local login
```http
POST /api/auth/login
{
  "phone": "+998901234567",
  "password": "superadmin123"
}
```

Javob:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "fullName": "Super Admin",
    "phone": "+998901234567",
    "role": "SUPERADMIN"
  }
}
```

### Token yangilash
```http
POST /api/auth/refresh
{
  "refreshToken": "eyJ..."
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer eyJ...
```

### Google OAuth
```
Brauzerda oching: GET http://localhost:3000/api/auth/google
```

### GitHub OAuth
```
Brauzerda oching: GET http://localhost:3000/api/auth/github
```

---

## Token tizimi

| Token | Muddat | Vazifa |
|-------|--------|--------|
| accessToken | 15 daqiqa | API sozrovlarda ishlatiladi |
| refreshToken | 7 kun | Yangi accessToken olish uchun |

---

## API Endpointlar

### Auth
| Method | URL | Ruxsat | Tavsif |
|--------|-----|--------|--------|
| POST | /api/auth/login | Hammaga ochiq | Tizimga kirish |
| POST | /api/auth/refresh | Hammaga ochiq | Token yangilash |
| POST | /api/auth/logout | Barcha rollar | Chiqish |
| GET | /api/auth/google | Hammaga ochiq | Google OAuth |
| GET | /api/auth/github | Hammaga ochiq | GitHub OAuth |
| POST | /api/auth/users | SUPERADMIN | Admin/Teacher yaratish |
| GET | /api/auth/users | SUPERADMIN | Barcha foydalanuvchilar |
| PATCH | /api/auth/users/:id/deactivate | SUPERADMIN | Bloklash |
| PATCH | /api/auth/users/:id/activate | SUPERADMIN | Aktivlashtirish |
| DELETE | /api/auth/users/:id | SUPERADMIN | Ochirish (soft delete) |
| GET | /api/auth/profile | Barcha rollar | Mening profilim |
| PATCH | /api/auth/profile | Barcha rollar | Profilni yangilash |

### Oquvchilar
| Method | URL | Tavsif |
|--------|-----|--------|
| POST | /api/students | Yangi oquvchi qoshish |
| GET | /api/students | Royxat (filter + pagination) |
| GET | /api/students/directions | Yonalishlar royxati |
| GET | /api/students/stats | Statistika |
| GET | /api/students/:id | Bitta oquvchi (tolov tarixi bilan) |
| PATCH | /api/students/:id | Tahrirlash |
| DELETE | /api/students/:id | Ochirish (soft delete) |
| DELETE | /api/students/:id/permanent | Toliq ochirish (SUPERADMIN) |

### Guruhlar
| Method | URL | Tavsif |
|--------|-----|--------|
| POST | /api/groups | Yangi guruh |
| GET | /api/groups | Royxat (filter + pagination) |
| GET | /api/groups/:id | Bitta guruh |
| GET | /api/groups/:id/students | Guruh oquvchilari + tolov holati |
| PATCH | /api/groups/:id | Tahrirlash |
| POST | /api/groups/:id/students | Guruhga oquvchi qoshish |
| DELETE | /api/groups/:id/students/:studentId | Guruhdan chiqarish |
| DELETE | /api/groups/:id | Ochirish (soft delete) |

### Tolovlar
| Method | URL | Tavsif |
|--------|-----|--------|
| POST | /api/payments | Tolov qilish |
| GET | /api/payments | Royxat (filter + pagination) |
| GET | /api/payments/monthly-summary | Oylik summa (grafik uchun) |
| GET | /api/payments/unpaid/:groupId | Tolov qilmaganlar |
| DELETE | /api/payments/:id | Ochirish |

### Davomat
| Method | URL | Tavsif |
|--------|-----|--------|
| POST | /api/attendance/bulk | Guruh davomati saqlash |
| GET | /api/attendance | Royxat (filter + pagination) |
| GET | /api/attendance/group/:groupId/date/:date | Bitta kun davomati |
| GET | /api/attendance/absent/:groupId/date/:date | Kelmaganlar |
| GET | /api/attendance/rate/:studentId/:groupId | Davomat foizi |
| GET | /api/attendance/monthly | Oylik statistika |

### Murojatlar
| Method | URL | Tavsif |
|--------|-----|--------|
| POST | /api/complaints | Yangi murojat (token shart emas) |
| GET | /api/complaints | Kunlik guruhlangan royxat |
| DELETE | /api/complaints/:id | Ochirish |

### Dashboard
| Method | URL | Tavsif |
|--------|-----|--------|
| GET | /api/dashboard/stats | Asosiy statistika |
| GET | /api/dashboard/monthly | Oylik grafik |
| GET | /api/dashboard/directions | Top yonalishlar |

---

## Migration buyruqlari

```bash
# Migrationlarni ishga tushirish
npm run migration:run

# Oxirgi migrationni bekor qilish
npm run migration:revert

# Qaysilar bajarilganini korish
npm run migration:show

# Yangi migration yaratish
npm run migration:generate --name=MigrationNomi
```

---

## Xavfsizlik

- JWT accessToken (15 daqiqa) + refreshToken (7 kun)
- bcrypt bilan parol shifrlash
- Rate limiting: 30 sorov/daqiqa, 500 sorov/soat
- Login uchun alohida limit: 10 urinish/5 daqiqa
- Rollar asosida ruxsat (SUPERADMIN, ADMIN, TEACHER)
- Global Exception Filter — yagona xato formati
- Soft Delete — malumotlar saqlanib qoladi
- CORS himoya

---

## Logging (Winston)

```
logs/
├── combined.log    # Barcha loglar
└── error.log       # Faqat xatolar
```

---

## Javob formati

Barcha endpointlar bir xil formatda javob qaytaradi:

```json
// Muvaffaqiyat:
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-05-09T04:55:48.591Z"
}

// Xato:
{
  "success": false,
  "statusCode": 400,
  "message": "Xato tavsifi",
  "error": "Bad Request",
  "path": "/api/...",
  "timestamp": "2026-05-09T04:55:48.591Z"
}
```

---

## Fayl yuklash

- Oquvchi rasmi: `uploads/students/`
- Guruh/Oqituvchi rasmi: `uploads/groups/`
- Profil rasmi: `uploads/`
- Maksimal hajm: 5MB
- Qabul qilinadigan formatlar: jpg, jpeg, png, webp
- Statik fayllar: `http://localhost:3000/uploads/filename.jpg`

---

## Qilgan ishlar

### 1-bosqich: Loyiha asosi
- NestJS loyiha skeleti yaratildi
- PostgreSQL + TypeORM ulandi
- Swagger (OpenAPI) sozlandi
- .env, ConfigModule, ValidationPipe global sozlandi
- Barcha entitylar yaratildi (User, Student, Group, Payment, Attendance, Complaint)

### 2-bosqich: Auth tizimi
- JWT + bcrypt login tizimi
- SuperAdmin seed skripti
- JwtAuthGuard + RolesGuard
- @Roles(), @Public(), @CurrentUser() decoratorlar
- SUPERADMIN, ADMIN, TEACHER rollari

### 3-bosqich: Oquvchilar moduli
- To'liq CRUD
- QueryBuilder bilan filter + qidiruv + pagination
- Rasm yuklash (Multer)
- Tolov tarixi bilan bitta oquvchi
- Soft delete

### 4-bosqich: Guruhlar moduli
- To'liq CRUD
- Guruhga oquvchi qoshish/chiqarish (ManyToMany)
- Tolov holati bilan oquvchilar royxati
- TEACHER faqat oz guruhini koradi

### 5-bosqich: Tolovlar moduli
- Tolov qilish
- Oylik statistika
- Tolov qilmaganlar royxati
- Sana boyicha filter

### 6-bosqich: Davomat moduli
- Bulk upsert (bir guruhning bir kuni)
- Kelmagan oquvchilar
- Davomat foizi
- Oylik statistika

### 7-bosqich: Murojatlar moduli
- Ochiq endpoint (token shart emas)
- Kunlik guruhlangan royxat

### 8-bosqich: Dashboard moduli
- Jami statistika kartochkalar
- Oylik grafik (oquvchilar + ketganlar + tolovlar)
- Top yonalishlar

### 9-bosqich: Xavfsizlik
- Rate limiting (Throttler)
- Global Exception Filter
- Response Interceptor
- Helmet headers

### 10-bosqich: Google va GitHub OAuth
- Google OAuth 2.0
- GitHub OAuth
- Token callback sahifasi
- Mavjud userga OAuth ulash

### 11-bosqich: Migration
- TypeORM DataSource konfiguratsiya
- InitialSchema migration (barcha jadvallar, indexlar, foreign keylar)
- Migration CLI buyruqlari

### 12-bosqich: Mukammallashtirish
- Refresh Token tizimi (accessToken 15 min + refreshToken 7 kun)
- Winston Logger (fayllarga yozish)
- Soft Delete (@DeleteDateColumn)
- Telefon raqam validatsiyasi (+998XXXXXXXXX)
- Logout endpointi
- Docker + docker-compose