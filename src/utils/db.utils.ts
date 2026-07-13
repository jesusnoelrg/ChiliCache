import db from "../config/db";

interface ExistenceCriteria {
  table: 'users' | 'products' | 'clients' | 'sales';
  column: 'id' | 'name';
  value: string | number;
}

/**
 * Securely verifies the existence of a record under dynamic criteria.
 * 
 * @param {ExistenceCriteria} criteria - The criteria object.
 * @param {string} criteria.table - The target database table name (must be whitelisted).
 * @param {string} criteria.column - The table column to filter by.
 * @param {string|number} criteria.value - The value to look for.
 * @returns {boolean} True if the record exists, false otherwise.
 */
export const isRecordFieldPresent = ({ table, column, value }: ExistenceCriteria): boolean => {
  const query = `SELECT 1 FROM ${table} WHERE ${column} = :value LIMIT 1`;
  
  const result = db.prepare(query).get({ value });
  return result !== undefined;
};