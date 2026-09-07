require('dotenv').config();
const { MongoClient } = require('mongodb');

const URI_ORIGEN = process.env.MONGO_URI_FLEX;
const URI_DESTINO = process.env.MONGO_URI_FREE;

const DBS_A_MIGRAR = ['ai-sdk', 'ai-sdk-persistence', 'institutional_trading_bot'];

async function migrar() {
  if (!URI_ORIGEN || !URI_DESTINO) {
    console.error("❌ Faltan definir MONGO_URI_FLEX o MONGO_URI_FREE en el archivo .env");
    process.exit(1);
  }

  const clienteOrigen = new MongoClient(URI_ORIGEN);
  const clienteDestino = new MongoClient(URI_DESTINO);

  try {
    console.log("⏳ Conectando a ambos clusters...");
    await clienteOrigen.connect();
    await clienteDestino.connect();
    console.log("✅ Conexión establecida.\n");

    for (const dbName of DBS_A_MIGRAR) {
      console.log(`📦 Procesando base de datos: ${dbName}`);
      const dbOrigen = clienteOrigen.db(dbName);
      const dbDestino = clienteDestino.db(dbName);

      const colecciones = await dbOrigen.listCollections().toArray();

      for (const colInfo of colecciones) {
        const colName = colInfo.name;
        if (colName.startsWith('system.')) continue;

        const docs = await dbOrigen.collection(colName).find({}).toArray();
        if (docs.length > 0) {
          // Si la colección ya existe en el destino, inserta los datos
          await dbDestino.collection(colName).insertMany(docs);
          console.log(`   └─ [OK] Colección '${colName}': ${docs.length} documentos migrados.`);
        } else {
          console.log(`   └─ [!] Colección '${colName}' estaba vacía.`);
        }
      }
    }

    console.log("\n🎉 ¡Migración completada con éxito al cluster gratuito!");
  } catch (error) {
    console.error("❌ Error durante la migración:", error);
  } finally {
    await clienteOrigen.close();
    await clienteDestino.close();
  }
}

migrar();