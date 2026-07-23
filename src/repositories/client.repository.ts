import { Database, Statement } from 'better-sqlite3';

import { CreateClientDTO, UpdateClientDTO, GetClient, GetName } from '../types/client.types';

export class ClientRepository {

  private selectNameById: Statement;
  private insertClientStmt: Statement;
  private selectClientById: Statement;
  private selectLikeName: Statement;
  private selectCheckName: Statement;
  private updateClientStmt: Statement;
  private deleteClientStmt: Statement;

  constructor(private db: Database) {
    this.selectNameById = db.prepare('SELECT name FROM clients WHERE id = :id');
    this.insertClientStmt = db.prepare(`
      INSERT INTO clients (name, rfc, address, phone, email) VALUES 
      (:name, :rfc, :address, :phone, :email)
    `)
    this.selectClientById = db.prepare('SELECT * FROM clients WHERE id = :id');
    this.selectLikeName = db.prepare('SELECT id, name FROM clients WHERE name LIKE :name');
    this.selectCheckName = db.prepare('SELECT name FROM clients WHERE name = :name AND id != :id');
    this.updateClientStmt = this.db.prepare(`
      UPDATE clients 
      SET 
        name = COALESCE(:name, name),
        rfc = COALESCE(:rfc, rfc),
        address = COALESCE(:address, address),
        phone = COALESCE(:phone, phone),
        email = COALESCE(:email, email)
      WHERE id = :id
    `);
    this.deleteClientStmt = db.prepare('DELETE FROM clients WHERE id = :id');
  }

  public findNameById (id: string): string | null {
    const result = this.selectNameById.get({id: id}) as { name: string } || undefined;

    return result ? result.name : null;
  }

  public create(data: CreateClientDTO) {
    return this.insertClientStmt.run(data);
  }

  public update(data: UpdateClientDTO) {
    return this.updateClientStmt.run(data);
  }

  public delete(id: number) {
    return this.deleteClientStmt.run({id: id});
  }

  public findById(id: number): GetClient | null {
    return this.selectClientById.get({id: id}) as GetClient || null;
  }

  public searchByName(name: string): GetName[] | [] {
    return this.selectLikeName.all({ name: `%${name.trim()}%` }) as GetName[] || [];
  }

  public checkNameUse (name: string, id?: number): boolean {
    const result = this.selectCheckName.get({name: name, id: id || 0});

    return result ? true : false;
  }
}