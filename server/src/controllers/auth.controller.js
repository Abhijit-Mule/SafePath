import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function tokenFor(user) {
  if (!process.env.JWT_SECRET) throw Object.assign(new Error('JWT_SECRET is not configured'), { status: 500 });
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function cleanName(value) { return typeof value === 'string' ? value.trim() : ''; }
function cleanEmail(value) { return typeof value === 'string' ? value.trim().toLowerCase() : ''; }

export async function register(req, res, next) {
  try {
    const name = cleanName(req.body.name);
    const email = cleanEmail(req.body.email);
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (name.length < 2 || name.length > 80 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: 'Enter a valid name, email and an 8–128 character password' });
    }
    if (await User.exists({ email })) return res.status(409).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
}

export async function login(req, res, next) {
  try {
    const email = cleanEmail(req.body.email);
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Invalid email or password' });
    res.json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
}
