import dotenv from 'dotenv';
import { createApp } from './app';
import { parseAllowedHosts } from './utils/localOnly';

// Load environment variables
dotenv.config();

const PORT = Number(process.env.PORT) || 3001;
// Local single-user tool: listen on the loopback interface only by default.
// Do NOT expose this server to a network - it has no login system.
const HOST = process.env.HOST || '127.0.0.1';
const ALLOWED_HOSTS = parseAllowedHosts(process.env.ALLOWED_HOSTS);

const app = createApp(ALLOWED_HOSTS);

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Server is running at http://${HOST}:${PORT}`);
});
