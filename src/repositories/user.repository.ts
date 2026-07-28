import { Database, Statement } from 'better-sqlite3';
import { CreateUserDTO, GetUsersDTO, UpdateUserRepositoryParams } from '../types/user.types';

export class UserRepository {

  private selectName: Statement;
  private selectPassword: Statement;
  private insertUser: Statement;
  private selectFullnames: Statement;
  private selectById: Statement;
  private updateUser: Statement;

  constructor(private db: Database) {
    this.selectName = db.prepare('SELECT id, username FROM users WHERE username = :username AND id != :id');
    this.selectPassword = db.prepare('SELECT password FROM users WHERE id = :id');
    this.insertUser = db.prepare(`
      INSERT INTO users (username, password, full_name, role)
      VALUES (:username, :password, :full_name, :role)
      `);
    this.selectFullnames = db.prepare('SELECT full_name FROM users');
    this.selectById = db.prepare(`
      SELECT
        username, full_name,
        password, role, created_at
      FROM users
      WHERE id = :id
      `);
    this.updateUser = db.prepare(`
      UPDATE users SET
        username = COALESCE(:username, username),
        full_name = COALESCE(:full_name, full_name),
        password = COALESCE(:password, password),
        role = COALESCE(:role, role)
      WHERE id = :id
      `)
  }

  public createUser (user: CreateUserDTO) {
    return this.insertUser.run({
      username: user.username,
      full_name: user.full_name,
      password: user.password,
      role: user.role
    });
  }

  public getAllNames (): { full_name: string }[] {
    return this.selectFullnames.all() as { full_name: string }[];
  }

  public getById (id: number) {
    return this.selectById.get({ id });
  }

  public update (data: UpdateUserRepositoryParams) {
    return this.updateUser.run({
      id: data.id,
      username: data.username ?? null,
      full_name: data.full_name ?? null,
      password: data.password ?? null,
      role: data.role ?? null
    });
  }

  public getPassword (id: number) {
    const result = this.selectPassword.get({ id }) as { password: string } | null;
    return result ? result.password : null;
  }

  private buildFindAllQuery (filters: GetUsersDTO) {
    const { username, full_name, role, limit, offset} = filters;

    const conditions: string[] = [];
    const params: Record<string, any> = {
      limit: Number(limit),
      offset: Number(offset)
    };

    if (username) {
      conditions.push('username LIKE :username');
      params.username = `%${username}%`;
    }

    if (full_name) {
      conditions.push("full_name LIKE :full_name");
      params.full_name = `%${full_name}%`;
    }

    if (role) {
      conditions.push("role = :role");
      params.role = role;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT id, username, full_name, role, created_at FROM users ${whereClause} LIMIT :limit OFFSET :offset`;

    return { query, params };
  }

  public findAll(filters: GetUsersDTO) {
    const { query, params } = this.buildFindAllQuery(filters);
    return this.db.prepare(query).all(params);
  }

  public checkUsername (username: string, id?: number): { id: number, username: string } | null {
    const result = this.selectName.get({
        username: username,
        id: id ?? -1
      }) as { id: number, username: string } | undefined;

    return result || null;
  }
}