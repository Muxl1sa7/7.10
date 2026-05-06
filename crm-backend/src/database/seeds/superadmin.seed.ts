/**
 * SuperAdmin Seed
 * Ishlatish: npm run seed
 * TypeORM 0.3+ — DataSource ishlatiladi
 */

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

async function seedSuperAdmin() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'crm_db',
    entities: [join(__dirname, '../../**/*.entity{.ts,.js}')],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('✅ Database ga ulandi');

  const userRepo = dataSource.getRepository('users');

  const phone = process.env.SUPERADMIN_PHONE || '+998901234567';
  const existing = await userRepo.findOne({ where: { phone } });

  if (existing) {
    console.log('⚠️  SuperAdmin allaqachon mavjud:', phone);
    await dataSource.destroy();
    return;
  }

  const passwordHash = await bcrypt.hash(
    process.env.SUPERADMIN_PASSWORD || 'superadmin123',
    10,
  );

  await userRepo.save({
    fullName: process.env.SUPERADMIN_NAME || 'Super Admin',
    phone,
    passwordHash,
    role: 'SUPERADMIN',
    isActive: true,
  });

  console.log('\n✅ SuperAdmin muvaffaqiyatli yaratildi!');
  console.log('   📞 Telefon :', phone);
  console.log('   🔑 Parol   :', process.env.SUPERADMIN_PASSWORD || 'superadmin123');
  console.log('\n⚠️  Parolni .env faylida o\'zgartiring!\n');

  await dataSource.destroy();
}

seedSuperAdmin().catch((err) => {
  console.error('❌ Seed xatosi:', err.message);
  process.exit(1);
});
