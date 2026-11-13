import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import type { FormQuestion, IdCardConfig, PlayerSubmission, Tournament } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1116';
const PORT = Number(process.env.PORT) || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const DB_PATH = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  tournaments: Tournament[];
  submissions: Record<string, PlayerSubmission[]>; // keyed by tournamentId
  sequenceCounters: Record<string, number>; // keyed by tournamentId
}

function ensureDirectories() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

function createDefaultQuestions(): FormQuestion[] {
  return [
    {
      id: 'q_full_name',
      label: 'Player Full Name',
      type: 'short_text',
      required: true,
      placeholder: 'Enter your full name as per ID',
      helperText: 'Printed on your Official Player ID Card',
      showOnIdCard: true,
    },
    {
      id: 'q_mobile',
      label: 'Mobile / WhatsApp Number',
      type: 'phone',
      required: true,
      placeholder: '10-digit mobile number',
      helperText: 'Used for match updates & one-registration-per-phone verification',
      showOnIdCard: true,
    },
    {
      id: 'q_role',
      label: 'Playing Role',
      type: 'radio',
      required: true,
      options: ['Batsman', 'Bowler', 'All-Rounder', 'Wicketkeeper-Batsman'],
      showOnIdCard: true,
    },
    {
      id: 'q_batting_style',
      label: 'Batting / Bowling Arm',
      type: 'dropdown',
      required: true,
      options: ['Right-Hand Bat / Right-Arm Pace', 'Right-Hand Bat / Right-Arm Spin', 'Left-Hand Bat / Left-Arm Pace', 'Left-Hand Bat / Left-Arm Spin', 'Specialist Batsman', 'Specialist Bowler'],
      showOnIdCard: false,
    },
    {
      id: 'q_jersey_size',
      label: 'Jersey Size',
      type: 'dropdown',
      required: true,
      options: ['S (36)', 'M (38)', 'L (40)', 'XL (42)', 'XXL (44)', '3XL (46)'],
      showOnIdCard: true,
    },
    {
      id: 'q_jersey_no',
      label: 'Preferred Jersey Number',
      type: 'number',
      required: false,
      placeholder: 'e.g. 18, 45, 7',
      showOnIdCard: true,
    },
    {
      id: 'q_city',
      label: 'Village / City / Club Name',
      type: 'short_text',
      required: true,
      placeholder: 'e.g. Anand Strikers / Surat',
      showOnIdCard: true,
    },
    {
      id: 'q_age',
      label: 'Date of Birth',
      type: 'date',
      required: false,
      showOnIdCard: false,
    },
    {
      id: 'q_photo',
      label: 'Player Passport Photo',
      type: 'photo',
      required: true,
      helperText: 'Clear front-facing photo for your Player ID Card',
      showOnIdCard: true,
    },
  ];
}

