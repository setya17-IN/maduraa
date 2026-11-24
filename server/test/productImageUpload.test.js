import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';

process.env.DATABASE_URL ??= 'postgresql://test:test@127.0.0.1:5432/test';
process.env.JWT_SECRET ??= 'product-image-test-secret-at-least-32-characters';
process.env.SUPABASE_URL ??= 'https://project.supabase.co';

const [
  { default: app },
  { default: pool },
  { generateAuthToken },
  { productImageStorage, getPathFromPublicUrl },
] = await Promise.all([
  import('../src/app.js'),
  import('../src/config/db.js'),
  import('../src/utils/authSecurity.js'),
  import('../src/services/productImageStorage.js'),
]);

const productId = 'a3bb189e-8bf9-3888-9912-ace4e6543002';
const publicUrl =
  'https://project.supabase.co/storage/v1/object/public/product-images/products/test.png';
const pngBytes = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pWQAAAAASUVORK5CYII=',
  'base64',
);
const webpBytes = Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA', 'base64');

let server;
let baseUrl;
let queryBehavior;
let uploadBehavior;
let removeBehavior;
let removeOldBehavior;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api/v1/products`;
});

beforeEach((t) => {
  queryBehavior = async (query) => {
    if (query.includes('FROM products')) return { rows: [{ id: productId, image_url: null }] };
    if (query.includes('UPDATE products')) {
      return { rows: [{ id: productId, name: 'Produk Uji', image_url: publicUrl }] };
    }
    return { rows: [], rowCount: 0 };
  };
  uploadBehavior = async () => ({ path: 'products/new-image.png', publicUrl });
  removeBehavior = async () => {};
  removeOldBehavior = async () => {};

  t.mock.method(pool, 'query', async (query, ...args) => {
    if (typeof query === 'string' && query.includes('FROM revoked_tokens')) {
      return { rows: [], rowCount: 0 };
    }
    return queryBehavior(query, ...args);
  });
  t.mock.method(productImageStorage, 'upload', (...args) => uploadBehavior(...args));
  t.mock.method(productImageStorage, 'remove', (...args) => removeBehavior(...args));
  t.mock.method(productImageStorage, 'removeByPublicUrl', (...args) => removeOldBehavior(...args));
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  await pool.end();
});

const tokenFor = (role = 'owner') =>
  generateAuthToken({ id: productId, email: `${role}@example.com`, role });

const request = async ({
  id = productId,
  role = 'owner',
  token = true,
  file = pngBytes,
  filename = 'client-name.png',
  fields = {},
} = {}) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${tokenFor(role)}`;
  const form = new FormData();
  if (file !== null) form.append('image', new Blob([file]), filename);
  for (const [name, value] of Object.entries(fields)) form.append(name, value);
  return fetch(`${baseUrl}/${id}/image`, { method: 'POST', headers, body: form });
};

