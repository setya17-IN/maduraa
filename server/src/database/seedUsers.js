import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import pool from '../config/db.js';
import { hashPassword } from '../utils/authSecurity.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const configuredUsers = (env = process.env) => {
  const users = [
    { role: 'owner', name: 'Owner', email: env.OWNER_EMAIL, password: env.OWNER_PASSWORD },
    { role: 'cashier', name: 'Cashier', email: env.CASHIER_EMAIL, password: env.CASHIER_PASSWORD },
  ];

  for (const user of users) {
    if (
      typeof user.email !== 'string' ||
      user.email.length > 254 ||
      !emailPattern.test(user.email.trim())
    ) {
      throw new Error(`Email ${user.role.toUpperCase()}_EMAIL tidak valid atau belum diisi`);
    }
    if (
      typeof user.password !== 'string' ||
      user.password.length < 8 ||
      Buffer.byteLength(user.password, 'utf8') > 72
    ) {
      throw new Error(
        `Password ${user.role.toUpperCase()}_PASSWORD harus berisi 8–72 byte UTF-8`,
      );
    }
    user.email = user.email.trim().toLowerCase();
  }

  if (users[0].email === users[1].email) {
    throw new Error('OWNER_EMAIL dan CASHIER_EMAIL harus berbeda');
  }
  return users;
};

export const seedUsers = async ({ db = pool, users = configuredUsers(), resetPassword = false } = {}) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('maduraa-seed-users'))");

    for (const user of users) {
      const existing = await client.query(
        'SELECT id, role FROM public.profiles WHERE LOWER(email) = $1 FOR UPDATE',
        [user.email],
      );

      if (existing.rows.length > 1) {
        throw new Error(`Lebih dari satu profil ditemukan untuk akun ${user.role}`);
      }

      if (existing.rows.length === 0) {
        const passwordHash = await hashPassword(user.password);
        await client.query(
          'INSERT INTO public.profiles (name, email, password, role) VALUES ($1, $2, $3, $4)',
          [user.name, user.email, passwordHash, user.role],
        );
        console.log(`Akun ${user.role} berhasil ditambahkan.`);
        continue;
      }

      const existingUser = existing.rows[0];
      if (existingUser.role !== user.role) {
        throw new Error(`Role profil yang sudah ada untuk akun ${user.role} tidak cocok`);
      }

      if (resetPassword) {
        const passwordHash = await hashPassword(user.password);
        await client.query('UPDATE public.profiles SET password = $1 WHERE id = $2', [
          passwordHash,
          existingUser.id,
        ]);
        console.log(`Password akun ${user.role} direset.`);
      } else {
        console.log(`Akun ${user.role} sudah ada; password tidak diubah.`);
      }
    }

    await client.query('COMMIT');
    console.log('Seeder akun owner dan cashier selesai.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const isDirectExecution =
  process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isDirectExecution) {
  const args = process.argv.slice(2);
  const unknownArgs = args.filter((arg) => arg !== '--reset-password');
  if (unknownArgs.length > 0) {
    console.error(`Argumen tidak dikenal: ${unknownArgs.join(', ')}`);
    process.exitCode = 1;
    await pool.end();
  } else {
    try {
      await seedUsers({ resetPassword: args.includes('--reset-password') });
    } catch (error) {
      console.error('Gagal melakukan seeding akun:', error.message);
      process.exitCode = 1;
    } finally {
      await pool.end();
    }
  }
}
