const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
app.set('trust proxy', true);
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const PORT = Number(process.env.PORT || 10000);
const ROOT = __dirname;
const DATA_FILE = process.env.DATA_FILE || path.join(ROOT, 'data.json');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(ROOT, 'uploads');
const API_KEY = process.env.EARNZO_API_KEY || '';
const DATABASE_URL = process.env.DATABASE_URL || '';
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'earnzo-media';
const usePostgres = Boolean(DATABASE_URL);
const useCloudMedia = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const pool = usePostgres
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 5,
    })
  : null;

function initialDb() {
  return { profiles: [], posts: [], follows: [], likes: [], comments: [] };
}
function readDb() {
  try {
    if (!fs.existsSync(DATA_FILE)) return initialDb();
    return { ...initialDb(), ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) };
  } catch {
    return initialDb();
  }
}
function writeDb(db) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}
function id(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}
function publicBase(req) {
  return (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}

async function initPostgres() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      mobile TEXT,
      username TEXT,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS profiles_mobile_unique ON profiles(mobile) WHERE mobile IS NOT NULL AND mobile <> '';
    CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON profiles(username) WHERE username IS NOT NULL AND username <> '';

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      local_id TEXT,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);

    CREATE TABLE IF NOT EXISTS follows (
      follower_id TEXT NOT NULL,
      following_id TEXT NOT NULL,
      created_at BIGINT NOT NULL,
      PRIMARY KEY (follower_id, following_id)
    );

    CREATE TABLE IF NOT EXISTS likes (
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at BIGINT NOT NULL,
      PRIMARY KEY (post_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS likes_post_idx ON likes(post_id);

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS comments_post_idx ON comments(post_id, created_at);
  `);
  console.log('Earnzo Postgres schema ready.');
}

app.use((req, res, next) => {
  if (!API_KEY || req.path === '/health') return next();
  if (req.get('x-earnzo-key') !== API_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').slice(0, 10) || '.bin';
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 250 * 1024 * 1024 } });
app.use('/uploads', express.static(UPLOAD_DIR));

async function uploadToCloud(file) {
  if (!useCloudMedia) return null;
  const ext = path.extname(file.originalname || file.filename || '').slice(0, 10) || '.bin';
  const objectName = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${ext}`;
  const objectPath = `${encodeURIComponent(SUPABASE_STORAGE_BUCKET)}/${encodeURIComponent(objectName)}`;
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${objectPath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': file.mimetype || 'application/octet-stream',
      'x-upsert': 'false',
    },
    body: fs.createReadStream(file.path),
    duplex: 'half',
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Cloud media upload failed (${response.status}): ${text.slice(0, 300)}`);
  try { fs.unlinkSync(file.path); } catch {}
  return `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(SUPABASE_STORAGE_BUCKET)}/${encodeURIComponent(objectName)}`;
}

async function upsertProfileRecord(body) {
  const now = Date.now();
  if (!usePostgres) {
    const db = readDb();
    let profile = db.profiles.find((p) => p.mobile === body.mobile || (body.username && p.username === body.username));
    if (!profile) {
      profile = { id: id('usr'), createdAt: now };
      db.profiles.push(profile);
    }
    Object.assign(profile, body, { updatedAt: now });
    writeDb(db);
    return profile;
  }

  const existing = await pool.query(
    `SELECT id, data FROM profiles WHERE ($1 <> '' AND mobile = $1) OR ($2 <> '' AND username = $2) LIMIT 1`,
    [String(body.mobile || ''), String(body.username || '')]
  );
  const profileId = existing.rows[0]?.id || id('usr');
  const previous = existing.rows[0]?.data || {};
  const data = { ...previous, ...body, id: profileId, createdAt: previous.createdAt || now, updatedAt: now };
  await pool.query(
    `INSERT INTO profiles (id, mobile, username, data, created_at, updated_at)
     VALUES ($1,$2,$3,$4::jsonb,$5,$6)
     ON CONFLICT (id) DO UPDATE SET mobile=EXCLUDED.mobile, username=EXCLUDED.username, data=EXCLUDED.data, updated_at=EXCLUDED.updated_at`,
    [profileId, body.mobile || null, body.username || null, JSON.stringify(data), data.createdAt, now]
  );
  return data;
}

async function getFeedRecords() {
  if (!usePostgres) {
    const db = readDb();
    const commentsByPost = db.comments.reduce((acc, c) => {
      (acc[c.postId] ||= []).push(c.text);
      return acc;
    }, {});
    const likesByPost = db.likes.reduce((acc, l) => {
      acc[l.postId] = (acc[l.postId] || 0) + 1;
      return acc;
    }, {});
    return [...db.posts]
      .sort((a, b) => Number(b.createdAt || b.uploadedAt || 0) - Number(a.createdAt || a.uploadedAt || 0))
      .map((p) => ({ ...p, likes: likesByPost[p.id] || p.likes || 0, comments: commentsByPost[p.id] || p.comments || [] }));
  }

  const result = await pool.query(`
    SELECT p.data,
           COALESCE((SELECT COUNT(*)::int FROM likes l WHERE l.post_id = p.id), 0) AS like_count,
           COALESCE((SELECT json_agg(c.text ORDER BY c.created_at) FROM comments c WHERE c.post_id = p.id), '[]'::json) AS comment_list
    FROM posts p
    ORDER BY p.created_at DESC
    LIMIT 200
  `);
  return result.rows.map((row) => ({ ...row.data, likes: row.like_count, comments: row.comment_list || [] }));
}

async function createPostRecord(body) {
  const now = Date.now();
  const post = {
    ...body,
    id: id('post'),
    localId: body.localId || '',
    createdAt: now,
    likes: Number(body.likes || 0),
    views: Number(body.views || 0),
    comments: Array.isArray(body.comments) ? body.comments : [],
  };
  if (!usePostgres) {
    const db = readDb();
    db.posts.push(post);
    writeDb(db);
    return post;
  }
  await pool.query(
    `INSERT INTO posts (id, local_id, data, created_at) VALUES ($1,$2,$3::jsonb,$4)`,
    [post.id, post.localId, JSON.stringify(post), now]
  );
  return post;
}

app.get('/health', async (_req, res) => {
  let database = usePostgres ? 'postgres' : 'local-json';
  let databaseOk = true;
  if (pool) {
    try { await pool.query('SELECT 1'); } catch { databaseOk = false; }
  }
  res.json({
    ok: databaseOk,
    service: 'earnzo-backend',
    version: '0.2.0',
    database,
    mediaStorage: useCloudMedia ? 'cloud' : 'local-ephemeral',
  });
});

app.post('/v1/profiles/upsert', async (req, res, next) => {
  try {
    const body = req.body || {};
    const key = String(body.mobile || body.username || '').trim();
    if (!key) return res.status(400).json({ error: 'mobile or username required' });
    res.json(await upsertProfileRecord(body));
  } catch (e) { next(e); }
});

app.get('/v1/feed', async (_req, res, next) => {
  try { res.json({ posts: await getFeedRecords() }); } catch (e) { next(e); }
});

app.post('/v1/media', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file required' });
    const cloudUrl = await uploadToCloud(req.file);
    const url = cloudUrl || `${publicBase(req)}/uploads/${encodeURIComponent(req.file.filename)}`;
    res.json({ url, kind: req.body?.kind || 'file', size: req.file.size, storage: cloudUrl ? 'cloud' : 'local' });
  } catch (e) { next(e); }
});

app.post('/v1/posts', async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.title || !body.mediaType) return res.status(400).json({ error: 'title and mediaType required' });
    res.status(201).json(await createPostRecord(body));
  } catch (e) { next(e); }
});

app.post('/v1/posts/:id/like', async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = String(req.body?.userId || 'anonymous');
    if (!usePostgres) {
      const db = readDb();
      const index = db.likes.findIndex((x) => x.postId === postId && x.userId === userId);
      let liked = true;
      if (index >= 0) { db.likes.splice(index, 1); liked = false; }
      else db.likes.push({ id: id('like'), postId, userId, createdAt: Date.now() });
      writeDb(db);
      return res.json({ liked, likes: db.likes.filter((x) => x.postId === postId).length });
    }
    const existing = await pool.query('SELECT 1 FROM likes WHERE post_id=$1 AND user_id=$2', [postId, userId]);
    let liked = true;
    if (existing.rowCount) {
      await pool.query('DELETE FROM likes WHERE post_id=$1 AND user_id=$2', [postId, userId]);
      liked = false;
    } else {
      await pool.query('INSERT INTO likes (post_id,user_id,created_at) VALUES ($1,$2,$3)', [postId, userId, Date.now()]);
    }
    const count = await pool.query('SELECT COUNT(*)::int AS count FROM likes WHERE post_id=$1', [postId]);
    res.json({ liked, likes: count.rows[0].count });
  } catch (e) { next(e); }
});

app.post('/v1/posts/:id/comments', async (req, res, next) => {
  try {
    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ error: 'comment text required' });
    const comment = { id: id('cmt'), postId: req.params.id, userId: String(req.body?.userId || 'anonymous'), text, createdAt: Date.now() };
    if (!usePostgres) {
      const db = readDb(); db.comments.push(comment); writeDb(db);
    } else {
      await pool.query('INSERT INTO comments (id,post_id,user_id,text,created_at) VALUES ($1,$2,$3,$4,$5)', [comment.id, comment.postId, comment.userId, comment.text, comment.createdAt]);
    }
    res.status(201).json(comment);
  } catch (e) { next(e); }
});

app.post('/v1/follow', async (req, res, next) => {
  try {
    const followerId = String(req.body?.followerId || '').trim();
    const followingId = String(req.body?.followingId || '').trim();
    if (!followerId || !followingId) return res.status(400).json({ error: 'followerId and followingId required' });
    if (!usePostgres) {
      const db = readDb();
      const index = db.follows.findIndex((x) => x.followerId === followerId && x.followingId === followingId);
      let following = true;
      if (index >= 0) { db.follows.splice(index, 1); following = false; }
      else db.follows.push({ id: id('follow'), followerId, followingId, createdAt: Date.now() });
      writeDb(db);
      return res.json({ following });
    }
    const existing = await pool.query('SELECT 1 FROM follows WHERE follower_id=$1 AND following_id=$2', [followerId, followingId]);
    let following = true;
    if (existing.rowCount) {
      await pool.query('DELETE FROM follows WHERE follower_id=$1 AND following_id=$2', [followerId, followingId]);
      following = false;
    } else {
      await pool.query('INSERT INTO follows (follower_id,following_id,created_at) VALUES ($1,$2,$3)', [followerId, followingId, Date.now()]);
    }
    res.json({ following });
  } catch (e) { next(e); }
});

app.get('/v1/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    if (!q) return res.json({ profiles: [], posts: [] });
    if (!usePostgres) {
      const db = readDb();
      const profiles = db.profiles.filter((p) => `${p.name || ''} ${p.username || ''}`.toLowerCase().includes(q)).slice(0, 20);
      const posts = db.posts.filter((p) => `${p.title || ''} ${p.tags || ''} ${p.category || ''}`.toLowerCase().includes(q)).slice(0, 30);
      return res.json({ profiles, posts });
    }
    const needle = `%${q}%`;
    const [profilesResult, postsResult] = await Promise.all([
      pool.query(`SELECT data FROM profiles WHERE LOWER(COALESCE(data->>'name','') || ' ' || COALESCE(data->>'username','')) LIKE $1 LIMIT 20`, [needle]),
      pool.query(`SELECT data FROM posts WHERE LOWER(COALESCE(data->>'title','') || ' ' || COALESCE(data->>'tags','') || ' ' || COALESCE(data->>'category','')) LIKE $1 ORDER BY created_at DESC LIMIT 30`, [needle]),
    ]);
    res.json({ profiles: profilesResult.rows.map((r) => r.data), posts: postsResult.rows.map((r) => r.data) });
  } catch (e) { next(e); }
});

app.use((err, _req, res, _next) => {
  console.error('Earnzo backend error:', err);
  res.status(500).json({ error: err?.message || 'Internal server error' });
});

async function start() {
  if (pool) await initPostgres();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Earnzo backend listening on port ${PORT}`);
    console.log(`Database mode: ${usePostgres ? 'Postgres' : 'local JSON fallback'}`);
    console.log(`Media mode: ${useCloudMedia ? 'cloud storage' : 'local ephemeral fallback'}`);
  });
}

start().catch((err) => {
  console.error('Earnzo backend startup failed:', err);
  process.exit(1);
});
