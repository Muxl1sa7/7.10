# O'quv Markazi CRM — Backend API

NestJS + PostgreSQL + TypeORM asosida qurilgan o'quv markazi boshqaruv tizimi.

## Texnologiyalar

- **Framework**: NestJS 10
- **Database**: PostgreSQL
- **ORM**: TypeORM (QueryBuilder bilan)
- **Auth**: JWT + Passport + bcrypt
- **Docs**: Swagger (OpenAPI 3.0)
- **Validation**: class-validator + class-transformer

## Boshlash

### 1. O'rnatish

```bash
cd crm-backend
npm install
```

### 2. .env fayl

```bash
cp .env.example .env
# .env faylni o'zingizning ma'lumotlaringiz bilan to'ldiring
```

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
DB_DATABASE=crm_db

JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

PORT=3000

SUPERADMIN_PHONE=+998901234567
SUPERADMIN_PASSWORD=superadmin123
SUPERADMIN_NAME=Super Admin
```

### 3. PostgreSQL database yaratish

```sql
CREATE DATABASE crm_db;
```

### 4. SuperAdmin yaratish (birinchi marta)

```bash
npm run seed
```

### 5. Serverni ishga tushirish

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Hujjatlari

Server ishga tushgandan keyin:

```
http://localhost:3000/api/docs
```

## Rollar tizimi

| Rol | Vakolat |
|-----|---------|
| **SUPERADMIN** | Admin va Teacher yaratish, barcha operatsiyalar |
| **ADMIN** | O'quvchi, guruh, to'lov, davomat, murojat boshqaruvi |
| **TEACHER** | O'z guruhining davomati va ro'yxatini ko'rish |

## Tizimga kirish

```http
POST /api/auth/login
Content-Type: application/json

{
  "phone": "+998901234567",
  "password": "superadmin123"
}
```

Javob:
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "fullName": "Super Admin",
    "phone": "+998901234567",
    "role": "SUPERADMIN"
  }
}
```

## Endpointlar

### Auth
| Method | URL | Ruxsat | Tavsif |
|--------|-----|--------|--------|
| POST | `/api/auth/login` | Hamma | Tizimga kirish |
| POST | `/api/auth/users` | SUPERADMIN | Admin/Teacher yaratish |
| GET | `/api/auth/users` | SUPERADMIN | Barcha foydalanuvchilar |
| DELETE | `/api/auth/users/:id` | SUPERADMIN | Deaktiv qilish |
| GET | `/api/auth/profile` | Barchasi | Mening profilim |

### O'quvchilar
| Method | URL | Tavsif |
|--------|-----|--------|
| POST | `/api/students` | Yangi o'quvchi qo'shish |
| GET | `/api/students` | Ro'yxat (filter + pagination) |
| GET | `/api/students/:id` | Bitta o'quvchi |
| PATCH | `/api/students/:id` | Tahrirlash |
| DELETE | `/api/students/:id` | O'chirish |

### Guruhlar
| Method | URL | Tavsif |
|--------|-----|--------|
| POST | `/api/groups` | Yangi guruh |
| GET | `/api/groups` | Ro'yxat (filter + pagination) |
| GET | `/api/groups/:id` | Bitta guruh (o'quvchilar bilan) |
| PATCH | `/api/groups/:id` | Tahrirlash |
| DELETE | `/api/groups/:id` | O'chirish |
| POST | `/api/groups/:id/students/:studentId` | Guruhga o'quvchi qo'shish |

### To'lovlar
| Method | URL | Tavsif |
|--------|-----|--------|
| POST | `/api/payments` | To'lov qilish |
| GET | `/api/payments` | Ro'yxat (filter + pagination) |
| DELETE | `/api/payments/:id` | O'chirish |

### Davomat
| Method | URL | Tavsif |
|--------|-----|--------|
| POST | `/api/attendance/bulk` | Guruh davomati saqlash |
| GET | `/api/attendance` | Ro'yxat (filter + pagination) |
| GET | `/api/attendance/absent` | Kelmagan o'quvchilar |

### Murojatlar
| Method | URL | Tavsif |
|--------|-----|--------|
| POST | `/api/complaints` | Yangi murojat |
| GET | `/api/complaints` | Kunlik guruhlangan ro'yxat |
| DELETE | `/api/complaints/:id` | O'chirish |

### Dashboard
| Method | URL | Tavsif |
|--------|-----|--------|
| GET | `/api/dashboard/stats` | Umumiy statistika |
| GET | `/api/dashboard/monthly` | Oylik statistika (grafik uchun) |

## QueryBuilder ishlatilgan joylar

Barcha `GET` endpointlar TypeORM `QueryBuilder` dan foydalanadi:

```typescript
// Misol: O'quvchilarni qidirish
const qb = this.studentRepo.createQueryBuilder('student')
  .where('student.isActive = :active', { active: true });

if (search) {
  qb.andWhere(
    '(student.fullName ILIKE :search OR student.phone ILIKE :search)',
    { search: `%${search}%` }
  );
}

if (direction) {
  qb.andWhere('student.direction = :direction', { direction });
}

const [data, total] = await qb
  .skip((page - 1) * limit)
  .take(limit)
  .orderBy('student.createdAt', 'DESC')
  .getManyAndCount();
```

## Loyiha tuzilmasi

```
src/
├── auth/
│   ├── dto/auth.dto.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   └── jwt.strategy.ts
├── users/
│   ├── user.entity.ts
│   └── users.module.ts
├── students/
│   ├── dto/
│   ├── student.entity.ts
│   ├── students.controller.ts
│   ├── students.service.ts
│   └── students.module.ts
├── groups/
├── payments/
├── attendance/
├── complaints/
├── dashboard/
├── common/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   └── decorators/
│       ├── roles.decorator.ts
│       ├── public.decorator.ts
│       └── current-user.decorator.ts
├── database/
│   └── seeds/
│       └── superadmin.seed.ts
├── app.module.ts
└── main.ts
```
