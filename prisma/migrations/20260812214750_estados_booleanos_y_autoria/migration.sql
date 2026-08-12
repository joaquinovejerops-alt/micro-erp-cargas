/*
  Warnings:

  - You are about to drop the column `estado` on the `bookings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "estado",
ADD COLUMN     "declaracion_en" TIMESTAMP(3),
ADD COLUMN     "declaracion_por" INTEGER,
ADD COLUMN     "documentacion_ok" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "documentacion_ok_en" TIMESTAMP(3),
ADD COLUMN     "documentacion_ok_por" INTEGER,
ADD COLUMN     "vgm_en" TIMESTAMP(3),
ADD COLUMN     "vgm_por" INTEGER,
ADD COLUMN     "zarpado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "zarpado_en" TIMESTAMP(3),
ADD COLUMN     "zarpado_por" INTEGER;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_documentacion_ok_por_fkey" FOREIGN KEY ("documentacion_ok_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_zarpado_por_fkey" FOREIGN KEY ("zarpado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_declaracion_por_fkey" FOREIGN KEY ("declaracion_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vgm_por_fkey" FOREIGN KEY ("vgm_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
