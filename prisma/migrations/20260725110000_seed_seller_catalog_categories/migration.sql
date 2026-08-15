-- Ensure the seller product form always has real database-backed categories.
-- Safe to run repeatedly because category keys are unique.
INSERT INTO "Category" ("id", "key", "name", "slug")
VALUES
  ('seller-category-clothing', 'clothing', 'پوشاک', 'clothing'),
  ('seller-category-digital', 'digital', 'دیجیتال', 'digital'),
  ('seller-category-home-appliances', 'homeAppliances', 'لوازم خانگی', 'home-appliances'),
  ('seller-category-beauty', 'beauty', 'آرایشی و بهداشتی', 'beauty'),
  ('seller-category-sports', 'sports', 'ورزشی', 'sports'),
  ('seller-category-footwear', 'footwear', 'کفش و کتانی', 'footwear'),
  ('seller-category-baby', 'baby', 'کودک و نوزاد', 'baby'),
  ('seller-category-books', 'books', 'کتاب و لوازم‌التحریر', 'books'),
  ('seller-category-electronics', 'electronics', 'الکترونیک', 'electronics'),
  ('seller-category-watches', 'watches', 'ساعت و اکسسوری', 'watches')
ON CONFLICT ("key") DO UPDATE
SET "name" = EXCLUDED."name",
    "slug" = EXCLUDED."slug";