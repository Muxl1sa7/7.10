import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Enum: user role
    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum"
      AS ENUM('SUPERADMIN', 'ADMIN', 'TEACHER')
    `);

    // Enum: auth provider
    await queryRunner.query(`
      CREATE TYPE "public"."users_provider_enum"
      AS ENUM('local', 'google', 'github')
    `);

    // users jadvali
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"           uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fullName"     character varying NOT NULL,
        "phone"        character varying UNIQUE,
        "passwordHash" character varying,
        "email"        character varying UNIQUE,
        "googleId"     character varying UNIQUE,
        "githubId"     character varying UNIQUE,
        "provider"     "public"."users_provider_enum" NOT NULL DEFAULT 'local',
        "role"         "public"."users_role_enum" NOT NULL DEFAULT 'ADMIN',
        "photo"        character varying,
        "isActive"     boolean NOT NULL DEFAULT true,
        "createdAt"    TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // students jadvali
    await queryRunner.query(`
      CREATE TABLE "students" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fullName"    character varying NOT NULL,
        "phone"       character varying NOT NULL,
        "direction"   character varying NOT NULL,
        "parentName"  character varying,
        "parentPhone" character varying,
        "photo"       character varying,
        "isActive"    boolean NOT NULL DEFAULT true,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_students" PRIMARY KEY ("id")
      )
    `);

    // groups jadvali
    await queryRunner.query(`
      CREATE TABLE "groups" (
        "id"           uuid NOT NULL DEFAULT uuid_generate_v4(),
        "direction"    character varying NOT NULL,
        "lessonDays"   character varying NOT NULL,
        "lessonTime"   character varying NOT NULL,
        "teacherId"    uuid,
        "teacherPhoto" character varying,
        "isActive"     boolean NOT NULL DEFAULT true,
        "createdAt"    TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_groups" PRIMARY KEY ("id")
      )
    `);

    // group_students (ManyToMany)
    await queryRunner.query(`
      CREATE TABLE "group_students" (
        "groupId"   uuid NOT NULL,
        "studentId" uuid NOT NULL,
        CONSTRAINT "PK_group_students" PRIMARY KEY ("groupId", "studentId")
      )
    `);

    // payments jadvali
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "studentId"   uuid NOT NULL,
        "groupId"     uuid NOT NULL,
        "teacherId"   uuid,
        "amount"      numeric(12,2) NOT NULL DEFAULT 0,
        "paymentDate" date NOT NULL,
        "note"        character varying,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payments" PRIMARY KEY ("id")
      )
    `);

    // attendances jadvali
    await queryRunner.query(`
      CREATE TABLE "attendances" (
        "id"        uuid NOT NULL DEFAULT uuid_generate_v4(),
        "studentId" uuid NOT NULL,
        "groupId"   uuid NOT NULL,
        "date"      date NOT NULL,
        "present"   boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_attendance" UNIQUE ("studentId", "groupId", "date"),
        CONSTRAINT "PK_attendances" PRIMARY KEY ("id")
      )
    `);

    // complaints jadvali
    await queryRunner.query(`
      CREATE TABLE "complaints" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "studentName" character varying NOT NULL,
        "phone"       character varying NOT NULL,
        "description" text NOT NULL,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_complaints" PRIMARY KEY ("id")
      )
    `);

    // ─── Foreign Keys ─────────────────────────────────────────

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

    // ─── Indexlar (qidiruv tezligi uchun) ─────────────────────

    await queryRunner.query(`CREATE INDEX "IDX_students_direction" ON "students" ("direction")`);
    await queryRunner.query(`CREATE INDEX "IDX_payments_date" ON "payments" ("paymentDate")`);
    await queryRunner.query(`CREATE INDEX "IDX_attendance_date" ON "attendances" ("date")`);
    await queryRunner.query(`CREATE INDEX "IDX_attendance_group" ON "attendances" ("groupId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Indexlarni o'chirish
    await queryRunner.query(`DROP INDEX "IDX_attendance_group"`);
    await queryRunner.query(`DROP INDEX "IDX_attendance_date"`);
    await queryRunner.query(`DROP INDEX "IDX_payments_date"`);
    await queryRunner.query(`DROP INDEX "IDX_students_direction"`);

    // Foreign key larni o'chirish
    await queryRunner.query(`ALTER TABLE "attendances" DROP CONSTRAINT "FK_att_group"`);
    await queryRunner.query(`ALTER TABLE "attendances" DROP CONSTRAINT "FK_att_student"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_group"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_student"`);
    await queryRunner.query(`ALTER TABLE "group_students" DROP CONSTRAINT "FK_gs_student"`);
    await queryRunner.query(`ALTER TABLE "group_students" DROP CONSTRAINT "FK_gs_group"`);
    await queryRunner.query(`ALTER TABLE "groups" DROP CONSTRAINT "FK_groups_teacher"`);

    // Jadvallarni o'chirish
    await queryRunner.query(`DROP TABLE "complaints"`);
    await queryRunner.query(`DROP TABLE "attendances"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TABLE "group_students"`);
    await queryRunner.query(`DROP TABLE "groups"`);
    await queryRunner.query(`DROP TABLE "students"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Enumlarni o'chirish
    await queryRunner.query(`DROP TYPE "public"."users_provider_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
