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
 * Return => value1 = :value1, value2 = :value2...
 *
 */
export function updateHelper(data: Record<string, any>, excludeKeys: string[] = ['id']): string{
  return Object.keys(data)
    .filter((x) => !excludeKeys.includes(x))
    .map((x) => `${x} = :${x}`)
    .join(', ');
}