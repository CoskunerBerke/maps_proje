/**
 * CSV helpers.
 *
 * Business names, addresses and notes come from external data (Google Places)
 * or user input. A cell that starts with "=", "+", "-", "@", TAB or CR is
 * interpreted as a formula by Excel / LibreOffice (CSV / formula injection),
 * so such cells are prefixed with a single quote.
 */

const FORMULA_PREFIX = /^[=+\-@\t\r]/;
// Plain phone numbers such as "+90 312 000 00 00" cannot run a formula; keep them readable.
const PHONE_LIKE = /^\+?[\d\s()\-]+$/;

export function neutralizeFormula(value: string): string {
  if (FORMULA_PREFIX.test(value) && !PHONE_LIKE.test(value)) {
    return `'${value}`;
  }
  return value;
}

/** Converts a value to a quoted CSV cell, escaping quotes and neutralizing formulas. */
export function toCsvCell(value: unknown): string {
  const text = neutralizeFormula(value === null || value === undefined ? '' : String(value));
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsvRow(values: unknown[]): string {
  return values.map(toCsvCell).join(',');
}
