/*
  Warnings:

  - The values [WAITING_ON_INSURER] on the enum `TicketStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[ticketSequence]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.
  - Made the column `clientId` on table `Ticket` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TicketStatus_new" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'RESOLVED', 'CLOSED');
ALTER TABLE "public"."Ticket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Ticket" ALTER COLUMN "status" TYPE "TicketStatus_new" USING ("status"::text::"TicketStatus_new");
ALTER TYPE "TicketStatus" RENAME TO "TicketStatus_old";
ALTER TYPE "TicketStatus_new" RENAME TO "TicketStatus";
DROP TYPE "public"."TicketStatus_old";
ALTER TABLE "Ticket" ALTER COLUMN "status" SET DEFAULT 'OPEN';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Ticket" DROP CONSTRAINT "Ticket_clientId_fkey";

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "reporterId" TEXT,
ADD COLUMN     "ticketSequence" SERIAL NOT NULL,
ALTER COLUMN "clientId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketSequence_key" ON "Ticket"("ticketSequence");

-- CreateIndex
CREATE INDEX "Ticket_reporterId_idx" ON "Ticket"("reporterId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
