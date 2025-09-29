-- CreateEnum
CREATE TYPE "public"."AutomationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "public"."IgUser" (
    "id" TEXT NOT NULL,
    "igUserId" BIGINT NOT NULL,
    "username" TEXT,
    "name" TEXT,
    "profilePictureUrl" TEXT,
    "accountType" TEXT,
    "accessToken" TEXT NOT NULL,
    "tokenExpireDay" TIMESTAMP(3) NOT NULL,
    "tokenCreatedAt" TIMESTAMP(3) NOT NULL,
    "tokenExpireIn" INTEGER NOT NULL,
    "permissions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IgUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Automation" (
    "id" TEXT NOT NULL,
    "igUserId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "rule" JSONB NOT NULL,
    "campignType" TEXT NOT NULL,
    "status" "public"."AutomationStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "lastExecutedAt" TIMESTAMP(3),
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "lastErrorAt" TIMESTAMP(3),
    "lastErrorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IgUser_igUserId_key" ON "public"."IgUser"("igUserId");

-- AddForeignKey
ALTER TABLE "public"."Automation" ADD CONSTRAINT "Automation_igUserId_fkey" FOREIGN KEY ("igUserId") REFERENCES "public"."IgUser"("igUserId") ON DELETE RESTRICT ON UPDATE CASCADE;
