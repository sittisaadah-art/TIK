import { ExamSubmission } from '../types/assessment';
import { INITIAL_DEMO_SUBMISSIONS } from '../data/demoData';

const LOCAL_STORAGE_KEY = 'sma_x_bab1_submissions';
const LOCAL_STORAGE_INIT_KEY = 'sma_x_bab1_initialized_v4';

// Helper to initialize local storage with demo submissions if empty
function getLocalSubmissions(): ExamSubmission[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse local storage submissions:', e);
  }

  // If first time, load demo submissions
  const initialized = localStorage.getItem(LOCAL_STORAGE_INIT_KEY);
  if (!initialized) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_SUBMISSIONS));
    localStorage.setItem(LOCAL_STORAGE_INIT_KEY, 'true');
    return INITIAL_DEMO_SUBMISSIONS;
  }
  return [];
}

function saveLocalSubmissions(subs: ExamSubmission[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(subs));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export const apiService = {
  // Fetch all submissions
  async getAllSubmissions(): Promise<ExamSubmission[]> {
    try {
      const response = await fetch('/api/submissions');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          saveLocalSubmissions(data);
          return data;
        }
      }
    } catch (err) {
      console.warn('API fetch failed, falling back to local storage:', err);
    }
    return getLocalSubmissions();
  },

  // Save or update submission
  async saveSubmission(submission: ExamSubmission): Promise<ExamSubmission> {
    // Update local cache first
    const list = getLocalSubmissions();
    const idx = list.findIndex(s => s.id === submission.id);
    if (idx >= 0) {
      list[idx] = submission;
    } else {
      list.unshift(submission);
    }
    saveLocalSubmissions(list);

    // Sync to backend API
    try {
      await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
    } catch (err) {
      console.warn('Server sync failed, saved locally:', err);
    }

    return submission;
  },

  // Teacher review/override essay score
  async reviewEssayScore(
    submissionId: string,
    essayScores: Record<number, number>,
    teacherNotes?: string
  ): Promise<ExamSubmission | null> {
    const list = getLocalSubmissions();
    const sub = list.find(s => s.id === submissionId);
    if (!sub) return null;

    sub.essayScores = essayScores;
    sub.scoreEssay = Object.values(essayScores).reduce((a, b) => a + Number(b), 0);
    sub.totalScore = sub.scorePG + sub.scoreEssay;
    sub.verifiedByTeacher = true;
    if (teacherNotes !== undefined) {
      sub.teacherNotes = teacherNotes;
    }
    saveLocalSubmissions(list);

    try {
      await fetch(`/api/submissions/${submissionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ essayScores, teacherNotes, verifiedByTeacher: true }),
      });
    } catch (err) {
      console.warn('Server review sync failed:', err);
    }

    return sub;
  },

  // Teacher unlock student who was locked due to cheat warnings
  async unlockStudent(submissionId: string): Promise<ExamSubmission | null> {
    const list = getLocalSubmissions();
    const sub = list.find(s => s.id === submissionId);
    if (!sub) return null;

    sub.status = 'IN_PROGRESS';
    sub.tabViolations = 0; // reset violation count so student can continue
    saveLocalSubmissions(list);

    try {
      await fetch(`/api/submissions/${submissionId}/unlock`, {
        method: 'POST',
      });
    } catch (err) {
      console.warn('Server unlock sync failed:', err);
    }

    return sub;
  },

  // Delete submission
  async deleteSubmission(submissionId: string): Promise<boolean> {
    const list = getLocalSubmissions().filter(s => s.id !== submissionId);
    saveLocalSubmissions(list);

    try {
      await fetch(`/api/submissions/${submissionId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Server delete sync failed:', err);
    }
    return true;
  },

  // Reset database with demo data
  async resetToDemo(): Promise<ExamSubmission[]> {
    saveLocalSubmissions(INITIAL_DEMO_SUBMISSIONS);
    try {
      await fetch('/api/submissions/seed-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleSubmissions: INITIAL_DEMO_SUBMISSIONS }),
      });
    } catch (err) {
      console.warn('Reset sync failed:', err);
    }
    return INITIAL_DEMO_SUBMISSIONS;
  },

  // Clear all data
  async clearAll(): Promise<void> {
    saveLocalSubmissions([]);
    try {
      await fetch('/api/submissions/reset', { method: 'POST' });
    } catch (err) {
      console.warn('Clear all sync failed:', err);
    }
  },
};
