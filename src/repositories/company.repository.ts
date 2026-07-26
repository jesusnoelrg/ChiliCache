import { Database, Statement } from 'better-sqlite3';
import { CompanyInfo, CompanyPublic, UpdateCompanyInfo } from '../types/company.types';

export class CompanyRepository {
  private selectPublic: Statement;
  private selectAll: Statement;
  private insertInfo: Statement;

  constructor(private db: Database) {
    this.selectPublic = db.prepare('SELECT name, logo_path, primary_color, secondary_color FROM company WHERE id = 1');
    this.selectAll = db.prepare('SELECT * FROM company WHERE id = 1');
    this.insertInfo = db.prepare(`
      INSERT INTO company (id, name, logo_path, tax_id, address, phone, email, primary_color, secondary_color, updated_at)
      VALUES (1, :name, :logo_path, :tax_id, :address, :phone, :email, :primary_color, :secondary_color, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name = COALESCE(excluded.name, 'ChiliCache'),
        logo_path = excluded.logo_path,
        tax_id = excluded.tax_id,
        address = excluded.address,
        phone = excluded.phone,
        email = excluded.email,
        primary_color = COALESCE(excluded.primary_color, '#bf2121'),
        secondary_color = COALESCE(excluded.secondary_color, '#893030'),
        updated_at = CURRENT_TIMESTAMP
      `);
  }

  public getPublicInfo(): CompanyPublic | undefined {
    return this.selectPublic.get() as CompanyPublic | undefined;
  }

  public getAllInfo(): CompanyInfo | undefined {
    return this.selectAll.get() as CompanyInfo | undefined;
  }

  public set(data: UpdateCompanyInfo): unknown {
    return this.insertInfo.run(data);
  }
}