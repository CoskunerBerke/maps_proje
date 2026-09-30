import { describe, it, expect } from 'vitest';
import { neutralizeFormula, toCsvCell, toCsvRow } from '../utils/csv';

describe('CSV dışa aktarma formül enjeksiyonu koruması', () => {
  it('Formül ile başlayan hücreleri etkisiz hale getirmelidir', () => {
    expect(neutralizeFormula('=HYPERLINK("http://evil","tıkla")')).toBe('\'=HYPERLINK("http://evil","tıkla")');
    expect(neutralizeFormula('@SUM(1+1)')).toBe("'@SUM(1+1)");
    expect(neutralizeFormula('-2+3+cmd|\' /C calc\'!A0')).toBe("'-2+3+cmd|' /C calc'!A0");
    expect(neutralizeFormula('Normal İşletme')).toBe('Normal İşletme');
  });

  it('Telefon numaralarını değiştirmemelidir', () => {
    expect(neutralizeFormula('+90 312 000 00 01')).toBe('+90 312 000 00 01');
  });

  it('Hücreleri tırnak içine almalı ve tırnakları kaçırmalıdır', () => {
    expect(toCsvCell('a "b" c')).toBe('"a ""b"" c"');
    expect(toCsvCell(null)).toBe('""');
    expect(toCsvRow(['=1+1', 4.5])).toBe('"\'=1+1","4.5"');
  });
});
