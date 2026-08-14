-- CreateTable
CREATE TABLE "movimientos" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT,
    "proveedor" TEXT,
    "descripcion" TEXT NOT NULL,
    "monto_original" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "tipo_cambio" DOUBLE PRECISION,
    "monto_usd" DOUBLE PRECISION NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
