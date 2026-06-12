import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultDatabasePath = join(__dirname, "..", "data", "chybank.sqlite");
const databasePath = process.env.SQLITE_DATABASE_PATH || defaultDatabasePath;

mkdirSync(dirname(databasePath), { recursive: true });

const db = new DatabaseSync(databasePath);
db.exec("PRAGMA foreign_keys = ON");
db.exec("PRAGMA journal_mode = WAL");

function dollarsToCents(value) {
  return Math.round(Number(value) * 100);
}

function centsToDollars(value) {
  return Number((Number(value) / 100).toFixed(2));
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function makeAccountNumber() {
  return String(1000000000 + Math.floor(Math.random() * 8999999999));
}

function makeVerificationCode() {
  return String(100000 + Math.floor(Math.random() * 900000));
}

function isStrongPassword(password) {
  return (
    password.length >= 8 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function toPublicUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone || "",
    role: row.role,
    profilePhotoName: row.profile_photo_name || "",
    idDocumentName: row.id_document_name || ""
  };
}

function toAccount(row) {
  return {
    id: row.id,
    userId: row.user_id,
    accountName: row.account_name,
    accountType: row.account_type || "Checking",
    accountSubType: row.account_subtype || "",
    accountNumber: row.account_number,
    balance: centsToDollars(row.balance_cents),
    currency: row.currency
  };
}

function toCard(row) {
  return {
    id: row.id,
    userId: row.user_id,
    brand: row.brand,
    last4: row.last4,
    expiryMonth: row.expiry_month,
    expiryYear: row.expiry_year
  };
}

function toTransaction(row, accountId) {
  const direction = row.receiver_account_id === accountId ? "incoming" : "outgoing";

  return {
    id: row.id,
    senderAccountId: row.sender_account_id,
    receiverAccountId: row.receiver_account_id,
    senderName: row.sender_name || "",
    receiverName: row.receiver_name || "",
    counterpartyName: direction === "incoming" ? row.sender_name || "" : row.receiver_name || "",
    amount: centsToDollars(row.amount_cents),
    type: row.type,
    status: row.status,
    description: row.description,
    createdAt: row.created_at,
    direction
  };
}

function addColumnIfMissing(tableName, columnDefinition) {
  try {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
  } catch (error) {
    if (!String(error.message).includes("duplicate column name")) {
      throw error;
    }
  }
}

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      email_verified INTEGER NOT NULL DEFAULT 1,
      profile_photo_name TEXT,
      id_document_name TEXT
    );

    CREATE TABLE IF NOT EXISTS pending_registrations (
      email TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      password TEXT NOT NULL,
      verification_code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      account_name TEXT NOT NULL,
      account_type TEXT NOT NULL DEFAULT 'Checking',
      account_subtype TEXT,
      account_number TEXT NOT NULL UNIQUE,
      balance_cents INTEGER NOT NULL CHECK (balance_cents >= 0),
      currency TEXT NOT NULL DEFAULT 'USD'
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      brand TEXT NOT NULL,
      last4 TEXT NOT NULL,
      expiry_month TEXT NOT NULL,
      expiry_year TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      sender_account_id TEXT NOT NULL REFERENCES accounts(id),
      receiver_account_id TEXT NOT NULL REFERENCES accounts(id),
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS service_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      request_type TEXT NOT NULL,
      details TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  addColumnIfMissing("users", "phone TEXT");
  addColumnIfMissing("users", "email_verified INTEGER NOT NULL DEFAULT 1");
  addColumnIfMissing("users", "profile_photo_name TEXT");
  addColumnIfMissing("users", "id_document_name TEXT");
  addColumnIfMissing("accounts", "account_type TEXT NOT NULL DEFAULT 'Checking'");
  addColumnIfMissing("accounts", "account_subtype TEXT");

  seedDemoData();
}

