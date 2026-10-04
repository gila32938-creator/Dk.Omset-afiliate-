import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parseAffiliateCommand } from './server-api.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API endpoint for Gemini command processing
app.post('/api/gemini/parse-command', async (req, res) => {
  try {
    const payload = req.body;
    const result = await parseAffiliateCommand(payload);
    res.json(result);
  } catch (error: any) {
    console.error('Server error in parse-command:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Serve frontend static build
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`DK Affiliate Manager Pro server running on http://0.0.0.0:${PORT}`);
});
