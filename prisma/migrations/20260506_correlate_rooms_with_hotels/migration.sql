-- AlterEnum
BEGIN;
CREATE TYPE "RoomType_new" AS ENUM ('SINGLE', 'DOUBLE', 'TWIN', 'SUITE', 'DELUXE', 'FAMILY');
ALTER TABLE "rooms" ALTER COLUMN "type" TYPE "RoomType_new" USING ("type"::text::"RoomType_new");
ALTER TYPE "RoomType" RENAME TO "RoomType_old";
ALTER TYPE "RoomType_new" RENAME TO "RoomType";
DROP TYPE "public"."RoomType_old";
COMMIT;

-- DropIndex
DROP INDEX "rooms_hotelId_name_key";

-- AlterTable
ALTER TABLE "rooms" DROP COLUMN "images",
DROP COLUMN "name",
ADD COLUMN     "amenities" TEXT[],
ADD COLUMN     "floor" INTEGER NOT NULL,
ADD COLUMN     "imagePublicId" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "roomNumber" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "rooms_hotelId_roomNumber_key" ON "rooms"("hotelId", "roomNumber");

