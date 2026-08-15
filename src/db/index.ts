/**
 * @deprecated Legacy Drizzle compatibility stub.
 *
 * The application uses Prisma for persistence. These typed no-op exports are
 * retained only for legacy imports that have not yet been migrated.
 */

export interface LegacyTable {
  readonly _tableName: string;
  readonly id: string;
  readonly name: string;
  readonly price: number;
}

type LegacyRows = readonly LegacyTable[];

interface LegacySelect {
  from(table: LegacyTable): { where(condition?: unknown): Promise<LegacyRows> };
}

interface LegacyInsert {
  values(values: unknown): { returning(): Promise<LegacyRows> };
}

interface LegacyUpdate {
  set(values: unknown): { where(condition?: unknown): Promise<LegacyRows> };
}

interface LegacyDelete {
  where(condition?: unknown): Promise<LegacyRows>;
}

export interface LegacyDb {
  select(): LegacySelect;
  insert(table?: LegacyTable): LegacyInsert;
  update(table?: LegacyTable): LegacyUpdate;
  delete(table?: LegacyTable): LegacyDelete;
}

const emptyRows: LegacyRows = [];

export const db: LegacyDb = {
  select: () => ({ from: () => ({ where: async () => emptyRows }) }),
  insert: () => ({ values: () => ({ returning: async () => emptyRows }) }),
  update: () => ({ set: () => ({ where: async () => emptyRows }) }),
  delete: () => ({ where: async () => emptyRows }),
};
