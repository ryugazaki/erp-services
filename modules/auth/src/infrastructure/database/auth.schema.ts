import { ColumnType } from 'kysely';

export interface AuthDatabase {
  users: UsersTable;
  refresh_tokens: RefreshTokensTable;
}

export interface UsersTable {
  id: ColumnType<string, string, string>;
  email: ColumnType<string, string, string>;
  password_hash: ColumnType<string, string, string>;
  role: ColumnType<string, string, string>;
  is_active: ColumnType<boolean, boolean, boolean>;
  created_at: ColumnType<Date, Date, Date>;
  updated_at: ColumnType<Date, Date, Date>;
  deleted_at: ColumnType<Date | null, Date | null, Date | null>;
}

export interface RefreshTokensTable {
  id: ColumnType<string, string, string>;
  user_id: ColumnType<string, string, string>;
  family_id: ColumnType<string, string, string>;
  parent_token_id: ColumnType<string | null, string | null, string | null>;
  is_used: ColumnType<boolean, boolean, boolean>;
  is_revoked: ColumnType<boolean, boolean, boolean>;
  expires_at: ColumnType<Date, Date, Date>;
  created_at: ColumnType<Date, Date, Date>;
}
