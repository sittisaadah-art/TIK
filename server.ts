import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure database file exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DatabaseSchema {
  submissions: any[];
  lastUpdated: string;
}

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading database:', err);
  }
  return {
    submissions: [],
    lastUpdated: new Date().toISOString(),
  };
}

function saveDatabase(data: DatabaseSchema): void {
  try {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // API Endpoints
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get all submissions (for Teacher Dashboard)
  app.get('/api/submissions', (req, res) => {
    const db = loadDatabase();
    res.json(db.submissions);
  });

  // Get single submission by ID
  app.get('/api/submissions/:id', (req, res) => {
    const db = loadDatabase();
    const submission = db.submissions.find(s => s.id === req.params.id);
    if (!submission) {
      return res.status(404).json({ error: 'Data ujian tidak ditemukan' });
    }
    res.json(submission);
  });

  // Create or update a submission (student progress / submit)
  app.post('/api/submissions', (req, res) => {
    const db = loadDatabase();
    const newSubmission = req.body;

    if (!newSubmission || !newSubmission.id) {
      return res.status(400).json({ error: 'Data submission tidak valid' });
    }

    const existingIndex = db.submissions.findIndex(s => s.id === newSubmission.id);
    if (existingIndex >= 0) {
      db.submissions[existingIndex] = {
        ...db.submissions[existingIndex],
        ...newSubmission,
        updatedAt: new Date().toISOString(),
      };
    } else {
      db.submissions.unshift({
        ...newSubmission,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    saveDatabase(db);
    res.json({ success: true, submission: newSubmission });
  });

  // Teacher override or review essay scores
  app.post('/api/submissions/:id/review', (req, res) => {
    const db = loadDatabase();
    const submission = db.submissions.find(s => s.id === req.params.id);
    if (!submission) {
      return res.status(404).json({ error: 'Data ujian tidak ditemukan' });
    }

    const { essayScores, teacherNotes, verifiedByTeacher } = req.body;
    if (essayScores) {
      submission.essayScores = essayScores;
      // recalculate total score
      const totalEssay = Object.values(essayScores).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
      submission.scoreEssay = totalEssay;
      submission.totalScore = (submission.scorePG || 0) + totalEssay;
    }
    if (teacherNotes !== undefined) {
      submission.teacherNotes = teacherNotes;
    }
    submission.verifiedByTeacher = verifiedByTeacher ?? true;
    submission.updatedAt = new Date().toISOString();

    saveDatabase(db);
    res.json({ success: true, submission });
  });

  // Teacher unlock student who was locked due to cheat warnings
  app.post('/api/submissions/:id/unlock', (req, res) => {
    const db = loadDatabase();
    const submission = db.submissions.find(s => s.id === req.params.id);
    if (!submission) {
      return res.status(404).json({ error: 'Data ujian tidak ditemukan' });
    }

    submission.status = 'IN_PROGRESS';
    submission.tabViolations = 0; // reset violations or allow continue
    submission.updatedAt = new Date().toISOString();

    saveDatabase(db);
    res.json({ success: true, submission });
  });

  // Delete a submission
  app.delete('/api/submissions/:id', (req, res) => {
    const db = loadDatabase();
    db.submissions = db.submissions.filter(s => s.id !== req.params.id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // Seed sample submissions for testing / teacher presentation
  app.post('/api/submissions/seed-demo', (req, res) => {
    const { sampleSubmissions } = req.body;
    if (Array.isArray(sampleSubmissions)) {
      const db = loadDatabase();
      // Merge keeping non-duplicates
      const existingIds = new Set(db.submissions.map(s => s.id));
      for (const item of sampleSubmissions) {
        if (!existingIds.has(item.id)) {
          db.submissions.push(item);
        }
      }
      saveDatabase(db);
      return res.json({ success: true, count: db.submissions.length });
    }
    res.status(400).json({ error: 'Invalid sample submissions array' });
  });

  // Reset all submissions (Teacher admin action)
  app.post('/api/submissions/reset', (req, res) => {
    const db: DatabaseSchema = {
      submissions: [],
      lastUpdated: new Date().toISOString(),
    };
    saveDatabase(db);
    res.json({ success: true });
  });

  // In development, hook Vite middleware; in production, serve built dist files
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
