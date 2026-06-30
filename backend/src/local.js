import app from "./server.js";
import { getDatabasePath } from "./database.js";

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Chybank API running on http://localhost:${port}`);
  console.log(`SQLite database: ${getDatabasePath()}`);
});
