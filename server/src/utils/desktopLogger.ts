import path from 'path';
import os from 'os';
import fs from 'fs';

interface BusinessLogInfo {
  name: string;
  phone: string | null;
  email: string | null;
  demoWebsiteUrl: string;
}

/**
 * Appends a B2B lead generation entry to the "potansiyel-musteriler.txt" file on the user's Desktop.
 * Resolves standard, Turkish local, and OneDrive Desktop folders dynamically.
 * @returns The final absolute path of the written file.
 */
export function logToDesktop(info: BusinessLogInfo): string {
  const homeDir = os.homedir();
  
  // Possible Desktop directory paths in Windows
  const possiblePaths = [
    path.join(homeDir, 'Desktop'),
    path.join(homeDir, 'OneDrive', 'Masaüstü'),
    path.join(homeDir, 'OneDrive', 'Desktop'),
    path.join(homeDir, 'Masaüstü')
  ];

  let targetDesktopDir = possiblePaths[0];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      targetDesktopDir = p;
      break;
    }
  }

  const filePath = path.join(targetDesktopDir, 'potansiyel-musteriler.txt');
  
  const separator = '='.repeat(50);
  const entryDate = new Date().toLocaleString('tr-TR');
  
  const logContent = `
${separator}
İşletme Adı           : ${info.name}
Telefon Numarası       : ${info.phone || 'Girilmedi'}
E-posta Adresi         : ${info.email || 'Bulunamadı'}
Üretilen Web Sitesi    : ${info.demoWebsiteUrl}
Oluşturulma Tarihi     : ${entryDate}
${separator}
`;

  try {
    fs.appendFileSync(filePath, logContent, 'utf-8');
  } catch (error) {
    console.error('Masaüstüne dosya yazılamadı:', error);
    // If desktop fails, write to the server root directory as backup
    const backupPath = path.join(process.cwd(), 'potansiyel-musteriler.txt');
    fs.appendFileSync(backupPath, logContent, 'utf-8');
    return backupPath;
  }

  return filePath;
}
