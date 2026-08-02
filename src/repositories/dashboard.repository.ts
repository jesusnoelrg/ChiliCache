import type { Statement, Database } from 'better-sqlite3';

export class DashboardRepository {
  private selectAllCounts: Statement;

  constructor(private db: Database) {
    this.selectAllCounts = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM clients) AS clients,
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM products) as products,
        (SELECT COUNT(*) FROM sales) as sales
      `);
  }

  public getAllCounts() {
    return this.selectAllCounts.all();
  }
}