describe('product image upload endpoint', () => {
  it('extracts a path from a valid product image URL', () => {
    assert.equal(getPathFromPublicUrl(publicUrl), 'products/test.png');
  });

  it('rejects a URL with a different Supabase origin', () => {
    assert.equal(
      getPathFromPublicUrl(
        'https://other.supabase.co/storage/v1/object/public/product-images/products/test.png',
      ),
      null,
    );
  });

  it('rejects a URL for another storage bucket', () => {
    assert.equal(
      getPathFromPublicUrl(
        'https://project.supabase.co/storage/v1/object/public/other-bucket/products/test.png',
      ),
      null,
    );
  });

  it('rejects a trailing slash, traversal path, and invalid URL', () => {
    assert.equal(
      getPathFromPublicUrl('https://project.supabase.co/storage/v1/object/public/product-images/'),
      null,
    );
    assert.equal(
      getPathFromPublicUrl(
        'https://project.supabase.co/storage/v1/object/public/product-images/products/..%2Fsecret.png',
      ),
      null,
    );
    assert.equal(getPathFromPublicUrl('not a URL'), null);
  });

  it('uploads an image, stores its public URL, and returns the updated product', async () => {
    let uploaded;
    uploadBehavior = async (options) => {
      uploaded = options;
      return { path: 'products/generated.png', publicUrl };
    };
    const response = await request();
    const body = await response.json();

    assert.equal(response.status, 200, JSON.stringify(body));
    assert.equal(body.status, 'success');
    assert.equal(body.data.image_url, publicUrl);
    assert.equal(uploaded.contentType, 'image/png');
    assert.equal(uploaded.extension, 'png');
    assert.equal(productImageStorage.remove.mock.calls.length, 0);
  });

  it('returns 413 when the parser receives a file larger than 2 MB', async () => {
    const response = await request({ file: Buffer.alloc(2 * 1024 * 1024 + 1) });
    assert.equal(response.status, 413);
    assert.equal((await response.json()).status, 'error');
    assert.equal(productImageStorage.upload.mock.calls.length, 0);
  });

  it('accepts a file exactly 2 MB in size', async () => {
    const exactSizeImage = Buffer.concat([
      pngBytes,
      Buffer.alloc(2 * 1024 * 1024 - pngBytes.length),
    ]);
    const response = await request({ file: exactSizeImage });
    assert.equal(response.status, 200);
  });

  it('returns 400 for a text file named with a .jpg extension', async () => {
    const response = await request({ file: Buffer.from('plain text'), filename: 'image.jpg' });
    assert.equal(response.status, 400);
  });

  it('returns 400 for a WEBP image', async () => {
    const response = await request({ file: webpBytes, filename: 'image.webp' });
    assert.equal(response.status, 400);
    assert.equal(productImageStorage.upload.mock.calls.length, 0);
  });

  it('returns 400 when a text field is included with the file', async () => {
    const response = await request({ fields: { extra: 'value' } });
    assert.equal(response.status, 400);
  });

  it('rejects PDF, GIF, SVG, and other non-supported file signatures', async () => {
    const unsupported = [
      Buffer.from('%PDF-1.7\n'),
      Buffer.from('GIF89a'),
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
    ];
    for (const bytes of unsupported) {
      const response = await request({ file: bytes });
      assert.equal(response.status, 400);
    }
  });

  it('returns 400 when the image field is missing', async () => {
    const response = await request({ file: null });
    assert.equal(response.status, 400);
  });

  it('returns 404 when the product does not exist', async () => {
    queryBehavior = async (query) =>
      query.includes('FROM products') ? { rows: [] } : { rows: [] };
    const response = await request();
    assert.equal(response.status, 404);
    assert.equal(productImageStorage.upload.mock.calls.length, 0);
  });

  it('returns 400 for an invalid product UUID', async () => {
    const response = await request({ id: 'not-a-uuid' });
    assert.equal(response.status, 400);
  });

  it('requires a token and denies the cashier role', async () => {
    assert.equal((await request({ token: false })).status, 401);
    assert.equal((await request({ role: 'cashier' })).status, 403);
  });

  it('returns 502 for storage failures without exposing provider details', async () => {
    uploadBehavior = async () => {
      throw new Error('provider secret detail');
    };
    const response = await request();
    assert.equal(response.status, 502);
    assert.equal((await response.text()).includes('provider secret detail'), false);
  });

  it('removes an uploaded object if the database update fails', async () => {
    queryBehavior = async (query) => {
      if (query.includes('FROM products')) return { rows: [{ id: productId, image_url: null }] };
      throw new Error('database detail');
    };
    const response = await request();
    assert.equal(response.status, 500);
    assert.deepEqual(productImageStorage.remove.mock.calls[0].arguments, [
      'products/new-image.png',
    ]);
    assert.equal((await response.text()).includes('database detail'), false);
  });

  it('removes the previous image after the database update succeeds', async () => {
    const previousUrl =
      'https://project.supabase.co/storage/v1/object/public/product-images/products/old.png';
    queryBehavior = async (query) => {
      if (query.includes('FROM products'))
        return { rows: [{ id: productId, image_url: previousUrl }] };
      return { rows: [{ id: productId, image_url: publicUrl }] };
    };
    const response = await request();
    assert.equal(response.status, 200);
    assert.deepEqual(productImageStorage.removeByPublicUrl.mock.calls[0].arguments, [previousUrl]);
  });

  it('detects the file extension without relying on the client filename', async () => {
    let uploaded;
    uploadBehavior = async (options) => {
      uploaded = options;
      return { path: 'products/generated.png', publicUrl };
    };
    const response = await request({ filename: 'no-extension' });
    assert.equal(response.status, 200);
    assert.equal(uploaded.extension, 'png');
  });

  it('keeps the success response when removing the old image fails', async () => {
    queryBehavior = async (query) => {
      if (query.includes('FROM products'))
        return { rows: [{ id: productId, image_url: publicUrl }] };
      return { rows: [{ id: productId, image_url: publicUrl }] };
    };
    removeOldBehavior = async () => {
      throw new Error('provider detail');
    };
    const response = await request();
    assert.equal(response.status, 200);
  });
});
