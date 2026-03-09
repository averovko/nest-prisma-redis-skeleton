-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('USER', 'MODERATOR', 'EDITOR', 'ADMIN', 'ROOT');

-- CreateEnum
CREATE TYPE "user_activity_type" AS ENUM ('LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_COMPLETE', 'PROFILE_UPDATE', 'AVATAR_UPDATE', 'EMAIL_UPDATE', 'PHONE_UPDATE', 'ACCOUNT_CREATED', 'ACCOUNT_DEACTIVATED', 'ACCOUNT_ACTIVATED', 'ACCOUNT_DELETED', 'ROLE_CHANGE', 'SECURITY_ALERT', 'TWO_FACTOR_ENABLED', 'TWO_FACTOR_DISABLED');

-- CreateEnum
CREATE TYPE "invitation_status" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "auth_id" UUID NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "avatar" TEXT,
    "roles" "user_role"[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activity_type" "user_activity_type" NOT NULL,
    "performed_by" TEXT,
    "details" JSONB NOT NULL DEFAULT '{}',
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "success" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT,
    "device_id" TEXT,

    CONSTRAINT "user_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "inviter_id" TEXT NOT NULL,
    "message" TEXT,
    "email" TEXT,
    "status" "invitation_status" NOT NULL DEFAULT 'PENDING',
    "accepted_by" TEXT,
    "accepted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_id_key" ON "users"("auth_id");

-- CreateIndex
CREATE INDEX "user_activities_user_id_idx" ON "user_activities"("user_id");

-- CreateIndex
CREATE INDEX "user_activities_timestamp_idx" ON "user_activities"("timestamp");

-- CreateIndex
CREATE INDEX "user_activities_activity_type_idx" ON "user_activities"("activity_type");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_code_key" ON "invitations"("code");

-- CreateIndex
CREATE INDEX "invitations_inviter_id_idx" ON "invitations"("inviter_id");

-- CreateIndex
CREATE INDEX "invitations_code_idx" ON "invitations"("code");

-- AddForeignKey
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_accepted_by_fkey" FOREIGN KEY ("accepted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
