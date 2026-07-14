import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export async function hashPassword (plainPassword: string){
  try{
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    return hashedPassword;
  }catch(err: any){
    console.error('Error hasheando contraseña: ', err);
    throw err;
  }
}

export async function verifyPassword (plainPassword: string, hashedPassword: string): Promise<boolean> {
  try{
    const compare = await bcrypt.compare(plainPassword, hashedPassword);

    return compare;
  }catch(err: any){
    console.error('Error hasheando contraseña: ', err);
    throw err;
  }
}