function seedDemoData() {
  const existingUser = db
    .prepare("SELECT id FROM users WHERE id = ?")
    .get("user_sarah");

  if (existingUser) {
    db.prepare("UPDATE users SET phone = COALESCE(phone, ?) WHERE id = ?").run(
      "+1 555 0101",
      "user_sarah"
    );
    db.prepare("UPDATE users SET password = ? WHERE id IN (?, ?)").run(
      "Chybank@123",
      "user_sarah",
      "user_michael"
    );
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(
      "Admin@123",
      "user_admin"
    );
    seedExternalBankAccount();
    return;
  }

  db.exec("BEGIN");
  try {
    db.prepare(
      `
        INSERT INTO users (id, full_name, email, phone, password, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `
    ).run(
      "user_sarah",
      "Sarah Johnson",
      "sarah@chybank.demo",
      "+1 555 0101",
      "Chybank@123",
      "customer"
    );
    db.prepare(
      `
        INSERT INTO users (id, full_name, email, phone, password, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `
    ).run(
      "user_michael",
      "Michael Lee",
      "michael@chybank.demo",
      "+1 555 0102",
      "Chybank@123",
      "customer"
    );
    db.prepare(
      `
        INSERT INTO users (id, full_name, email, phone, password, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `
    ).run(
      "user_admin",
      "Admin Demo",
      "admin@chybank.demo",
      "+1 555 0100",
      "Admin@123",
      "support"
    );

    db.prepare(
      `
        INSERT INTO accounts (
          id,
          user_id,
          account_name,
          account_type,
          account_subtype,
          account_number,
          balance_cents,
          currency
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
    ).run(
      "acct_sarah_checking",
      "user_sarah",
      "Everyday Checking",
      "Checking",
      null,
      "1002457891",
      dollarsToCents(12400),
      "USD"
    );
    db.prepare(
      `
        INSERT INTO accounts (
          id,
          user_id,
          account_name,
          account_type,
          account_subtype,
          account_number,
          balance_cents,
          currency
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
    ).run(
      "acct_michael_savings",
      "user_michael",
      "Growth Savings",
      "Savings",
      null,
      "1002457892",
      dollarsToCents(8950),
      "USD"
    );

    db.prepare(
      `
        INSERT INTO cards (id, user_id, brand, last4, expiry_month, expiry_year)
        VALUES (?, ?, ?, ?, ?, ?)
      `
    ).run("card_sarah", "user_sarah", "Visa", "4821", "08", "29");
    db.prepare(
      `
        INSERT INTO cards (id, user_id, brand, last4, expiry_month, expiry_year)
        VALUES (?, ?, ?, ?, ?, ?)
      `
    ).run("card_michael", "user_michael", "Mastercard", "9134", "11", "28");

    db.prepare(
      `
        INSERT INTO transactions (
          id,
          sender_account_id,
          receiver_account_id,
          amount_cents,
          type,
          status,
          description,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
    ).run(
      "txn_001",
      "acct_michael_savings",
      "acct_sarah_checking",
      dollarsToCents(250),
      "transfer",
      "completed",
      "Demo transfer from Michael",
      "2026-06-01T14:20:00.000Z"
    );
    db.prepare(
      `
        INSERT INTO transactions (
          id,
          sender_account_id,
          receiver_account_id,
          amount_cents,
          type,
          status,
          description,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
    ).run(
      "txn_002",
      "acct_sarah_checking",
      "acct_michael_savings",
      dollarsToCents(80),
      "transfer",
      "completed",
      "Savings contribution",
      "2026-06-03T09:45:00.000Z"
    );

    db.exec("COMMIT");
    seedExternalBankAccount();
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function seedExternalBankAccount() {
  const externalUser = db
    .prepare("SELECT id FROM users WHERE id = ?")
    .get("user_external");

  if (!externalUser) {
    db.prepare(
      `
        INSERT INTO users (id, full_name, email, phone, password, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `
    ).run(
      "user_external",
      "External Bank Settlement",
      "external@chybank.system",
      "+1 555 0999",
      "system-only",
      "system"
    );
  }

  const externalAccount = db
    .prepare("SELECT id FROM accounts WHERE id = ?")
    .get("acct_external_bank");

  if (!externalAccount) {
    db.prepare(
      `
        INSERT INTO accounts (
          id,
          user_id,
          account_name,
          account_type,
          account_subtype,
          account_number,
          balance_cents,
          currency
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
    ).run(
      "acct_external_bank",
      "user_external",
      "Other Bank Settlement",
      "External",
      null,
      "9999999999",
      dollarsToCents(0),
      "USD"
    );
  }
}

export function getDatabasePath() {
  return databasePath;
}

export function findUserByCredentials(email, password) {
  return toPublicUser(
    db
      .prepare(
        "SELECT * FROM users WHERE lower(email) = lower(?) AND password = ?"
      )
      .get(String(email || ""), password)
  );
}

export function registerUser({ fullName, email, phone, password }) {
  const cleanFullName = String(fullName || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPhone = String(phone || "").trim();
  const cleanPassword = String(password || "");

  if (!cleanFullName || !cleanEmail || !cleanPhone || !isStrongPassword(cleanPassword)) {
    return {
      error: {
        status: 400,
        message:
          "Full name, email, phone, and a password with letters, numbers, and a special character are required."
      }
    };
  }

  const existingUser = db
    .prepare("SELECT id FROM users WHERE lower(email) = lower(?)")
    .get(cleanEmail);

  if (existingUser) {
    return { error: { status: 409, message: "An account with this email exists." } };
  }

  const verificationCode = makeVerificationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const createdAt = new Date().toISOString();

  db.prepare(
    `
      INSERT INTO pending_registrations (
        email,
        full_name,
        phone,
        password,
        verification_code,
        expires_at,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        full_name = excluded.full_name,
        phone = excluded.phone,
        password = excluded.password,
        verification_code = excluded.verification_code,
        expires_at = excluded.expires_at,
        created_at = excluded.created_at
    `
  ).run(
    cleanEmail,
    cleanFullName,
    cleanPhone,
    cleanPassword,
    verificationCode,
    expiresAt,
    createdAt
  );

  console.log(
    `Chybank verification email for ${cleanEmail}: Your code is ${verificationCode}. It expires in 10 minutes.`
  );

  return {
    message: `Verification code sent to ${cleanEmail}.`,
    email: cleanEmail,
    demoCode: verificationCode
  };
}

export function verifyRegistration({ email, code }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanCode = String(code || "").trim();

  if (!cleanEmail || !cleanCode) {
    return { error: { status: 400, message: "Email and verification code are required." } };
  }

  const pendingRegistration = db
    .prepare("SELECT * FROM pending_registrations WHERE lower(email) = lower(?)")
    .get(cleanEmail);

  if (!pendingRegistration) {
    return { error: { status: 404, message: "No pending registration was found." } };
  }

  if (new Date(pendingRegistration.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM pending_registrations WHERE email = ?").run(cleanEmail);
    return { error: { status: 410, message: "Verification code expired. Register again." } };
  }

  if (pendingRegistration.verification_code !== cleanCode) {
    return { error: { status: 401, message: "Invalid verification code." } };
  }

  const existingUser = db
    .prepare("SELECT id FROM users WHERE lower(email) = lower(?)")
    .get(cleanEmail);

  if (existingUser) {
    db.prepare("DELETE FROM pending_registrations WHERE email = ?").run(cleanEmail);
    return { error: { status: 409, message: "An account with this email exists." } };
  }

  const userId = makeId("user");
  const accountId = makeId("acct");

  db.exec("BEGIN");
  try {
    db.prepare(
      `
        INSERT INTO users (id, full_name, email, phone, password, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `
    ).run(
      userId,
      pendingRegistration.full_name,
      cleanEmail,
      pendingRegistration.phone,
      pendingRegistration.password,
      "customer"
    );

    db.prepare(
      `
        INSERT INTO accounts (
          id,
          user_id,
          account_name,
          account_type,
          account_subtype,
          account_number,
          balance_cents,
          currency
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
    ).run(
      accountId,
      userId,
      "Everyday Checking",
      "Checking",
      null,
      makeAccountNumber(),
      dollarsToCents(500),
      "USD"
    );

    db.prepare("DELETE FROM pending_registrations WHERE email = ?").run(cleanEmail);

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return {
    user: toPublicUser(db.prepare("SELECT * FROM users WHERE id = ?").get(userId))
  };
}

export function resetPassword({ email, phone, password }) {
  const cleanPassword = String(password || "");

  if (!email || !phone || !isStrongPassword(cleanPassword)) {
    return {
      error: {
        status: 400,
        message:
          "Email, phone, and a new password with letters, numbers, and a special character are required."
      }
    };
  }

  const result = db
    .prepare(
      "UPDATE users SET password = ? WHERE lower(email) = lower(?) AND phone = ?"
    )
    .run(cleanPassword, String(email).trim(), String(phone).trim());

  if (result.changes === 0) {
    return { error: { status: 404, message: "No matching account was found." } };
  }

  return { message: "Password reset successfully." };
}

export function updateUserDocuments({ userId, profilePhotoName, idDocumentName }) {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);

  if (!user) {
    return { error: { status: 404, message: "User was not found." } };
  }

  db.prepare(
    `
      UPDATE users
      SET profile_photo_name = COALESCE(?, profile_photo_name),
          id_document_name = COALESCE(?, id_document_name)
      WHERE id = ?
    `
  ).run(profilePhotoName || null, idDocumentName || null, userId);

  return {
    user: toPublicUser(db.prepare("SELECT * FROM users WHERE id = ?").get(userId))
  };
}

export function getAccountsByUserId(userId) {
  return db
    .prepare("SELECT * FROM accounts WHERE user_id = ? ORDER BY account_name")
    .all(userId)
    .map(toAccount);
}

export function findBeneficiaryByAccountNumber(accountNumber) {
  const cleanAccountNumber = String(accountNumber || "").trim();

  if (!cleanAccountNumber) {
    return { error: { status: 400, message: "Account number is required." } };
  }

  const account = db
    .prepare(
      `
        SELECT
          accounts.account_number,
          accounts.account_name,
          accounts.account_type,
          users.full_name
        FROM accounts
        JOIN users ON users.id = accounts.user_id
        WHERE accounts.account_number = ?
      `
    )
    .get(cleanAccountNumber);

  if (!account || account.account_type === "External") {
    return { error: { status: 404, message: "No beneficiary found for this account number." } };
  }

  return {
    beneficiary: {
      accountNumber: account.account_number,
      accountName: account.account_name,
      fullName: account.full_name
    }
  };
}

export function createAccount({ userId, accountType, accountSubType }) {
  const investmentOptions = ["House Mortgage", "Car", "Child"];
  const accountOptions = {
    Investment: { currency: "USD", balance: 1000 },
    Euro: { currency: "EUR", balance: 250 },
    Pounds: { currency: "GBP", balance: 250 },
    Dollar: { currency: "USD", balance: 300 }
  };
  const option = accountOptions[accountType];

  if (!option) {
    return { error: { status: 400, message: "Choose a valid account type." } };
  }

  const cleanSubType = String(accountSubType || "").trim();

  if (accountType === "Investment" && !investmentOptions.includes(cleanSubType)) {
    return {
      error: {
        status: 400,
        message: "Choose an investment option: House Mortgage, Car, or Child."
      }
    };
  }

  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);

  if (!user) {
    return { error: { status: 404, message: "User was not found." } };
  }

  if (["Euro", "Pounds", "Dollar"].includes(accountType)) {
    const existingCurrencyAccount = db
      .prepare(
        `
          SELECT id
          FROM accounts
          WHERE user_id = ?
            AND (
              account_type = ?
              OR (? = 'Dollar' AND currency = 'USD')
            )
        `
      )
      .get(userId, accountType, accountType);

    if (existingCurrencyAccount) {
      return {
        error: {
          status: 409,
          message: `You already have a ${accountType} account.`
        }
      };
    }
  }

  if (accountType === "Investment") {
    const existingInvestment = db
      .prepare(
        `
          SELECT id
          FROM accounts
          WHERE user_id = ?
            AND account_type = 'Investment'
            AND account_subtype = ?
        `
      )
      .get(userId, cleanSubType);

    if (existingInvestment) {
      return {
        error: {
          status: 409,
          message: `You already have a ${cleanSubType} investment account.`
        }
      };
    }
  }

  const accountId = makeId("acct");
  db.prepare(
    `
      INSERT INTO accounts (
        id,
        user_id,
        account_name,
        account_type,
        account_subtype,
        account_number,
        balance_cents,
        currency
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    accountId,
    userId,
    accountType === "Investment" ? `${cleanSubType} Investment` : `${accountType} Account`,
    accountType,
    accountType === "Investment" ? cleanSubType : null,
    makeAccountNumber(),
    dollarsToCents(option.balance),
    option.currency
  );

  return {
    account: toAccount(db.prepare("SELECT * FROM accounts WHERE id = ?").get(accountId)),
    accounts: getAccountsByUserId(userId)
  };
}

export function getCardsByUserId(userId) {
  return db
    .prepare("SELECT * FROM cards WHERE user_id = ? ORDER BY brand")
    .all(userId)
    .map(toCard);
}

export function getTransactionsByAccountId(accountId) {
  return db
    .prepare(
      `
        SELECT
          transactions.*,
          sender_user.full_name AS sender_name,
          receiver_user.full_name AS receiver_name
        FROM transactions
        JOIN accounts AS sender_account
          ON sender_account.id = transactions.sender_account_id
        JOIN users AS sender_user
          ON sender_user.id = sender_account.user_id
        JOIN accounts AS receiver_account
          ON receiver_account.id = transactions.receiver_account_id
        JOIN users AS receiver_user
          ON receiver_user.id = receiver_account.user_id
        WHERE transactions.sender_account_id = ?
          OR transactions.receiver_account_id = ?
        ORDER BY datetime(created_at) DESC
      `
    )
    .all(accountId, accountId)
    .map((transaction) => toTransaction(transaction, accountId));
}

export function createServiceRequest({ userId, requestType, details }) {
  const cleanRequestType = String(requestType || "").trim();
  const cleanDetails = String(details || "").trim();

  if (!userId || !cleanRequestType || !cleanDetails) {
    return {
      error: { status: 400, message: "Request type and details are required." }
    };
  }

  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);

  if (!user) {
    return { error: { status: 404, message: "User was not found." } };
  }

  const request = {
    id: makeId("request"),
    userId,
    requestType: cleanRequestType,
    details: cleanDetails,
    status: "submitted",
    createdAt: new Date().toISOString()
  };

  db.prepare(
    `
      INSERT INTO service_requests (
        id,
        user_id,
        request_type,
        details,
        status,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `
  ).run(
    request.id,
    request.userId,
    request.requestType,
    request.details,
    request.status,
    request.createdAt
  );

  return { request };
}

export function createTransfer({
  senderAccountId,
  receiverAccountNumber,
  amount,
  description,
  transferType
}) {
  const transferAmount = Number(amount);
  const transferCents = dollarsToCents(transferAmount);

  if (!Number.isFinite(transferAmount) || transferCents <= 0) {
    return { error: { status: 400, message: "Transfer amount must be positive." } };
  }

  db.exec("BEGIN IMMEDIATE");

  try {
    const sender = db
      .prepare("SELECT * FROM accounts WHERE id = ?")
      .get(senderAccountId);
    let receiver = db
      .prepare("SELECT * FROM accounts WHERE account_number = ?")
      .get(String(receiverAccountNumber || ""));

    if (!sender) {
      db.exec("ROLLBACK");
      return { error: { status: 404, message: "Sender account was not found." } };
    }

    if (!receiver && transferType === "other-bank") {
      receiver = db
        .prepare("SELECT * FROM accounts WHERE id = ?")
        .get("acct_external_bank");
    }

    if (!receiver) {
      db.exec("ROLLBACK");
      return { error: { status: 404, message: "Receiver account was not found." } };
    }

    if (sender.id === receiver.id) {
      db.exec("ROLLBACK");
      return {
        error: { status: 400, message: "Choose a different receiver account." }
      };
    }

    if (sender.balance_cents < transferCents) {
      db.exec("ROLLBACK");
      return { error: { status: 400, message: "Insufficient demo balance." } };
    }

    db.prepare("UPDATE accounts SET balance_cents = balance_cents - ? WHERE id = ?")
      .run(transferCents, sender.id);
    db.prepare("UPDATE accounts SET balance_cents = balance_cents + ? WHERE id = ?")
      .run(transferCents, receiver.id);

    const transaction = {
      id: makeId("txn"),
      senderAccountId: sender.id,
      receiverAccountId: receiver.id,
      amount: centsToDollars(transferCents),
      type: transferType || "interbank",
      status: "completed",
      description:
        description ||
        (transferType === "other-bank"
          ? `Other bank transfer to ${receiverAccountNumber}`
          : "Chybank demo transfer"),
      createdAt: new Date().toISOString()
    };

    db.prepare(
      `
        INSERT INTO transactions (
          id,
          sender_account_id,
          receiver_account_id,
          amount_cents,
          type,
          status,
          description,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
    ).run(
      transaction.id,
      transaction.senderAccountId,
      transaction.receiverAccountId,
      transferCents,
      transaction.type,
      transaction.status,
      transaction.description,
      transaction.createdAt
    );

    const updatedSender = db
      .prepare("SELECT * FROM accounts WHERE id = ?")
      .get(sender.id);

    db.exec("COMMIT");

    return {
      account: toAccount(updatedSender),
      transaction,
      transactions: getTransactionsByAccountId(sender.id)
    };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
