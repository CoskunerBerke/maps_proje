import { describe, it, expect } from 'vitest';
import { escapeHtml, safeHttpUrl, sanitizePhone } from '../utils/html';
import { buildFallbackHtml, buildReviewsSection } from '../services/aiWebsiteService';

const XSS_NAME = '<img src=x onerror="alert(1)">Kötü İşletme';

describe('HTML kaçış yardımcıları', () => {
  it('escapeHtml özel karakterleri kaçırmalıdır', () => {
    expect(escapeHtml(`<a href="x" onclick='y'>&\``)).toBe('&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&#96;');
    expect(escapeHtml(null)).toBe('');
  });

  it('safeHttpUrl yalnızca http(s) adreslerine izin vermelidir', () => {
    expect(safeHttpUrl('https://maps.google.com/?cid=1')).toBe('https://maps.google.com/?cid=1');
    expect(safeHttpUrl('javascript:alert(1)', 'https://fallback.example/')).toBe('https://fallback.example/');
    expect(safeHttpUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    expect(safeHttpUrl(null, 'x')).toBe('x');
  });

  it('sanitizePhone tel: bağlantısı için güvenli karakterleri bırakmalıdır', () => {
    expect(sanitizePhone('+90 312 000 00 01')).toBe('+90 312 000 00 01');
    expect(sanitizePhone('0312" onmouseover="alert(1)')).toBe('0312 (1)');
  });
});

describe('Demo site üretimi XSS koruması', () => {
  const baseParams = {
    businessName: XSS_NAME,
    category: 'cafe',
    address: 'Örnek Mah. <script>alert("adres")</script> Sk. No:1',
    phone: '0312 000 00 01"><script>alert(2)</script>',
    rating: 4.6,
    reviewsCount: 12,
    geminiApiKey: 'test',
    vercelToken: 'test',
    googleMapsUri: 'javascript:alert(3)',
    downloadedPhotos: [],
  };

  it('Yedek şablon işletme adını, adresi ve telefonu kaçırmalıdır', () => {
    const html = buildFallbackHtml(baseParams);
    expect(html).not.toContain('<img src=x onerror');
    expect(html).not.toContain('<script>alert("adres")</script>');
    expect(html).not.toContain('<script>alert(2)</script>');
    expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;Kötü İşletme');
  });

  it('Yedek şablon javascript: harita linkini kullanmamalıdır', () => {
    const html = buildFallbackHtml(baseParams);
    expect(html).not.toContain('javascript:alert(3)');
    expect(html).toContain('https://www.google.com/maps/search/?api=1&amp;query=');
  });

  it('Google yorumları karuseli yorum metnini ve yazar adını kaçırmalıdır', () => {
    const html = buildReviewsSection([
      {
        authorName: '<b onmouseover="alert(4)">Ali</b>',
        rating: 5,
        text: 'Harika hizmet! <script>alert(5)</script> $& $\' fiyatlar uygun',
      },
    ]);
    expect(html).not.toContain('<script>alert(5)</script>');
    expect(html).not.toContain('<b onmouseover');
    expect(html).toContain('&lt;script&gt;alert(5)&lt;/script&gt;');
    expect(html).toContain('★★★★★');
  });

  it('Yorum olmadığında boş string dönmelidir', () => {
    expect(buildReviewsSection([])).toBe('');
    expect(buildReviewsSection([{ authorName: 'A', rating: 2, text: 'Kötü deneyim yaşadım burada' }])).toBe('');
  });
});
