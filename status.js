require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkStatus() {
  const uri = process.env.MONGO_URI_FREE;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("📡 Conectado al cluster gratuito M0.\n");

    const adminDb = client.db().admin();
    const { databases } = await adminDb.listDatabases();

    console.log("Bases de datos encontradas:");
    for (const db of databases) {
      console.log(` • ${db.name} (Tamaño: ${(db.sizeOnDisk / 1024).toFixed(2)} KB)`);
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

checkStatus();