function createSeedDatabase(): DatabaseSchema {
  const now = new Date().toISOString();
  const defaultQuestions = createDefaultQuestions();
  const idCardConfig: IdCardConfig = {
    theme: 'championship_gold',
    headerTitle: 'OFFICIAL PLAYER PASS',
    subtitle: 'Season 4 · Knockout Championship',
    footerNote: 'Valid for ground entry & auction verification',
    showPhoto: true,
    showPlayerCode: true,
    showQrCode: true,
    showTournamentBadge: true,
    showRegistrationDate: false,
    visibleFieldIds: defaultQuestions.filter((q) => q.showOnIdCard && q.type !== 'photo').map((q) => q.id),
  };

  const tId = 't_premier_s4';
  const tournament: Tournament = {
    id: tId,
    name: 'Premier Cricket Championship',
    season: 'Season 4 · 2026',
    organizer: 'District Cricket Association',
    venue: 'Sardar Patel Turf Ground',
    description: 'Official player registration for Season 4. Fill in accurate details and upload a clear photo for your automatic Player ID Card.',
    rules: `1. દરેક ખેલાડીએ મેચ શરૂ થવાના ૩૦ મિનિટ પહેલા ગ્રાઉન્ડ પર હાજર રહેવું ફરજિયાત છે.
2. ટૂર્નામેન્ટ દરમિયાન તમારું Official Player ID Card સાથે રાખવું જરૂરી રહેશે.
3. અમ્પાયર અને કમિટીનો નિર્ણય આખરી અને બંધનકર્તા રહેશે.
4. ગેરશિસ્ત કે ખોટી માહિતી બદલ ખેલાડીનું રજીસ્ટ્રેશન રદ થઈ શકે છે.`,
    prefixCode: 'PCC',
    appTheme: 'pitch_emerald',
    isOpen: true,
    archived: false,
    oneSubmissionPerPhone: true,
    createdAt: now,
    updatedAt: now,
    questions: defaultQuestions,
    idCardConfig,
  };

  return {
    tournaments: [tournament],
    submissions: {
      [tId]: [
        {
          id: 'p_demo_1',
          playerCode: 'PCC-001',
          tournamentId: tId,
          deviceId: 'seed_device_001',
          primaryPhone: '9876543210',
          answers: {
            q_full_name: 'Aarav Patel',
            q_mobile: '9876543210',
            q_role: 'All-Rounder',
            q_batting_style: 'Right-Hand Bat / Right-Arm Pace',
            q_jersey_size: 'L (40)',
            q_jersey_no: '18',
            q_city: 'Anand Warriors',
            q_age: '1999-05-14',
          },
          submittedAt: now,
          updatedAt: now,
          verified: true,
        },
        {
          id: 'p_demo_2',
          playerCode: 'PCC-002',
          tournamentId: tId,
          deviceId: 'seed_device_002',
          primaryPhone: '9825011223',
          answers: {
            q_full_name: 'Rohan Desai',
            q_mobile: '9825011223',
            q_role: 'Wicketkeeper-Batsman',
            q_batting_style: 'Left-Hand Bat / Left-Arm Spin',
            q_jersey_size: 'M (38)',
            q_jersey_no: '7',
            q_city: 'Surat Titans',
            q_age: '2001-08-22',
          },
          submittedAt: now,
          updatedAt: now,
          verified: true,
        },
      ],
    },
    sequenceCounters: {
      [tId]: 2,
    },
  };
}

let db: DatabaseSchema;

function loadDatabase(): DatabaseSchema {
  ensureDirectories();
  if (fs.existsSync(DB_PATH)) {
    try {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      const parsed = JSON.parse(raw) as DatabaseSchema;
      if (parsed && Array.isArray(parsed.tournaments)) {
        return {
          tournaments: parsed.tournaments,
          submissions: parsed.submissions || {},
          sequenceCounters: parsed.sequenceCounters || {},
        };
      }
    } catch (err) {
      console.error('Failed to read db.json, attempting backup recovery:', err);
      const backups = fs.readdirSync(BACKUPS_DIR).sort().reverse();
      for (const file of backups) {
        try {
          const rawBackup = fs.readFileSync(path.join(BACKUPS_DIR, file), 'utf8');
          const parsedBackup = JSON.parse(rawBackup) as DatabaseSchema;
          if (parsedBackup && Array.isArray(parsedBackup.tournaments)) {
            return parsedBackup;
          }
        } catch {
          // continue searching backups
        }
      }
    }
  }
  const seed = createSeedDatabase();
  saveDatabaseAtomic(seed);
  return seed;
}

let writeQueue = Promise.resolve();

function saveDatabaseAtomic(data: DatabaseSchema) {
  const tmpPath = `${DB_PATH}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data), 'utf8');
  fs.renameSync(tmpPath, DB_PATH);
}

function persistDatabase() {
  const snapshot = db;
  writeQueue = writeQueue.then(() => {
    saveDatabaseAtomic(snapshot);
  }).catch((err) => {
    console.error('Database write error:', err);
  });
}

function createBackupSnapshot(reason: string) {
  try {
    ensureDirectories();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeReason = reason.replace(/[^a-zA-Z0-9_-]/g, '_');
    const backupFile = path.join(BACKUPS_DIR, `backup_${stamp}_${safeReason}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(db), 'utf8');

    // Keep last 20 snapshots
    const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.json')).sort();
    while (files.length > 20) {
      const oldest = files.shift();
      if (oldest) {
        fs.unlinkSync(path.join(BACKUPS_DIR, oldest));
      }
    }
  } catch (err) {
    console.error('Backup snapshot failed:', err);
  }
}

