-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navieras" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "navieras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" SERIAL NOT NULL,
    "bkg_number" TEXT NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "naviera_id" INTEGER NOT NULL,
    "buque_viaje" TEXT,
    "pol" TEXT,
    "pod" TEXT,
    "producto" TEXT,
    "eta" TIMESTAMP(3),
    "cutoff_doc" TIMESTAMP(3),
    "cutoff_fisico" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'CONFIRMADO',
    "estado_declaracion" TEXT NOT NULL DEFAULT 'FALTA',
    "estado_vgm" TEXT NOT NULL DEFAULT 'FALTA',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contenedores" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "contenedores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_nombre_key" ON "clientes"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "navieras_nombre_key" ON "navieras"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_bkg_number_key" ON "bookings"("bkg_number");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_naviera_id_fkey" FOREIGN KEY ("naviera_id") REFERENCES "navieras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contenedores" ADD CONSTRAINT "contenedores_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
