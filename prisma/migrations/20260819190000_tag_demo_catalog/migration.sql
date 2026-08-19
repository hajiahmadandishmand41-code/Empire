UPDATE "Product"
SET "tagsJson" = '["demo"]'::jsonb
WHERE "isTraditional" = false
  AND slug IN (
    'samsung-galaxy-a55',
    'nike-air-max-270',
    'lg-washing-machine-7kg',
    'loreal-revitalift',
    'adidas-ultraboost-22',
    'zara-men-linen-shirt',
    'philips-air-fryer',
    'xiaomi-mi-band-8',
    'sony-wh1000xm5'
  );
