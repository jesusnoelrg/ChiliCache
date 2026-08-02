import db from './db';

import { CreateUserDTO } from '../types/user.types';
import { hashPassword } from '../utils/auth.utils';

export const seedAdmin = async () => {
  const isUsersEmpty = db.prepare("SELECT COUNT(id) AS count FROM users WHERE role = 'admin'")
    .get() as {count: number};
  
  if(isUsersEmpty.count !== 0) return;
  
  const encryptedPassword = await hashPassword('admin123');

  const userData: CreateUserDTO = {
    username: 'jesusnoel',
    full_name: 'Jesús Noel Rabago Gocobachi',
    password: encryptedPassword,
    role: 'admin'
  };

  const result = db.prepare(`
    INSERT INTO users (username, full_name, password, role) VALUES
    (:username, :full_name, :password, :role)
    `).run(userData);

  if(!result) console.error('ERROR: Ha ocurrido un error al intentar ejecutar la semilla.');

  console.log('EXITO: Se ha implementado la semilla exitosamente.')
}

seedAdmin();
