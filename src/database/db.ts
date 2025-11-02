import { MongoClient, Db } from "mongodb";

let client: MongoClient;
let db: Db;

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://root:example@mongo:27017";

    client = new MongoClient(mongoURI);
    await client.connect();

    // Extract database name from URI or use default
    const dbName =
      mongoURI.split("/").pop()?.split("?").shift() || "data-scraping";
    db = client.db(dbName);

    console.log(
      `📦 MongoDB Connected: ${client.options.hosts?.[0]?.host}:${client.options.hosts?.[0]?.port}`
    );
    console.log(`📦 Database: ${db.databaseName}`);

    // Create indexes for better performance
    try {
      const contactsCollection = db.collection("contacts");
      await contactsCollection.createIndex({ type: 1, phase: 1 });
      await contactsCollection.createIndex({ phase: 1 });
      await contactsCollection.createIndex({ deliveredAt: 1 });
      // Note: contacts are shared/public - no userId index needed

      const userRecordsCollection = db.collection("user_records");
      await userRecordsCollection.createIndex({ userId: 1 });
      await userRecordsCollection.createIndex({ contactId: 1 });

      const usersCollection = db.collection("users");
      await usersCollection.createIndex({ email: 1 }, { unique: true });

      console.log("✅ Database indexes created");
    } catch (indexError) {
      console.warn(
        "⚠️ Warning: Could not create indexes (may already exist):",
        indexError
      );
    }

    client.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    client.on("close", () => {
      console.log("⚠️ MongoDB connection closed");
    });

    client.on("reconnect", () => {
      console.log("✅ MongoDB reconnected");
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

const getDB = (): Db => {
  if (!db) {
    throw new Error("Database not connected. Call connectDB() first.");
  }
  return db;
};

const closeDB = async (): Promise<void> => {
  if (client) {
    await client.close();
    console.log("📦 MongoDB connection closed");
  }
};

export { connectDB, getDB, closeDB };
