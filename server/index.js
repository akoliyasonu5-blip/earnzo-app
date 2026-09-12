const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.set('trust proxy', true);
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const PORT = Number(process.env.PORT || 10000);
const ROOT = __dirname;
const DATA_FILE = process.env.DATA_FILE || path.join(ROOT, 'data.json');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(ROOT, 'uploads');
const API_KEY = process.env.EARNZO_API_KEY || '';
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

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

app.get('/health', (_req, res) => res.json({ ok: true, service: 'earnzo-backend', version: '0.1.0' }));

app.post('/v1/profiles/upsert', (req, res) => {
  const body = req.body || {};
  const key = String(body.mobile || body.username || '').trim();
  if (!key) return res.status(400).json({ error: 'mobile or username required' });
  const db = readDb();
  let profile = db.profiles.find((p) => p.mobile === body.mobile || (body.username && p.username === body.username));
  if (!profile) {
    profile = { id: id('usr'), createdAt: Date.now() };
    db.profiles.push(profile);
  }
  Object.assign(profile, body, { updatedAt: Date.now() });
  writeDb(db);
  res.json(profile);
});

app.get('/v1/feed', (_req, res) => {
  const db = readDb();
  const commentsByPost = db.comments.reduce((acc, c) => {
    (acc[c.postId] ||= []).push(c.text);
    return acc;
  }, {});
  const likesByPost = db.likes.reduce((acc, l) => {
    acc[l.postId] = (acc[l.postId] || 0) + 1;
    return acc;
  }, {});
  const posts = [...db.posts]
    .sort((a, b) => Number(b.createdAt || b.uploadedAt || 0) - Number(a.createdAt || a.uploadedAt || 0))
    .map((p) => ({ ...p, likes: likesByPost[p.id] || p.likes || 0, comments: commentsByPost[p.id] || p.comments || [] }));
  res.json({ posts });
});

app.post('/v1/media', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  const url = `${publicBase(req)}/uploads/${encodeURIComponent(req.file.filename)}`;
  res.json({ url, kind: req.body?.kind || 'file', size: req.file.size });
});

app.post('/v1/posts', (req, res) => {
  const body = req.body || {};
  if (!body.title || !body.mediaType) return res.status(400).json({ error: 'title and mediaType required' });
  const db = readDb();
  const post = {
    ...body,
    id: id('post'),
    localId: body.localId || '',
    createdAt: Date.now(),
    likes: Number(body.likes || 0),
    views: Number(body.views || 0),
    comments: Array.isArray(body.comments) ? body.comments : [],
  };
  db.posts.push(post);
  writeDb(db);
  res.status(201).json(post);
});

app.post('/v1/posts/:id/like', (req, res) => {
  const db = readDb();
  const postId = req.params.id;
  const userId = String(req.body?.userId || 'anonymous');
  const index = db.likes.findIndex((x) => x.postId === postId && x.userId === userId);
  let liked = true;
  if (index >= 0) {
    db.likes.splice(index, 1);
    liked = false;
  } else {
    db.likes.push({ id: id('like'), postId, userId, createdAt: Date.now() });
  }
  writeDb(db);
  res.json({ liked, likes: db.likes.filter((x) => x.postId === postId).length });
});

app.post('/v1/posts/:id/comments', (req, res) => {
  const text = String(req.body?.text || '').trim();
  if (!text) return res.status(400).json({ error: 'comment text required' });
  const db = readDb();
  const comment = { id: id('cmt'), postId: req.params.id, userId: String(req.body?.userId || 'anonymous'), text, createdAt: Date.now() };
  db.comments.push(comment);
  writeDb(db);
  res.status(201).json(comment);
});

app.post('/v1/follow', (req, res) => {
  const followerId = String(req.body?.followerId || '').trim();
  const followingId = String(req.body?.followingId || '').trim();
  if (!followerId || !followingId) return res.status(400).json({ error: 'followerId and followingId required' });
  const db = readDb();
  const index = db.follows.findIndex((x) => x.followerId === followerId && x.followingId === followingId);
  let following = true;
  if (index >= 0) {
    db.follows.splice(index, 1);
    following = false;
  } else {
    db.follows.push({ id: id('follow'), followerId, followingId, createdAt: Date.now() });
  }
  writeDb(db);
  res.json({ following });
});

app.get('/v1/search', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const db = readDb();
  if (!q) return res.json({ profiles: [], posts: [] });
  const profiles = db.profiles.filter((p) => `${p.name || ''} ${p.username || ''}`.toLowerCase().includes(q)).slice(0, 20);
  const posts = db.posts.filter((p) => `${p.title || ''} ${p.tags || ''} ${p.category || ''}`.toLowerCase().includes(q)).slice(0, 30);
  res.json({ profiles, posts });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Earnzo backend listening on port ${PORT}`);
});
