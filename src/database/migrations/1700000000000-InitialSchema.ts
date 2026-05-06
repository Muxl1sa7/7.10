import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── UUID EXTENSION (SAFE) ───────────────────────────────
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);

    // ─── ENUM: ROLE (SAFE) ───────────────────────────────────
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_enum') THEN
          CREATE TYPE "public"."users_role_enum"
          AS ENUM('SUPERADMIN', 'ADMIN', 'TEACHER');
        END IF;
      END$$;
    `);

    // ─── ENUM: PROVIDER (SAFE) ───────────────────────────────
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_provider_enum') THEN
          CREATE TYPE "public"."users_provider_enum"
          AS ENUM('local', 'google', 'github');
        END IF;
      END$$;
    `);

    // ─── USERS ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "fullName" character varying NOT NULL,
        "phone" character varying UNIQUE,
        "passwordHash" character varying,
        "email" character varying UNIQUE,
        "googleId" character varying UNIQUE,
        "githubId" character varying UNIQUE,
        "provider" "public"."users_provider_enum" NOT NULL DEFAULT 'local',
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'ADMIN',
        "photo" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ─── STUDENTS ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "students" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "fullName" character varying NOT NULL,
        "phone" character varying NOT NULL,
        "direction" character varying NOT NULL,
        "parentName" character varying,
        "parentPhone" character varying,
        "photo" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ─── GROUPS ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "groups" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "direction" character varying NOT NULL,
        "lessonDays" character varying NOT NULL,
        "lessonTime" character varying NOT NULL,
        "teacherId" uuid,
        "teacherPhoto" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ─── GROUP_STUDENTS ──────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "group_students" (
        "groupId" uuid NOT NULL,
        "studentId" uuid NOT NULL,
        PRIMARY KEY ("groupId", "studentId")
      )
    `);

    // ─── PAYMENTS ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "studentId" uuid NOT NULL,
        "groupId" uuid NOT NULL,
        "teacherId" uuid,
        "amount" numeric(12,2) NOT NULL DEFAULT 0,
        "paymentDate" date NOT NULL,
        "note" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ─── ATTENDANCES ─────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "attendances" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "studentId" uuid NOT NULL,
        "groupId" uuid NOT NULL,
        "date" date NOT NULL,
        "present" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE ("studentId", "groupId", "date")
      )
    `);

    // ─── COMPLAINTS ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "complaints" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "studentName" character varying NOT NULL,
        "phone" character varying NOT NULL,
        "description" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ─── FOREIGN KEYS ────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "groups"
      ADD CONSTRAINT "FK_groups_teacher"
      FOREIGN KEY ("teacherId") REFERENCES "users"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "group_students"
      ADD CONSTRAINT "FK_gs_group"
      FOREIGN KEY ("groupId") REFERENCES "groups"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "group_students"
      ADD CONSTRAINT "FK_gs_student"
      FOREIGN KEY ("studentId") REFERENCES "students"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "FK_payments_student"
      FOREIGN KEY ("studentId") REFERENCES "students"("id")
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "FK_payments_group"
      FOREIGN KEY ("groupId") REFERENCES "groups"("id")
    `);

    await queryRunner.query(`
      ALTER TABLE "attendances"
      ADD CONSTRAINT "FK_att_student"
      FOREIGN KEY ("studentId") REFERENCES "students"("id")
    `);

    await queryRunner.query(`
      ALTER TABLE "attendances"
      ADD CONSTRAINT "FK_att_group"
      FOREIGN KEY ("groupId") REFERENCES "groups"("id")
    `);

    // ─── INDEXES ─────────────────────────────────────────────
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_students_direction" ON "students" ("direction")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payments_date" ON "payments" ("paymentDate")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_attendance_date" ON "attendances" ("date")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_attendance_group" ON "attendances" ("groupId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // FK
    await queryRunner.query(`ALTER TABLE "attendances" DROP CONSTRAINT IF EXISTS "FK_att_group"`);
    await queryRunner.query(`ALTER TABLE "attendances" DROP CONSTRAINT IF EXISTS "FK_att_student"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "FK_payments_group"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "FK_payments_student"`);
    await queryRunner.query(`ALTER TABLE "group_students" DROP CONSTRAINT IF EXISTS "FK_gs_student"`);
    await queryRunner.query(`ALTER TABLE "group_students" DROP CONSTRAINT IF EXISTS "FK_gs_group"`);
    await queryRunner.query(`ALTER TABLE "groups" DROP CONSTRAINT IF EXISTS "FK_groups_teacher"`);

    // tables
    await queryRunner.query(`DROP TABLE IF EXISTS "complaints"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attendances"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "group_students"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "groups"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "students"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    // enums (safe)
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_provider_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum"`);
  }
}