-- CreateTable
CREATE TABLE "reglas_navieras" (
    "id" SERIAL NOT NULL,
    "naviera_id" INTEGER,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "emisores" JSONB NOT NULL DEFAULT '[]',
    "limpieza_regex" JSONB NOT NULL DEFAULT '[]',
    "prompt_extra" TEXT,
    "notas" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reglas_navieras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reglas_conceptos" (
    "id" SERIAL NOT NULL,
    "regla_naviera_id" INTEGER NOT NULL,
    "patron" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "tipo_match" TEXT NOT NULL DEFAULT 'includes',
    "origen" TEXT NOT NULL DEFAULT 'SEMILLA',
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reglas_conceptos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reglas_navieras_naviera_id_key" ON "reglas_navieras"("naviera_id");

-- CreateIndex
CREATE UNIQUE INDEX "reglas_navieras_codigo_key" ON "reglas_navieras"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "reglas_conceptos_regla_naviera_id_patron_key" ON "reglas_conceptos"("regla_naviera_id", "patron");

-- AddForeignKey
ALTER TABLE "reglas_navieras" ADD CONSTRAINT "reglas_navieras_naviera_id_fkey" FOREIGN KEY ("naviera_id") REFERENCES "navieras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reglas_conceptos" ADD CONSTRAINT "reglas_conceptos_regla_naviera_id_fkey" FOREIGN KEY ("regla_naviera_id") REFERENCES "reglas_navieras"("id") ON DELETE CASCADE ON UPDATE CASCADE;
