-- AlterTable
ALTER TABLE "Organisation" ADD COLUMN "githubInstallationId" TEXT,
ADD COLUMN "githubOrgName" TEXT,
ADD COLUMN "githubTokenEnc" TEXT,
ADD COLUMN "githubWebhookSecretEnc" TEXT;
