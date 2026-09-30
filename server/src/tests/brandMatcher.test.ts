import { describe, it, expect } from 'vitest';
import { matchesBrand, isChainBusiness } from '../utils/brandMatcher';

describe('Zincir marka eşleştirme (brandMatcher)', () => {
  it('Markayı tam kelime olarak eşleştirmelidir', () => {
    expect(matchesBrand('Starbucks Kızılay', 'Starbucks')).toBe(true);
    expect(matchesBrand("McDonald's Beşiktaş", "McDonald's")).toBe(true);
    expect(matchesBrand('FLO Ayakkabı Kızılay', 'FLO')).toBe(true);
    expect(matchesBrand('Burger King Tunalı', 'Burger King')).toBe(true);
  });

  it('Kısa marka adları bağımsız işletmeleri elememelidir', () => {
    expect(matchesBrand('Floransa Pastanesi', 'FLO')).toBe(false);
    expect(matchesBrand('Kaflo Kafe', 'FLO')).toBe(false);
    expect(matchesBrand('Mavişehir Fırını', 'Mavi')).toBe(false);
  });

  it('Türkçe büyük/küçük harf farklarını yok saymalıdır', () => {
    expect(matchesBrand('LC WAIKIKI KIZILAY', 'LC Waikiki')).toBe(true);
    expect(matchesBrand('DEFACTO İSTANBUL', 'DeFacto')).toBe(true);
  });

  it('isChainBusiness boş veya boşluk markaları yok saymalıdır', () => {
    expect(isChainBusiness('Örnek Kafe', ['   ', ''])).toBe(false);
    expect(isChainBusiness('Gratis Kızılay', ['Watsons', 'Gratis'])).toBe(true);
  });
});
