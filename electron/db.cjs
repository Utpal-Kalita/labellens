// LabelLens local database — SQLite via sql.js (WASM, zero native deps so the
// app installs and runs on Windows/macOS/Linux without build tools).
// All data stays on this machine. No raw video or facial images are stored.
const initSqlJs = require('sql.js');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS experiments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  objective TEXT DEFAULT '',
  product_category TEXT DEFAULT '',
  description TEXT DEFAULT '',
  participant_target INTEGER DEFAULT 5,
  status TEXT DEFAULT 'draft',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS packaging (
  id TEXT PRIMARY KEY,
  experiment_id TEXT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  image_path TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  experiment_id TEXT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  packaging_id TEXT REFERENCES packaging(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  instruction TEXT NOT NULL,
  expected_answer TEXT DEFAULT '',
  answer_type TEXT DEFAULT 'multiple_choice',
  options TEXT DEFAULT '[]',
  time_limit_s INTEGER DEFAULT 60,
  sort_order INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  experiment_id TEXT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  anonymous_code TEXT NOT NULL,
  consent_given INTEGER DEFAULT 0,
  consent_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  variant_order TEXT DEFAULT '[]',
  start_time TEXT,
  end_time TEXT,
  status TEXT DEFAULT 'started'
);
CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  packaging_id TEXT REFERENCES packaging(id) ON DELETE SET NULL,
  answer TEXT DEFAULT '',
  is_correct INTEGER,
  started_at TEXT,
  completed_at TEXT,
  completion_time_ms INTEGER,
  difficulty_rating INTEGER,
  difficulty_note TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS measurements (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  response_id TEXT REFERENCES responses(id) ON DELETE SET NULL,
  phase TEXT DEFAULT 'task',
  timestamp TEXT NOT NULL,
  pulse REAL,
  hrv_rmssd REAL,
  expression TEXT,
  expression_confidence REAL,
  blinking INTEGER,
  talking INTEGER,
  signal_quality TEXT,
  source TEXT DEFAULT 'live'
);
CREATE TABLE IF NOT EXISTS baselines (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  started_at TEXT,
  duration_s INTEGER,
  pulse_mean REAL,
  pulse_sd REAL,
  sample_count INTEGER
);
CREATE INDEX IF NOT EXISTS idx_meas_session ON measurements(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_resp_session ON responses(session_id);
`;

const DEFAULT_TASKS = [
  { title: 'Allergen identification', instruction: 'Find whether the product contains peanuts.', answer_type: 'multiple_choice', options: ['Contains peanuts', 'May contain traces', 'No peanuts', 'Not stated'] },
  { title: 'Sugar identification', instruction: 'Find the sugar content per 100 g.', answer_type: 'short_text', options: [] },
  { title: 'Serving size', instruction: 'Identify the serving size mentioned on the package.', answer_type: 'short_text', options: [] },
  { title: 'Ingredient identification', instruction: 'Find the first ingredient listed.', answer_type: 'short_text', options: [] },
  { title: 'Sodium comparison', instruction: 'Identify which of the two products contains less sodium.', answer_type: 'multiple_choice', options: ['Product A', 'Product B', 'Same', 'Cannot tell'] },
  { title: 'Expiry information', instruction: 'Find the best-before date.', answer_type: 'short_text', options: [] },
  { title: 'Nutrition comparison', instruction: 'Compare the protein content of the two products. Which has more protein?', answer_type: 'multiple_choice', options: ['Product A', 'Product B', 'Same', 'Cannot tell'] },
];

class DB {
  constructor(file) {
    this.file = file;
  }
  async init() {
    const SQL = await initSqlJs({
      locateFile: (f) => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', f),
    });
    if (fs.existsSync(this.file)) {
      this.db = new SQL.Database(fs.readFileSync(this.file));
    } else {
      this.db = new SQL.Database();
    }
    this.db.run('PRAGMA foreign_keys = ON;');
    this.db.run(SCHEMA);
    this.save();
    return this;
  }
  save() {
    const data = this.db.export();
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, Buffer.from(data));
  }
  run(sql, params = {}) { this.db.run(sql, params); this.save(); }
  get(sql, params = {}) {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const row = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return row;
  }
  all(sql, params = {}) {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }
}

function id() { return crypto.randomUUID(); }

function registerIpc(ipcMain, db, app) {
  const packagingDir = path.join(app.getPath('userData'), 'packaging');
  fs.mkdirSync(packagingDir, { recursive: true });

  ipcMain.handle('exp:create', (_e, exp) => {
    const eid = id();
    db.run(
      `INSERT INTO experiments (id,name,objective,product_category,description,participant_target,status)
       VALUES ($id,$name,$objective,$category,$description,$target,'active')`,
      { $id: eid, $name: exp.name, $objective: exp.objective || '', $category: exp.productCategory || '', $description: exp.description || '', $target: exp.participantTarget || 5 }
    );
    return { id: eid };
  });
  ipcMain.handle('exp:list', () => db.all(`
    SELECT e.*,
      (SELECT COUNT(*) FROM packaging p WHERE p.experiment_id=e.id) AS packaging_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.experiment_id=e.id) AS task_count,
      (SELECT COUNT(*) FROM sessions s JOIN participants pt ON pt.id=s.participant_id WHERE pt.experiment_id=e.id AND s.status='completed') AS completed_sessions
    FROM experiments e ORDER BY e.created_at DESC`));
  ipcMain.handle('exp:get', (_e, eid) => ({
    experiment: db.get('SELECT * FROM experiments WHERE id=$id', { $id: eid }),
    packaging: db.all('SELECT * FROM packaging WHERE experiment_id=$id', { $id: eid }),
    tasks: db.all('SELECT * FROM tasks WHERE experiment_id=$id ORDER BY sort_order', { $id: eid }),
  }));
  ipcMain.handle('exp:delete', (_e, eid) => {
    // Full cascade: study-material files, then every row tied to the experiment.
    for (const row of db.all('SELECT image_path FROM packaging WHERE experiment_id=$id', { $id: eid })) {
      if (row.image_path && fs.existsSync(row.image_path)) fs.unlinkSync(row.image_path);
    }
    const sessionIds = db.all('SELECT id FROM sessions WHERE experiment_id=$id', { $id: eid }).map(r => r.id);
    for (const sid of sessionIds) {
      db.run('DELETE FROM measurements WHERE session_id=$id', { $id: sid });
      db.run('DELETE FROM responses WHERE session_id=$id', { $id: sid });
      db.run('DELETE FROM baselines WHERE session_id=$id', { $id: sid });
    }
    db.run('DELETE FROM sessions WHERE experiment_id=$id', { $id: eid });
    db.run('DELETE FROM participants WHERE id NOT IN (SELECT participant_id FROM sessions)');
    db.run('DELETE FROM tasks WHERE experiment_id=$id', { $id: eid });
    db.run('DELETE FROM packaging WHERE experiment_id=$id', { $id: eid });
    db.run('DELETE FROM experiments WHERE id=$id', { $id: eid });
  });
  ipcMain.handle('exp:defaults', () => DEFAULT_TASKS);

  ipcMain.handle('pack:add', (_e, { experimentId, variantName, dataUrl }) => {
    const pid = id();
    const m = /^data:image\/(png|jpe?g|webp);base64,(.+)$/.exec(dataUrl || '');
    if (!m) throw new Error('Unsupported image format (use PNG, JPG or WebP)');
    const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
    const file = path.join(packagingDir, `${pid}.${ext}`);
    fs.writeFileSync(file, Buffer.from(m[2], 'base64'));
    db.run('INSERT INTO packaging (id,experiment_id,variant_name,image_path) VALUES ($id,$eid,$v,$p)',
      { $id: pid, $eid: experimentId, $v: variantName, $p: file });
    return { id: pid };
  });
  ipcMain.handle('pack:delete', (_e, pid) => {
    const row = db.get('SELECT image_path FROM packaging WHERE id=$id', { $id: pid });
    if (row && fs.existsSync(row.image_path)) fs.unlinkSync(row.image_path);
    db.run('DELETE FROM packaging WHERE id=$id', { $id: pid });
  });
  ipcMain.handle('pack:image', (_e, pid) => {
    const row = db.get('SELECT image_path FROM packaging WHERE id=$id', { $id: pid });
    if (!row || !fs.existsSync(row.image_path)) return null;
    const ext = path.extname(row.image_path).slice(1);
    const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    return `data:${mime};base64,${fs.readFileSync(row.image_path).toString('base64')}`;
  });

  ipcMain.handle('task:add', (_e, t) => {
    const tid = id();
    const maxOrder = db.get('SELECT COALESCE(MAX(sort_order),-1)+1 AS n FROM tasks WHERE experiment_id=$e', { $e: t.experimentId });
    db.run(
      `INSERT INTO tasks (id,experiment_id,packaging_id,title,instruction,expected_answer,answer_type,options,time_limit_s,sort_order)
       VALUES ($id,$e,$p,$title,$ins,$exp,$type,$opts,$limit,$order)`,
      { $id: tid, $e: t.experimentId, $p: t.packagingId || null, $title: t.title, $ins: t.instruction,
        $exp: t.expectedAnswer || '', $type: t.answerType || 'short_text', $opts: JSON.stringify(t.options || []),
        $limit: t.timeLimitS || 60, $order: maxOrder.n }
    );
    return { id: tid };
  });
  ipcMain.handle('task:delete', (_e, tid) => db.run('DELETE FROM tasks WHERE id=$id', { $id: tid }));

  ipcMain.handle('session:start', (_e, { experimentId }) => {
    const variants = db.all('SELECT id FROM packaging WHERE experiment_id=$e', { $e: experimentId }).map(r => r.id);
    // Randomised variant order (reduces order effects) — PRD section 7.
    for (let i = variants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [variants[i], variants[j]] = [variants[j], variants[i]];
    }
    const pid = id();
    const code = 'P-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    db.run('INSERT INTO participants (id,experiment_id,anonymous_code) VALUES ($id,$e,$c)', { $id: pid, $e: experimentId, $c: code });
    const sid = id();
    db.run("INSERT INTO sessions (id,participant_id,variant_order,start_time,status) VALUES ($id,$p,$v,datetime('now'),'started')",
      { $id: sid, $p: pid, $v: JSON.stringify(variants) });
    return { sessionId: sid, participantId: pid, code, variantOrder: variants };
  });
  ipcMain.handle('session:consent', (_e, { participantId }) => {
    db.run("UPDATE participants SET consent_given=1, consent_at=datetime('now') WHERE id=$id", { $id: participantId });
  });
  ipcMain.handle('session:complete', (_e, { sessionId }) => {
    db.run("UPDATE sessions SET status='completed', end_time=datetime('now') WHERE id=$id", { $id: sessionId });
  });
  ipcMain.handle('session:abandon', (_e, { sessionId }) => {
    db.run("UPDATE sessions SET status='abandoned', end_time=datetime('now') WHERE id=$id", { $id: sessionId });
  });

  ipcMain.handle('resp:record', (_e, r) => {
    const rid = id();
    db.run(
      `INSERT INTO responses (id,session_id,task_id,packaging_id,answer,is_correct,started_at,completed_at,completion_time_ms,difficulty_rating,difficulty_note)
       VALUES ($id,$s,$t,$p,$a,$c,$sa,$ca,$ms,$d,$n)`,
      { $id: rid, $s: r.sessionId, $t: r.taskId, $p: r.packagingId || null, $a: r.answer ?? '',
        $c: r.isCorrect === null || r.isCorrect === undefined ? null : (r.isCorrect ? 1 : 0),
        $sa: r.startedAt, $ca: r.completedAt, $ms: r.completionTimeMs ?? null, $d: r.difficultyRating ?? null, $n: r.difficultyNote || '' }
    );
    return { id: rid };
  });

  ipcMain.handle('meas:batch', (_e, { sessionId, responseId, phase, source, rows }) => {
    const stmt = db.db.prepare(
      `INSERT INTO measurements (id,session_id,response_id,phase,timestamp,pulse,hrv_rmssd,expression,expression_confidence,blinking,talking,signal_quality,source)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    for (const m of rows) {
      stmt.run([id(), sessionId, responseId || null, phase || 'task', m.timestamp,
        m.pulse ?? null, m.hrvRmssd ?? null, m.expression ?? null, m.expressionConfidence ?? null,
        m.blinking === null || m.blinking === undefined ? null : (m.blinking ? 1 : 0),
        m.talking === null || m.talking === undefined ? null : (m.talking ? 1 : 0),
        m.signalQuality || null, source || 'live']);
    }
    stmt.free();
    db.save();
    return { inserted: rows.length };
  });

  ipcMain.handle('meas:assign', (_e, { sessionId, responseId, sinceIso }) => {
    db.run("UPDATE measurements SET response_id=$r WHERE session_id=$s AND response_id IS NULL AND phase='task' AND timestamp>=$t",
      { $r: responseId, $s: sessionId, $t: sinceIso });
  });

  ipcMain.handle('baseline:record', (_e, b) => {
    db.run(
      `INSERT INTO baselines (id,session_id,started_at,duration_s,pulse_mean,pulse_sd,sample_count)
       VALUES ($id,$s,$t,$d,$m,$sd,$n)`,
      { $id: id(), $s: b.sessionId, $t: b.startedAt, $d: b.durationS, $m: b.pulseMean ?? null, $sd: b.pulseSd ?? null, $n: b.sampleCount || 0 }
    );
  });

  ipcMain.handle('analytics:experiment', (_e, eid) => {
    const sessions = db.all(`
      SELECT s.*, pt.anonymous_code, pt.experiment_id FROM sessions s
      JOIN participants pt ON pt.id=s.participant_id WHERE pt.experiment_id=$e`, { $e: eid });
    const responses = db.all(`
      SELECT r.*, t.title AS task_title, t.instruction, t.expected_answer, p.variant_name FROM responses r
      JOIN sessions s ON s.id=r.session_id
      JOIN participants pt ON pt.id=s.participant_id
      JOIN tasks t ON t.id=r.task_id
      LEFT JOIN packaging p ON p.id=r.packaging_id
      WHERE pt.experiment_id=$e`, { $e: eid });
    const measStats = db.get(`
      SELECT COUNT(*) AS n, COUNT(pulse) AS pulse_n FROM measurements m
      JOIN sessions s ON s.id=m.session_id JOIN participants pt ON pt.id=s.participant_id
      WHERE pt.experiment_id=$e`, { $e: eid });
    return { sessions, responses, measStats };
  });
  ipcMain.handle('analytics:timeline', (_e, { sessionId, responseId }) => {
    return db.all(
      `SELECT * FROM measurements WHERE session_id=$s ${responseId ? 'AND response_id=$r' : ''} ORDER BY timestamp`,
      responseId ? { $s: sessionId, $r: responseId } : { $s: sessionId });
  });
  ipcMain.handle('session:listForExperiment', (_e, eid) => db.all(`
    SELECT s.id, s.status, s.start_time, s.end_time, pt.anonymous_code FROM sessions s
    JOIN participants pt ON pt.id=s.participant_id WHERE pt.experiment_id=$e ORDER BY s.start_time DESC`, { $e: eid }));
  ipcMain.handle('session:responses', (_e, sid) => db.all(`
    SELECT r.*, t.title AS task_title, p.variant_name FROM responses r
    JOIN tasks t ON t.id=r.task_id LEFT JOIN packaging p ON p.id=r.packaging_id
    WHERE r.session_id=$s ORDER BY r.completed_at`, { $s: sid }));
  ipcMain.handle('baseline:get', (_e, sid) => db.get('SELECT * FROM baselines WHERE session_id=$s ORDER BY started_at DESC LIMIT 1', { $s: sid }));

  // Data deletion — participant-level and experiment-level (PRD privacy section).
  ipcMain.handle('privacy:deleteSession', (_e, sid) => {
    db.run('DELETE FROM measurements WHERE session_id=$id', { $id: sid });
    db.run('DELETE FROM responses WHERE session_id=$id', { $id: sid });
    db.run('DELETE FROM baselines WHERE session_id=$id', { $id: sid });
    const row = db.get('SELECT participant_id FROM sessions WHERE id=$id', { $id: sid });
    db.run('DELETE FROM sessions WHERE id=$id', { $id: sid });
    if (row) db.run('DELETE FROM participants WHERE id=$id', { $id: row.participant_id });
  });
}

module.exports = { DB, registerIpc, DEFAULT_TASKS };
