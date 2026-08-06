import { Database, Statement } from 'better-sqlite3';
import { 
  CreateUserDTO, GetUsersDTO, 
  UpdateUserRepositoryParams, Role,
  SessionUser, UserLoggedWithPassword
} from '../types/user.types';

export class UserRepository {

  private selectName: Statement<[{username: string, id: number}], {id: number, username: string}>;
  private selectPassword: Statement<[{id: number}], {password: string}>;
  private selectFullnames: Statement<[], {full_name: string}>;
  private selectById: Statement<[{id: number}], {id: number}>;
  private selectRole: Statement<[{id: number}], {id: number, role: Role}>;
  private selectSessionUser: Statement<[{username: string}], UserLoggedWithPassword>;
  private selectId: Statement<[{id: number}], {id: number}>;

  private insertUser: Statement<[CreateUserDTO], {lastInsertRowid: number} | undefined>;

  private deleteUser: Statement<[{id: number}], {changes: number} | undefined>;

  constructor(private db: Database) {
    this.selectName = db.prepare('SELECT id, username FROM users WHERE username = :username AND id != :id');
    this.selectPassword = db.prepare('SELECT password FROM users WHERE id = :id');
    this.selectId = db.prepare('SELECT id FROM users WHERE id = :id');
    this.selectRole = db.prepare('SELECT id, role FROM users WHERE id = :id');
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
    this.selectSessionUser = db.prepare(`
      SELECT
        id, username, full_name,
        password, role
      FROM users WHERE username = :username
      `)
    this.deleteUser = db.prepare('DELETE FROM users WHERE id = :id');
  }

  public createUser (user: CreateUserDTO) {
    return this.insertUser.run({
      username: user.username,
      full_name: user.full_name,
      password: user.password,
      role: user.role ?? 'seller'
    });
  }

  public getAllNames (): { full_name: string }[] {
    return this.selectFullnames.all() as { full_name: string }[];
  }

  public getById (id: number) {
    return this.selectById.get({ id });
  }

  public isExist(id: number): { id: number } | null {
    return this.selectId.get({ id }) ?? null;
  }

  public getRoleAndId (id: number) {
    return this.selectRole.get({ id }) as { id: number, role: Role } | undefined;
  }

  public getSessionUser (username: string) {
    return this.selectSessionUser.get({ username }) as SessionUser | undefined;
  }

  public update(id: number, dto: UpdateUserRepositoryParams) {
    const assignments: string[] = [];
    const params: Record<string, unknown> = { id };

    if (dto.username !== undefined) {
      assignments.push('username = :username');
      params.username = dto.username;
    }

    if (dto.full_name !== undefined) {
      assignments.push('full_name = :full_name');
      params.full_name = dto.full_name;
    }

    if (dto.password !== undefined) {
      assignments.push('password = :password');
      params.password = dto.password;
    }

    if (dto.role !== undefined) {
      assignments.push('role = :role');
      params.role = dto.role;
    }

    if (assignments.length === 0) {
      return { changes: 0 };
    }

    const query = `
      UPDATE users 
      SET ${assignments.join(', ')} 
      WHERE id = :id
    `;

    return this.db.prepare(query).run(params);
  }

  public delete (id: number) {
    return this.deleteUser.run({ id });
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