import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Absolute path where the agent server writes the generated proposal
const AGENT_DOC_PATH = path.resolve(
  __dirname,
  '../agent_server/proposal_techcorp.docx'
);

const DOC_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export default defineConfig({
  plugins: [
    react(),
    // ── Serve agent-generated .docx directly from disk ──────────────────────
    // GET /agent-doc/proposal.docx reads the file fresh on every request so
    // the browser always gets the latest generation without any extra server.
    {
      name: 'serve-agent-doc',
      configureServer(server) {
        server.middlewares.use('/agent-doc/proposal.docx', (_req, res) => {
          if (!fs.existsSync(AGENT_DOC_PATH)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Document not yet generated' }));
            return;
          }
          const buf = fs.readFileSync(AGENT_DOC_PATH);
          res.writeHead(200, {
            'Content-Type': DOC_MIME,
            'Content-Length': buf.length,
            'Content-Disposition': 'inline; filename="proposal_techcorp.docx"',
            'Cache-Control': 'no-store', // always serve the latest file
          });
          res.end(buf);
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
