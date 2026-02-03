-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "author" VARCHAR(255),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "photographer_name" VARCHAR(255) NOT NULL,
    "photographer_url" TEXT,
    "source" VARCHAR(50) NOT NULL DEFAULT 'unsplash',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pairings" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "image_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pairings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quotes_active_idx" ON "quotes"("active");

-- CreateIndex
CREATE INDEX "quotes_created_at_idx" ON "quotes"("created_at" DESC);

-- CreateIndex
CREATE INDEX "images_active_idx" ON "images"("active");

-- CreateIndex
CREATE INDEX "images_source_idx" ON "images"("source");

-- CreateIndex
CREATE INDEX "pairings_quote_id_idx" ON "pairings"("quote_id");

-- CreateIndex
CREATE INDEX "pairings_image_id_idx" ON "pairings"("image_id");

-- CreateIndex
CREATE INDEX "pairings_date_idx" ON "pairings"("date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "pairings_date_key" ON "pairings"("date");

-- AddForeignKey
ALTER TABLE "pairings" ADD CONSTRAINT "pairings_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pairings" ADD CONSTRAINT "pairings_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE CASCADE ON UPDATE CASCADE;
