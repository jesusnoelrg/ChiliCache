import { Database, Statement } from 'better-sqlite3';

import db from '../config/db';

export class UserRepository {

  private selectNameById: Statement;

  constructor(private db: Database) {
    this.selectNameById = db.prepare('SELECT name FROM users WHERE id = id:');
  }

  public findNameById (id: string): string | null {
    const result = this.selectNameById.get({id: id}) as { name: string } || undefined;

    return result ? result.name : null;
  }
}