# Product import scaling

## Import contract

- Bulk product creation is capped at 100 records per request.
- Each batch is validated before writes.
- Product images are uploaded separately from product creation.
- For large imports, clients should chunk input into batches and retry failed batches using an idempotency key.

## Cursor pagination

Seller product lists should use `(createdAt, id)` as a stable cursor. The query must filter with:

`createdAt < cursorCreatedAt OR (createdAt = cursorCreatedAt AND id < cursorId)`

and order by `createdAt DESC, id DESC`.

Avoid OFFSET pagination for high-cardinality seller catalogs.

## Operational targets

- Keep interactive product-list requests below 100 rows.
- Keep bulk writes bounded to avoid long transactions.
- Keep media uploads outside the database transaction.
- Monitor slow queries and connection-pool saturation before increasing database size.
