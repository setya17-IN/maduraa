import pool from '../config/db.js';

const seedProducts = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Serialize concurrent runs so sample products cannot be inserted twice.
    await client.query("SELECT pg_advisory_xact_lock(hashtext('maduraa-seed-products'))");
    // 1. Seed Categories
    const categories = [
      'Sembako',
      'Makanan Ringan & Instan',
      'Minuman',
      'Perawatan Tubuh',
      'Kebutuhan Rumah Tangga',
    ];

    const categoryMap = {};

    for (const catName of categories) {
      // Cek apakah kategori sudah ada
      let catResult = await client.query(
        'SELECT id FROM categories WHERE LOWER(name) = LOWER($1)',
        [catName],
      );

      if (catResult.rows.length === 0) {
        catResult = await client.query('INSERT INTO categories (name) VALUES ($1) RETURNING id', [
          catName,
        ]);
        console.log(`Kategori "${catName}" berhasil ditambahkan.`);
      } else {
        console.log(`Kategori "${catName}" sudah ada.`);
      }
      categoryMap[catName] = catResult.rows[0].id;
    }

    // 2. Seed Products
    const initialProducts = [
      {
        name: 'Beras Premium 5kg',
        category: 'Sembako',
        purchase_price: 60000.0,
        selling_price: 65000.0,
        stock: 25,
        unit: 'karung',
      },
      {
        name: 'Minyak Goreng 2 Liter',
        category: 'Sembako',
        purchase_price: 32000.0,
        selling_price: 36000.0,
        stock: 30,
        unit: 'pouch',
      },
      {
        name: 'Gula Pasir 1kg',
        category: 'Sembako',
        purchase_price: 15500.0,
        selling_price: 17500.0,
        stock: 40,
        unit: 'kg',
      },
      {
        name: 'Telur Ayam Ras 1kg',
        category: 'Sembako',
        purchase_price: 25000.0,
        selling_price: 28000.0,
        stock: 20,
        unit: 'kg',
      },
      {
        name: 'Indomie Goreng Special',
        category: 'Makanan Ringan & Instan',
        purchase_price: 3000.0,
        selling_price: 3500.0,
        stock: 100,
        unit: 'bungkus',
      },
      {
        name: 'Kopi Kapal Api Special 160g',
        category: 'Minuman',
        purchase_price: 12000.0,
        selling_price: 14000.0,
        stock: 35,
        unit: 'renceng',
      },
      {
        name: 'Teh Celup Sosro Box',
        category: 'Minuman',
        purchase_price: 7500.0,
        selling_price: 9000.0,
        stock: 45,
        unit: 'box',
      },
      {
        name: 'Sabun Mandi Cair Lifebuoy',
        category: 'Perawatan Tubuh',
        purchase_price: 15000.0,
        selling_price: 18000.0,
        stock: 25,
        unit: 'botol',
      },
      {
        name: 'Deterjen Rinso Molto 800g',
        category: 'Kebutuhan Rumah Tangga',
        purchase_price: 19000.0,
        selling_price: 22000.0,
        stock: 20,
        unit: 'pcs',
      },
    ];

    for (const product of initialProducts) {
      const categoryId = categoryMap[product.category];

      // Cek apakah produk dengan nama yang sama sudah ada
      const checkQuery = 'SELECT * FROM products WHERE name = $1';
      const existingProduct = await client.query(checkQuery, [product.name]);

      if (existingProduct.rows.length === 0) {
        const insertQuery = `
          INSERT INTO products (category_id, name, purchase_price, selling_price, stock, unit)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await client.query(insertQuery, [
          categoryId,
          product.name,
          product.purchase_price,
          product.selling_price,
          product.stock,
          product.unit,
        ]);
        console.log(`Produk "${product.name}" berhasil ditambahkan.`);
      } else {
        console.log(`Produk "${product.name}" sudah ada di database, melewati...`);
      }
    }

    await client.query('COMMIT');
    console.log('Seeder kategori dan produk Toko Madura selesai dijalankan.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Gagal melakukan seeding:', err.message);
  } finally {
    client.release();
    pool.end();
  }
};

seedProducts();
