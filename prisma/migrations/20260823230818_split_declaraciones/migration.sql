-- CreateTable
CREATE TABLE "declaraciones" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "bkg_number" TEXT NOT NULL,
    "sufijo" TEXT NOT NULL,
    "c20" INTEGER NOT NULL DEFAULT 0,
    "c40" INTEGER NOT NULL DEFAULT 0,
    "estado_declaracion" TEXT NOT NULL DEFAULT 'FALTA',
    "estado_vgm" TEXT NOT NULL DEFAULT 'FALTA',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "declaraciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "declaraciones_bkg_number_key" ON "declaraciones"("bkg_number");

-- AddForeignKey
ALTER TABLE "declaraciones" ADD CONSTRAINT "declaraciones_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
