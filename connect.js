const config = require("./config");
// eslint-disable-next-line no-unused-vars
const { dbUrl } = config;

const { MongoClient } = require("mongodb");

const client = new MongoClient(config.dbUrl);
// TODO Conexión a la Base de Datos
async function connect() {
  try {
    await client.connect();
    const db = client.db("burger_queen"); // Reemplaza <NOMBRE_DB> por el nombre del db
    console.log("Conectada a la BD");
    return db;
  } catch (error) {
    console.error(error);
  }
}

module.exports = { connect };
