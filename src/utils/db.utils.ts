import db from "../config/db";

interface ExistenceCriteria {
  table: 'users' | 'products' | 'clients' | 'sales';
  column: 'id' | 'name';
  value: string | number;
}

/**
 * Verifica de forma segura la existencia de un registro bajo un criterio dinámico.
 */
export const isRecordFieldPresent = ({ table, column, value }: ExistenceCriteria): boolean => {
  const query = `SELECT 1 FROM ${table} WHERE ${column} = :value LIMIT 1`;
  
  const result = db.prepare(query).get({ value });
  return result !== undefined;
};