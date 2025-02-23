const express = require("express");
const app = express();
const path = require("path");
const pg = require("pg");

// Create the client object for database connection
const client = new pg.Client({
  user: "postgres",
  host: "localhost",
  password: "Larry",
  port: 5432,
  database: "acme_Ice_Cream_db", // Connect to the already existing database
});

const init = async () => {
  try {
    // Connect directly to the database (without creating it)
    await client.connect();
    console.log("Connected to acme_Ice_Cream_db");

    // Create table and insert flavors
    let query = `
      CREATE TABLE IF NOT EXISTS flavors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        is_favorite BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client.query(query);
    console.log("Table created successfully");

    query = `
      INSERT INTO flavors (name, is_favorite) VALUES ('Vanilla', false)
      ON CONFLICT (name) DO NOTHING;
      INSERT INTO flavors (name, is_favorite) VALUES ('Chocolate', false)
      ON CONFLICT (name) DO NOTHING;
      INSERT INTO flavors (name, is_favorite) VALUES ('Strawberry', false)
      ON CONFLICT (name) DO NOTHING;
      INSERT INTO flavors (name, is_favorite) VALUES ('Cookies and Cream', false)
      ON CONFLICT (name) DO NOTHING;
    `;

    await client.query(query);
    console.log("Flavors inserted successfully");
  } catch (err) {
    console.log("Error during initialization:", err);
    await client.end();
  }
};

app.use(express.json());

// API routes
app.get("/api/flavors", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM flavors");
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/api/flavors", async (req, res) => {
    try {
      const result = await client.query("SELECT * FROM flavors");
      res.json(result.rows);
    } catch (err) {
      res.status(500).send(err);
    }
  });
  

app.post("/api/flavors", async (req, res) => {
  try {
    const { name, is_favorite } = req.body;
    const result = await client.query(
      "INSERT INTO flavors (name, is_favorite) VALUES ($1, $2) RETURNING *",
      [name, is_favorite]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.delete("/api/flavors/:id", async (req, res) => {
  try {
    await client.query("DELETE FROM flavors WHERE id = $1", [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).send(err);
  }
});

app.put("/api/flavors/:id", async (req, res) => {
  try {
    const { name, is_favorite } = req.body;
    const result = await client.query(
      "UPDATE flavors SET name = $1, is_favorite = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
      [name, is_favorite, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Catch-all route for handling 404 errors
app.use((req, res, next) => {
  res.status(404).send("Resource not found");
});

// Initialize the database and start the server
init();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
