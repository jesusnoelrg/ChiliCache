import { Database, Statement } from 'better-sqlite3';
import { CompanyInfo, CompanyPublic } from '../types/company.types';

export class CompanyRepository {
  private selectPublic: Statement;
  private selectAll: Statement;

  constructor(private db: Database) {
    this.selectPublic = db.prepare('SELECT name, logo_path FROM company WHERE id = 1');
    this.selectAll = db.prepare('SELECT * FROM company WHERE id = 1');
  }

  public getPublicInfo(): CompanyPublic | undefined {
    return this.selectPublic.get() as CompanyPublic | undefined;
  }

  public getAllInfo(): CompanyInfo | undefined {
    return this.selectAll.get() as CompanyInfo | undefined;
  }
}