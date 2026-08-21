-- Admin catalog seed: category artwork + sample products with real image URLs.
-- Safe on existing data: demo products are only inserted when the Product table is empty.
-- Category image URLs are updated by stable category key.

ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

INSERT INTO "Category" ("id", "key", "name", "slug", "imageUrl") VALUES
  ('cat_demo_clothing', 'clothing', 'پوشاک', 'clothing', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80'),
  ('cat_demo_digital', 'digital', 'دیجیتال', 'digital', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80'),
  ('cat_demo_home', 'homeAppliances', 'لوازم خانگی', 'home-appliances', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80'),
  ('cat_demo_beauty', 'beauty', 'آرایشی و بهداشتی', 'beauty', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80'),
  ('cat_demo_sports', 'sports', 'ورزشی', 'sports', 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=900&q=80'),
  ('cat_demo_footwear', 'footwear', 'کفش و کتانی', 'footwear', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80'),
  ('cat_demo_baby', 'baby', 'کودک و نوزاد', 'baby', 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=900&q=80'),
  ('cat_demo_books', 'books', 'کتاب و لوازم‌التحریر', 'books', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80'),
  ('cat_demo_electronics', 'electronics', 'الکترونیک', 'electronics', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=900&q=80'),
  ('cat_demo_watches', 'watches', 'ساعت و اکسسوری', 'watches', 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80')
ON CONFLICT (key) DO UPDATE SET "name" = EXCLUDED."name", "slug" = EXCLUDED."slug", "imageUrl" = EXCLUDED."imageUrl";

DO $$
DECLARE
  digital_id TEXT;
  footwear_id TEXT;
  home_id TEXT;
  beauty_id TEXT;
  sports_id TEXT;
  clothing_id TEXT;
  watches_id TEXT;
  electronics_id TEXT;
  baby_id TEXT;
  books_id TEXT;
BEGIN
  SELECT id INTO digital_id FROM "Category" WHERE key = 'digital';
  SELECT id INTO footwear_id FROM "Category" WHERE key = 'footwear';
  SELECT id INTO home_id FROM "Category" WHERE key = 'homeAppliances';
  SELECT id INTO beauty_id FROM "Category" WHERE key = 'beauty';
  SELECT id INTO sports_id FROM "Category" WHERE key = 'sports';
  SELECT id INTO clothing_id FROM "Category" WHERE key = 'clothing';
  SELECT id INTO watches_id FROM "Category" WHERE key = 'watches';
  SELECT id INTO electronics_id FROM "Category" WHERE key = 'electronics';
  SELECT id INTO baby_id FROM "Category" WHERE key = 'baby';
  SELECT id INTO books_id FROM "Category" WHERE key = 'books';

  IF NOT EXISTS (SELECT 1 FROM "Product" LIMIT 1) THEN
    INSERT INTO "Product" ("id","slug","name","shortDescription","description","price","currency","badge","region","inStock","isActive","stockQuantity","featuresJson","imagesJson","categoryId") VALUES
      ('prd_demo_a55','samsung-galaxy-a55','Samsung Galaxy A55','گوشی هوشمند سامسونگ با نمایشگر AMOLED و دوربین حرفه‌ای','نمونه محصول فروشگاه برای تست کاتالوگ و پنل ادمین.',25000,'AFN','new','AF',true,true,25,'["نمایشگر AMOLED","دوربین 50MP","باتری 5000mAh"]','[{"src":"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=85","alt":"Samsung Galaxy A55"},{"src":"https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=85","alt":"Smartphone detail"}]',digital_id),
      ('prd_demo_nike','nike-air-max-270','Nike Air Max 270','کتانی روزمره و ورزشی با زیره Air Max','نمونه محصول برای تست تصاویر چندگانه و موجودی.',8500,'AFN','best','AF',true,true,40,'["Air Max","سایزبندی کامل","رویه سبک"]','[{"src":"https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85","alt":"Nike Air Max 270"},{"src":"https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=1200&q=85","alt":"Running shoe"}]',footwear_id),
      ('prd_demo_lg','lg-washing-machine-7kg','LG Washing Machine 7kg','ماشین لباسشویی ال‌جی برای استفاده خانگی','نمونه محصول لوازم خانگی.',32000,'AFN','best','AF',true,true,8,'["ظرفیت 7 کیلو","مصرف کم","برنامه‌های متنوع"]','[{"src":"https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=1200&q=85","alt":"Washing machine"}]',home_id),
      ('prd_demo_loreal','loreal-revitalift-cream','L’Oréal Revitalift Cream','کرم روز مراقبت از پوست با بافت سبک','نمونه محصول آرایشی و بهداشتی.',3200,'AFN','new','AF',true,true,35,'["بافت سبک","مناسب استفاده روزانه","بسته‌بندی نمونه"]','[{"src":"https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1200&q=85","alt":"Skincare cream"}]',beauty_id),
      ('prd_demo_adidas','adidas-ultraboost-22','Adidas Ultraboost 22','کفش دویدن راحت برای استفاده روزانه و ورزش','نمونه محصول ورزشی.',12000,'AFN','sale','AF',true,true,20,'["Boost cushioning","مناسب دویدن","رویه تنفس‌پذیر"]','[{"src":"https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=1200&q=85","alt":"Running shoes"}]',sports_id),
      ('prd_demo_zara','zara-men-linen-shirt','پیراهن کتان مردانه Zara','پیراهن سبک کتان برای فصل گرم','نمونه محصول پوشاک.',4500,'AFN',NULL,'AF',true,true,30,'["کتان","سبک","مناسب تابستان"]','[{"src":"https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=85","alt":"Linen shirt"}]',clothing_id),
      ('prd_demo_miband','xiaomi-mi-band-8','Xiaomi Mi Band 8','مچ‌بند هوشمند با پایش فعالیت روزانه','نمونه محصول ساعت و پوشیدنی.',4800,'AFN','new','AF',true,true,18,'["پایش فعالیت","نمایشگر رنگی","باتری چندروزه"]','[{"src":"https://images.unsplash.com/photo-1557935728-e6d1eaabe558?auto=format&fit=crop&w=1200&q=85","alt":"Smart band"}]',watches_id),
      ('prd_demo_sony','sony-wh1000xm5','Sony WH-1000XM5','هدفون بی‌سیم با حذف نویز فعال','نمونه محصول الکترونیک.',28000,'AFN','best','AF',true,true,12,'["Noise cancelling","Bluetooth","باتری طولانی"]','[{"src":"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85","alt":"Wireless headphones"}]',electronics_id),
      ('prd_demo_pampers','pampers-newborn-pack','Pampers Newborn Pack','پوشک نوزاد برای استفاده روزانه','نمونه محصول کودک.',2200,'AFN',NULL,'AF',true,true,50,'["نرم","جذب بالا","بسته اقتصادی"]','[{"src":"https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1200&q=85","alt":"Baby product"}]',baby_id),
      ('prd_demo_book','modern-business-book','کتاب راهنمای کسب‌وکار مدرن','کتاب نمونه برای تست دسته کتاب و جستجو','نمونه محصول کتاب.',1400,'AFN',NULL,'AF',true,true,25,'["چاپ نمونه","نسخه فارسی","مناسب مطالعه"]','[{"src":"https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=1200&q=85","alt":"Business book"}]',books_id);
  END IF;
END $$;
