# Product import idempotency

Bulk product imports must accept an `Idempotency-Key` supplied by the seller client. The key is scoped to the seller and must be stored durably before the batch is considered successful. Retries with the same key must return the original result instead of creating products again.

The import worker should process CSV/Excel input in bounded batches of 100 products and persist progress after each batch. Media uploads remain outside the database transaction.
