-- CreateTable
CREATE TABLE "category_keywords" (
    "keyword" TEXT NOT NULL,
    "category" "Category" NOT NULL,

    CONSTRAINT "category_keywords_pkey" PRIMARY KEY ("keyword")
);
