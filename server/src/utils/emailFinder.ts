/**
 * Helper utility to search the web using DuckDuckGo's HTML search 
 * and extract email addresses using regular expressions.
 */
export async function findEmail(businessName: string, city: string): Promise<string> {
  try {
    const query = encodeURIComponent(`${businessName} ${city} email e-posta`);
    const url = `https://html.duckduckgo.com/html/?q=${query}`;
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!res.ok) {
      return 'Bulunamadı';
    }
    
    const html = await res.text();
    
    // Regular expression to identify email formats
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = html.match(emailRegex);
    
    if (matches && matches.length > 0) {
      // Exclude matches that are search engine domains or non-business related formats
      const filtered = matches.filter(
        (email) => 
          !email.endsWith('duckduckgo.com') && 
          !email.endsWith('bootstrap.com') && 
          !email.endsWith('w3.org') &&
          !email.endsWith('sentry.io') &&
          !email.endsWith('google.com') &&
          !email.startsWith('info@bootstrap')
      );

      if (filtered.length > 0) {
        // Return unique match (lowercase)
        return filtered[0].toLowerCase();
      }
    }
    
    return 'Bulunamadı';
  } catch (error) {
    console.error('Error finding email for', businessName, error);
    return 'Bulunamadı';
  }
}