function normalizePhone(input: unknown): string {
  if (typeof input !== 'string') return '';
  const digits = input.replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

function savePhotoIfDataUrl(tournamentId: string, playerId: string, val: unknown): string {
  if (typeof val !== 'string') return '';
  if (!val.startsWith('data:image/')) return val;

  const match = val.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
  if (!match) return val;

  const ext = match[1] === 'png' ? 'png' : match[1] === 'webp' ? 'webp' : 'jpg';
  const base64Data = match[2];
  const folder = path.join(UPLOADS_DIR, tournamentId.replace(/[^a-zA-Z0-9_-]/g, '_'));
  fs.mkdirSync(folder, { recursive: true });
  const filename = `${playerId.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.${ext}`;
  const fullPath = path.join(folder, filename);
  fs.writeFileSync(fullPath, Buffer.from(base64Data, 'base64'));
  return `/api/uploads/${tournamentId}/${filename}`;
}

function extractPrimaryPhone(tournament: Tournament, answers: Record<string, string | string[]>): string {
  const phoneQuestions = tournament.questions.filter((q) => q.type === 'phone');
  for (const pq of phoneQuestions) {
    const normalized = normalizePhone(answers[pq.id]);
    if (normalized) return normalized;
  }
  // Fallback: look for any answer key containing mobile/phone
  for (const [k, v] of Object.entries(answers)) {
    if (/mobile|phone|whatsapp/i.test(k)) {
      const normalized = normalizePhone(v);
      if (normalized) return normalized;
    }
  }
  return '';
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const pw = req.header('x-admin-password') || '';
  if (pw !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid admin password' });
  }
  next();
}

async function startServer() {
  db = loadDatabase();

  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Serve uploaded player photos with long cache headers
  app.use('/api/uploads', express.static(UPLOADS_DIR, { maxAge: '30d' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, tournaments: db.tournaments.length });
  });

  // Admin auth verification
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body || {};
    if (String(password || '').trim() === ADMIN_PASSWORD) {
      return res.json({ ok: true });
    }
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  });

  // List all tournaments (active + archived) with player counts
  app.get('/api/admin/tournaments', requireAdmin, (_req, res) => {
    const summaries = db.tournaments.map((t) => ({
      ...t,
      playerCount: (db.submissions[t.id] || []).length,
    }));
    res.json({ tournaments: summaries });
  });

  // Create tournament
  app.post('/api/admin/tournaments', requireAdmin, (req, res) => {
    const body = req.body || {};
    const now = new Date().toISOString();
    const id = `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const questions: FormQuestion[] = Array.isArray(body.questions) && body.questions.length > 0
      ? body.questions
      : createDefaultQuestions();

    const prefix = (String(body.prefixCode || 'CRK').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)) || 'CRK';

    const tournament: Tournament = {
      id,
      name: String(body.name || 'New Cricket Tournament').trim(),
      season: String(body.season || '2026 Edition').trim(),
      organizer: String(body.organizer || 'Tournament Committee').trim(),
      venue: String(body.venue || 'Main Cricket Ground').trim(),
      description: String(body.description || 'Official player registration form.').trim(),
      rules: body.rules !== undefined ? String(body.rules) : '',
      prefixCode: prefix,
      appTheme: body.appTheme || 'pitch_emerald',
      isOpen: body.isOpen !== undefined ? Boolean(body.isOpen) : true,
      archived: false,
      oneSubmissionPerPhone: body.oneSubmissionPerPhone !== undefined ? Boolean(body.oneSubmissionPerPhone) : true,
      createdAt: now,
      updatedAt: now,
      questions,
      idCardConfig: body.idCardConfig || {
        theme: 'championship_gold',
        headerTitle: 'OFFICIAL PLAYER PASS',
        subtitle: String(body.season || '2026 Edition').trim(),
        footerNote: 'Valid for official tournament matches',
        showPhoto: true,
        showPlayerCode: true,
        showQrCode: true,
        showTournamentBadge: true,
        showRegistrationDate: false,
        visibleFieldIds: questions.filter((q) => q.showOnIdCard && q.type !== 'photo').map((q) => q.id),
      },
    };

    db.tournaments.unshift(tournament);
    db.submissions[id] = [];
    db.sequenceCounters[id] = 0;
    persistDatabase();
    createBackupSnapshot('tournament_created');
    res.status(201).json({ tournament: { ...tournament, playerCount: 0 } });
  });

  // Update tournament (questions, theme, settings, id card config, archive)
  app.put('/api/admin/tournaments/:id', requireAdmin, (req, res) => {
    const idx = db.tournaments.findIndex((t) => t.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    const existing = db.tournaments[idx];
    const body = req.body || {};
    const updated: Tournament = {
      ...existing,
      ...body,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    db.tournaments[idx] = updated;
    persistDatabase();
    res.json({
      tournament: {
        ...updated,
        playerCount: (db.submissions[updated.id] || []).length,
      },
    });
  });

  // Delete tournament (creates automatic safety backup first)
  app.delete('/api/admin/tournaments/:id', requireAdmin, (req, res) => {
    const idx = db.tournaments.findIndex((t) => t.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    createBackupSnapshot(`pre_delete_${req.params.id}`);
    db.tournaments.splice(idx, 1);
    delete db.submissions[req.params.id];
    delete db.sequenceCounters[req.params.id];
    persistDatabase();
    res.json({ ok: true });
  });

  // Get all players for a tournament (supports fast search/pagination or full load)
  app.get('/api/admin/tournaments/:id/players', requireAdmin, (req, res) => {
    const tournament = db.tournaments.find((t) => t.id === req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    const players = db.submissions[tournament.id] || [];
    res.json({ players });
  });

  // Admin add player manually (walk-in / offline)
  app.post('/api/admin/tournaments/:id/players', requireAdmin, (req, res) => {
    const tournament = db.tournaments.find((t) => t.id === req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    const body = req.body || {};
    const answers = { ...(body.answers || {}) } as Record<string, string | string[]>;
    const playerId = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

    for (const q of tournament.questions) {
      if (q.type === 'photo' && answers[q.id]) {
        answers[q.id] = savePhotoIfDataUrl(tournament.id, playerId, answers[q.id]);
      }
    }

    const nextSeq = (db.sequenceCounters[tournament.id] || (db.submissions[tournament.id] || []).length) + 1;
    db.sequenceCounters[tournament.id] = nextSeq;
    const playerCode = `${tournament.prefixCode}-${String(nextSeq).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const submission: PlayerSubmission = {
      id: playerId,
      playerCode,
      tournamentId: tournament.id,
      deviceId: `admin_manual_${playerId}`,
      primaryPhone: extractPrimaryPhone(tournament, answers),
      answers,
      submittedAt: now,
      updatedAt: now,
      verified: true,
    };

    if (!db.submissions[tournament.id]) db.submissions[tournament.id] = [];
    db.submissions[tournament.id].unshift(submission);
    persistDatabase();
    res.status(201).json({ player: submission });
  });

  // Admin update player
  app.put('/api/admin/tournaments/:id/players/:playerId', requireAdmin, (req, res) => {
    const tournament = db.tournaments.find((t) => t.id === req.params.id);
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

    const list = db.submissions[tournament.id] || [];
    const idx = list.findIndex((p) => p.id === req.params.playerId);
    if (idx === -1) return res.status(404).json({ error: 'Player not found' });

    const existing = list[idx];
    const body = req.body || {};
    const answers = { ...(body.answers || existing.answers) } as Record<string, string | string[]>;

    for (const q of tournament.questions) {
      if (q.type === 'photo' && answers[q.id]) {
        answers[q.id] = savePhotoIfDataUrl(tournament.id, existing.id, answers[q.id]);
      }
    }

    const updated: PlayerSubmission = {
      ...existing,
      answers,
      primaryPhone: extractPrimaryPhone(tournament, answers),
      verified: body.verified !== undefined ? Boolean(body.verified) : existing.verified,
      playerCode: body.playerCode ? String(body.playerCode) : existing.playerCode,
      updatedAt: new Date().toISOString(),
    };

    list[idx] = updated;
    persistDatabase();
    res.json({ player: updated });
  });

  // Admin delete player (also frees up that phone/device to re-register if needed)
  app.delete('/api/admin/tournaments/:id/players/:playerId', requireAdmin, (req, res) => {
    const list = db.submissions[req.params.id];
    if (!list) return res.status(404).json({ error: 'Tournament not found' });
    const idx = list.findIndex((p) => p.id === req.params.playerId);
    if (idx === -1) return res.status(404).json({ error: 'Player not found' });

    list.splice(idx, 1);
    persistDatabase();
    res.json({ ok: true });
  });

  // Full backup JSON download
  app.get('/api/admin/backup', requireAdmin, (_req, res) => {
    res.setHeader('Content-Disposition', `attachment; filename="cricdesk_backup_${new Date().toISOString().slice(0, 10)}.json"`);
    res.json(db);
  });

  // Restore / merge backup JSON
  app.post('/api/admin/restore', requireAdmin, (req, res) => {
    const payload = req.body as DatabaseSchema;
    if (!payload || !Array.isArray(payload.tournaments)) {
      return res.status(400).json({ error: 'Invalid backup file format' });
    }
    createBackupSnapshot('pre_restore');

    const existingIds = new Set(db.tournaments.map((t) => t.id));
    for (const t of payload.tournaments) {
      if (!existingIds.has(t.id)) {
        db.tournaments.push(t);
        db.submissions[t.id] = payload.submissions?.[t.id] || [];
        db.sequenceCounters[t.id] = payload.sequenceCounters?.[t.id] || db.submissions[t.id].length;
      }
    }
    persistDatabase();
    res.json({ ok: true, tournamentCount: db.tournaments.length });
  });

  // PUBLIC PLAYER ENDPOINTS (no admin password needed)
  app.get('/api/public/tournaments/:id', (req, res) => {
    const tournament = db.tournaments.find((t) => t.id === req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament registration form not found' });
    }
    const deviceId = String(req.query.deviceId || '').trim();
    const list = db.submissions[tournament.id] || [];
    let existingSubmission: PlayerSubmission | null = null;

    if (tournament.oneSubmissionPerPhone && deviceId) {
      existingSubmission = list.find((p) => p.deviceId === deviceId) || null;
    }

    res.json({
      tournament,
      totalRegistered: list.length,
      existingSubmission,
    });
  });

  app.post('/api/public/tournaments/:id/submit', (req, res) => {
    const tournament = db.tournaments.find((t) => t.id === req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    if (!tournament.isOpen || tournament.archived) {
      return res.status(403).json({ error: 'Registration for this tournament is currently closed.' });
    }

    const body = req.body || {};
    const deviceId = String(body.deviceId || '').trim();
    const rawAnswers = (body.answers || {}) as Record<string, string | string[]>;
    const list = db.submissions[tournament.id] || [];

    // Validate required fields
    for (const q of tournament.questions) {
      if (q.required) {
        const val = rawAnswers[q.id];
        const empty =
          val === undefined ||
          val === null ||
          (typeof val === 'string' && val.trim() === '') ||
          (Array.isArray(val) && val.length === 0);
        if (empty) {
          return res.status(400).json({ error: `Please fill required field: ${q.label}` });
        }
      }
    }

    const primaryPhone = extractPrimaryPhone(tournament, rawAnswers);

    // One submission per phone/device check
    if (tournament.oneSubmissionPerPhone) {
      const byDevice = deviceId ? list.find((p) => p.deviceId === deviceId) : undefined;
      const byPhone = primaryPhone ? list.find((p) => p.primaryPhone && p.primaryPhone === primaryPhone) : undefined;
      const duplicate = byDevice || byPhone;
      if (duplicate) {
        return res.status(409).json({
          error: 'already_registered',
          message: 'This phone / mobile number has already submitted a registration for this tournament.',
          existingSubmission: duplicate,
        });
      }
    }

    const playerId = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const answers: Record<string, string | string[]> = { ...rawAnswers };

    for (const q of tournament.questions) {
      if (q.type === 'photo' && answers[q.id]) {
        answers[q.id] = savePhotoIfDataUrl(tournament.id, playerId, answers[q.id]);
      }
    }

    const nextSeq = (db.sequenceCounters[tournament.id] || list.length) + 1;
    db.sequenceCounters[tournament.id] = nextSeq;
    const playerCode = `${tournament.prefixCode}-${String(nextSeq).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const submission: PlayerSubmission = {
      id: playerId,
      playerCode,
      tournamentId: tournament.id,
      deviceId: deviceId || `anon_${playerId}`,
      primaryPhone,
      answers,
      submittedAt: now,
      updatedAt: now,
      verified: true,
    };

    if (!db.submissions[tournament.id]) db.submissions[tournament.id] = [];
    db.submissions[tournament.id].unshift(submission);
    persistDatabase();

    // Periodic automatic backup every 25 submissions
    if (db.submissions[tournament.id].length % 25 === 0) {
      createBackupSnapshot(`milestone_${db.submissions[tournament.id].length}`);
    }

    res.status(201).json({ submission });
  });

  // Vite or static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Daizy Cricket server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
