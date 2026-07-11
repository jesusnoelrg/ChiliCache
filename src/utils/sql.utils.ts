/**
 * Takes a data object and generates the columns and placeholders for an INSERT in SQLite.
 * 
 * Return:
 *  Columns => 'value1, value2, value3...'
 *  Placeholders => ':value1, :value2, :value3...'
 */
export function generateInsertHelper (data: Record<string, any>) {
  const columns = Object.keys(data).join(', ');
  const placeholders = Object.keys(data).map(x => `:${x}`).join(', ');

  return {columns, placeholders};
}

/**
 * Takes a data object and generates the SET clause.
 * 
 * @params data
 * @returns ":value1, value2 = :value2..."
 *
 */
export function updateHelper(data: Record<string, any>, excludeKeys: string[] = ['id']): string{
  return Object.keys(data)
    .filter((x) => !excludeKeys.includes(x))
    .map((x) => `${x} = :${x}`)
    .join(', ');
}

/**
 * Validate the following phone formats are valid:
 * - 5551234567
 * - 555-123-4567
 * - 555 123 4567
 * - 555.123.4567
 * - (555) 123-4567
 * 
 * @param phone 
 * @returns boolean
 */

export const phoneFormat = (phone: string) => {
  const onlyNumbers = phone.replace(/\D/g, '');
  const onlyTenDigits = /^\d{10}$/.test(onlyNumbers);

  return onlyTenDigits ? onlyNumbers : null;
};


/**
 * Validate that the text follows the format of a email.
 * 
 * @param email 
 * @returns boolean
 */
export const emailFormat = (email: string) => email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);

/**
 * Validate if it is an RFC with a valid format
 */
export const rfcFormat = (rfc: string) => rfc.match(/^([A-ZÑ&]{3,4})(\d{2})(0[1-9]|1[0-2])(0[1-9]|1[0-2]|2[0-9]|3[01])([A-Z0-9]{2}[0-9A])$/);