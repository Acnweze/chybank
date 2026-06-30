import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import {
  createAccount,
  createServiceRequest,
  createTransfer,
  findBeneficiaryByAccountNumber,
  findUserByCredentials,
  getAccountsByUserId,
  getCardsByUserId,
  getTransactionsByAccountId,
  initializeDatabase,
  registerUser,
  resetPassword,
  updateUserDocuments,
  verifyRegistration
} from "./database.js";

dotenv.config();
initializeDatabase();

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());
app.use((req, _res, next) => {
  if (req.url === "/api") req.url = "/";
  if (req.url.startsWith("/api/")) req.url = req.url.slice(4);
  next();
});

app.get("/", (req, res) => {
  res.json({
    app: "Chybank API",
    status: "running",
    frontend: "http://localhost:5173",
    endpoints: {
      health: "/health",
      login: "POST /auth/login",
      register: "POST /auth/register",
      verifyRegistration: "POST /auth/verify-registration",
      resetPassword: "POST /auth/reset-password",
      accounts: "GET /accounts/:userId",
      createAccount: "POST /accounts",
      beneficiaryLookup: "GET /beneficiaries/:accountNumber",
      transactions: "GET /transactions/:accountId",
      cards: "GET /cards/:userId",
      profileDocuments: "POST /profile/documents",
      serviceRequests: "POST /service-requests",
      transfers: "POST /transfers"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", app: "Chybank", database: "sqlite" });
});

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = findUserByCredentials(email, password);

  if (!user) {
    return res.status(401).json({ message: "Invalid demo credentials." });
  }

  res.json({ user });
});

app.post("/auth/register", (req, res) => {
  const result = registerUser(req.body);

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  res.status(201).json(result);
});

app.post("/auth/verify-registration", (req, res) => {
  const result = verifyRegistration(req.body);

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  res.status(201).json(result);
});

app.post("/auth/reset-password", (req, res) => {
  const result = resetPassword(req.body);

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  res.json(result);
});

app.get("/accounts/:userId", (req, res) => {
  res.json({ accounts: getAccountsByUserId(req.params.userId) });
});

app.get("/beneficiaries/:accountNumber", (req, res) => {
  const result = findBeneficiaryByAccountNumber(req.params.accountNumber);

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  res.json(result);
});

app.post("/accounts", (req, res) => {
  const result = createAccount(req.body);

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  res.status(201).json(result);
});

app.get("/transactions/:accountId", (req, res) => {
  res.json({ transactions: getTransactionsByAccountId(req.params.accountId) });
});

app.get("/cards/:userId", (req, res) => {
  res.json({ cards: getCardsByUserId(req.params.userId) });
});

app.post("/profile/documents", (req, res) => {
  const result = updateUserDocuments(req.body);

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  res.json(result);
});

app.post("/service-requests", (req, res) => {
  const result = createServiceRequest(req.body);

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  res.status(201).json(result);
});

app.post("/transfers", (req, res) => {
  const result = createTransfer(req.body);

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  res.status(201).json(result);
});

export default app;
