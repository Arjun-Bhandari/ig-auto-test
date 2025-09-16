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
CREATE TABLE "public"."AutomationRule" (
    "id" TEXT NOT NULL,
    "igUserId" BIGINT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "rule" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IgUser_igUserId_key" ON "public"."IgUser"("igUserId");

-- AddForeignKey
ALTER TABLE "public"."AutomationRule" ADD CONSTRAINT "AutomationRule_igUserId_fkey" FOREIGN KEY ("igUserId") REFERENCES "public"."IgUser"("igUserId") ON DELETE RESTRICT ON UPDATE CASCADE;
