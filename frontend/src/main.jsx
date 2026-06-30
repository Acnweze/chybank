import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeDollarSign,
  Banknote,
  Bell,
  Building2,
  Calculator,
  CircleDollarSign,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileText,
  History,
  Landmark,
  Lock,
  LogOut,
  MessageCircle,
  Moon,
  Phone,
  PiggyBank,
  ReceiptText,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sun,
  Target,
  Upload,
  UserPlus,
  Users,
  WalletCards
} from "lucide-react";
import "./styles.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "/api"
    : `${window.location.protocol}//${window.location.hostname}:4000`);
const demoCredentials = {
  email: "sarah@chybank.demo",
  password: "Chybank@123"
};
const passwordPattern = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$";
const passwordRequirement =
  "Use at least 8 characters with letters, a number, and a special character.";

function transactionPartyLabel(transaction) {
  if (!transaction.counterpartyName) return "";
  return transaction.direction === "incoming"
    ? `From ${transaction.counterpartyName}`
    : `To ${transaction.counterpartyName}`;
}

function money(value, currency = "USD", hidden = false) {
  if (hidden) return "••••••";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(value);
}

function accountNumber(value, hidden = false) {
  const cleanValue = String(value || "");
  if (!hidden) return cleanValue;
  if (cleanValue.length <= 4) return "••••";
  return `••••••${cleanValue.slice(-4)}`;
}

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const text = await response.text();
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = text && isJson ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || "The API server did not return a valid response.");
  }

  if (text && !isJson) {
    throw new Error(
      "The API request reached the wrong server. Check that the backend is running on port 4000."
    );
  }

  return data;
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(demoCredentials.email);
  const [phone, setPhone] = useState("+1 555 0101");
  const [password, setPassword] = useState(demoCredentials.password);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [demoVerificationCode, setDemoVerificationCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode !== "login" && mode !== "verify" && !new RegExp(passwordPattern).test(password)) {
        throw new Error(passwordRequirement);
      }

      if (mode === "login") {
        const data = await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });
        onLogin(data.user);
      }

      if (mode === "register") {
        const data = await api("/auth/register", {
          method: "POST",
          body: JSON.stringify({ fullName, email, phone, password })
        });
        setPendingEmail(data.email || email);
        setDemoVerificationCode(data.demoCode || "");
        setVerificationCode("");
        setMessage(
          data.demoCode
            ? `${data.message} Demo code: ${data.demoCode}`
            : data.message
        );
        setMode("verify");
      }

      if (mode === "verify") {
        const data = await api("/auth/verify-registration", {
          method: "POST",
          body: JSON.stringify({ email: pendingEmail || email, code: verificationCode })
        });
        onLogin(data.user);
      }

      if (mode === "reset") {
        const data = await api("/auth/reset-password", {
          method: "POST",
          body: JSON.stringify({ email, phone, password })
        });
        setMessage(data.message);
        setMode("login");
      }
    } catch (authError) {
      setError(authError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel auth-panel">
        <img className="login-logo" src="/chybank-logo.svg" alt="Chybank" />
        <h1>
          {mode === "register" ? "Create account" : null}
          {mode === "verify" ? "Verify email" : null}
          {mode !== "register" && mode !== "verify" ? "Chybank" : null}
        </h1>
        <p>
          {mode === "verify"
            ? `Enter the authentication code sent to ${pendingEmail || email}.`
            : "Register with email and phone number, then manage your simulated Chybank accounts."}
        </p>

        {mode !== "verify" ? (
          <div className="segmented">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
            type="button"
          >
            Register
          </button>
          <button
            className={mode === "reset" ? "active" : ""}
            onClick={() => setMode("reset")}
            type="button"
          >
            Reset
          </button>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="login-form">
          {mode === "register" ? (
            <label>
              Full name
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                placeholder="Your full name"
              />
            </label>
          ) : null}

          {mode !== "verify" ? (
            <label>
              Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
              />
            </label>
          ) : null}

          {mode !== "login" && mode !== "verify" ? (
            <label>
              Phone number
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                type="tel"
                autoComplete="tel"
              />
            </label>
          ) : null}

          {mode !== "verify" ? (
            <label>
              {mode === "reset" ? "New password" : "Password"}
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={mode === "login" ? undefined : 8}
                pattern={mode === "login" ? undefined : passwordPattern}
                title={mode === "login" ? undefined : passwordRequirement}
              />
              {mode !== "login" ? <span className="field-hint">{passwordRequirement}</span> : null}
            </label>
          ) : (
            <label>
              Email authentication code
              <input
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit code"
              />
              {demoVerificationCode ? (
                <span className="field-hint">
                  Demo email code: {demoVerificationCode}
                </span>
              ) : null}
            </label>
          )}

          {error ? <p className="error">{error}</p> : null}
          {message ? <p className="success">{message}</p> : null}
          <button disabled={loading}>
            {mode === "login" ? "Sign in" : null}
            {mode === "register" ? "Create account" : null}
            {mode === "verify" ? "Verify and sign in" : null}
            {mode === "reset" ? "Reset password" : null}
          </button>
        </form>

        {mode === "login" ? (
          <div className="auth-actions">
            <button onClick={() => setMode("register")} type="button">
              <UserPlus size={17} />
              Register
            </button>
            <button onClick={() => setMode("reset")} type="button">
              Forgot password?
            </button>
          </div>
        ) : (
          <button
            className="text-button"
            onClick={() => {
              setMode(mode === "verify" ? "register" : "login");
              setError("");
              setMessage("");
            }}
            type="button"
          >
            {mode === "verify" ? "Back to registration" : "Back to login"}
          </button>
        )}

        <div className="credentials">
          <strong>Demo login</strong>
          <span>{demoCredentials.email}</span>
          <span>{demoCredentials.password}</span>
        </div>
      </section>
    </main>
  );
}

function Dashboard({ initialUser, onLogout }) {
  const [user, setUser] = useState(initialUser);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cards, setCards] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [receiverAccountNumber, setReceiverAccountNumber] = useState("1002457892");
  const [resolvedBeneficiary, setResolvedBeneficiary] = useState(null);
  const [beneficiaryLookupStatus, setBeneficiaryLookupStatus] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transferType, setTransferType] = useState("interbank");
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [accountNumbersHidden, setAccountNumbersHidden] = useState(false);
  const [newAccountType, setNewAccountType] = useState("Investment");
  const [investmentSubType, setInvestmentSubType] = useState("House Mortgage");
  const [profilePreview, setProfilePreview] = useState("");
  const [profilePhotoName, setProfilePhotoName] = useState(user.profilePhotoName);
  const [idDocumentName, setIdDocumentName] = useState(user.idDocumentName);
  const [serviceDetail, setServiceDetail] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [activePage, setActivePage] = useState("overview");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionDirection, setTransactionDirection] = useState("all");
  const [beneficiaries, setBeneficiaries] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("chybank-beneficiaries") || "[]");
    } catch {
      return [];
    }
  });
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryAccount, setBeneficiaryAccount] = useState("");
  const [loanAmount, setLoanAmount] = useState("5000");
  const [loanMonths, setLoanMonths] = useState("24");
  const [cardFrozen, setCardFrozen] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId),
    [accounts, selectedAccountId]
  );
  const availableAccountTypes = useMemo(() => {
    const existingTypes = new Set(accounts.map((account) => account.accountType));
    const hasDollarAccount = accounts.some((account) => account.currency === "USD");

    return ["Investment", "Euro", "Pounds", "Dollar"].filter((type) => {
      if (type === "Investment") return true;
      if (type === "Dollar") return !hasDollarAccount;
      return !existingTypes.has(type);
    });
  }, [accounts]);
  const availableInvestmentSubTypes = useMemo(() => {
    const existingInvestmentSubTypes = new Set(
      accounts
        .filter((account) => account.accountType === "Investment")
        .map((account) => account.accountSubType)
    );

    return ["House Mortgage", "Car", "Child"].filter(
      (type) => !existingInvestmentSubTypes.has(type)
    );
  }, [accounts]);
  const canCreateSelectedAccount =
    newAccountType !== "Investment" || availableInvestmentSubTypes.length > 0;
  const totalAssets = useMemo(
    () =>
      accounts
        .filter((account) => account.currency === "USD")
        .reduce((sum, account) => sum + account.balance, 0),
    [accounts]
  );
  const monthlyOutflow = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.direction === "outgoing")
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    [transactions]
  );
  const kycItems = useMemo(
    () => [
      { label: "Email verified", complete: Boolean(user.email) },
      { label: "Phone verified", complete: Boolean(user.phone) },
      { label: "Profile photo", complete: Boolean(profilePhotoName) },
      { label: "ID uploaded", complete: Boolean(idDocumentName) }
    ],
    [user.email, user.phone, profilePhotoName, idDocumentName]
  );
  const kycPercent = Math.round(
    (kycItems.filter((item) => item.complete).length / kycItems.length) * 100
  );
  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        const matchesSearch = transaction.description
          .toLowerCase()
          .includes(transactionSearch.toLowerCase());
        const matchesDirection =
          transactionDirection === "all" ||
          transaction.direction === transactionDirection;

        return matchesSearch && matchesDirection;
      }),
    [transactions, transactionSearch, transactionDirection]
  );
  const spendingAnalytics = useMemo(
    () => [
      { label: "Transfers", value: monthlyOutflow, color: "#135d38" },
      { label: "Bills", value: 380, color: "#2f7d5a" },
      { label: "Airtime", value: 75, color: "#d7a928" },
      { label: "Savings", value: 220, color: "#6f9f7d" }
    ],
    [monthlyOutflow]
  );
  const investmentAccounts = accounts.filter(
    (account) => account.accountType === "Investment"
  );
  const estimatedLoanPayment = useMemo(() => {
    const principal = Number(loanAmount) || 0;
    const months = Number(loanMonths) || 1;
    const monthlyRate = 0.12 / 12;
    const payment =
      (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

    return Number.isFinite(payment) ? payment : 0;
  }, [loanAmount, loanMonths]);
  const notifications = [
    "Account numbers are visible on the dashboard.",
    `${kycPercent}% profile verification complete.`,
    cardFrozen ? "Virtual card is frozen." : "Virtual card is active.",
    "Loan, airtime, bill, and investment requests are ready."
  ];

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const accountData = await api(`/accounts/${user.id}`);
      const firstAccount = accountData.accounts[0];
      setAccounts(accountData.accounts);
      setSelectedAccountId((current) => current || firstAccount?.id || "");

      const activeAccountId = selectedAccountId || firstAccount?.id;
      const [transactionData, cardData] = await Promise.all([
        activeAccountId
          ? api(`/transactions/${activeAccountId}`)
          : Promise.resolve({ transactions: [] }),
        api(`/cards/${user.id}`)
      ]);
      setTransactions(transactionData.transactions);
      setCards(cardData.cards);
    } catch (dashboardError) {
      setError(dashboardError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (
      availableInvestmentSubTypes.length > 0 &&
      !availableInvestmentSubTypes.includes(investmentSubType)
    ) {
      setInvestmentSubType(availableInvestmentSubTypes[0]);
    }
  }, [availableInvestmentSubTypes, investmentSubType]);

  useEffect(() => {
    async function loadTransactions() {
      if (!selectedAccountId) return;
      const transactionData = await api(`/transactions/${selectedAccountId}`);
      setTransactions(transactionData.transactions);
    }

    loadTransactions().catch((transactionError) => setError(transactionError.message));
  }, [selectedAccountId]);

  useEffect(() => {
    const cleanAccountNumber = receiverAccountNumber.trim();

    setResolvedBeneficiary(null);
    setBeneficiaryLookupStatus("");

    if (cleanAccountNumber.length < 10 || transferType === "other-bank") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setBeneficiaryLookupStatus("Checking beneficiary...");
      api(`/beneficiaries/${cleanAccountNumber}`)
        .then((data) => {
          setResolvedBeneficiary(data.beneficiary);
          setBeneficiaryLookupStatus("");
        })
        .catch((lookupError) => {
          setResolvedBeneficiary(null);
          setBeneficiaryLookupStatus(lookupError.message);
        });
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [receiverAccountNumber, transferType]);

  async function submitTransfer(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const data = await api("/transfers", {
        method: "POST",
        body: JSON.stringify({
          senderAccountId: selectedAccountId,
          receiverAccountNumber,
          amount,
          description,
          transferType
        })
      });

      setAccounts((currentAccounts) =>
        currentAccounts.map((account) =>
          account.id === data.account.id ? data.account : account
        )
      );
      setTransactions(data.transactions);
      setAmount("");
      setDescription("");
      setMessage("Transfer completed.");
    } catch (transferError) {
      setError(transferError.message);
    }
  }

  function addBeneficiary(event) {
    event.preventDefault();
    if (!beneficiaryName || !beneficiaryAccount) return;

    const nextBeneficiaries = [
      ...beneficiaries,
      {
        id: Date.now(),
        name: beneficiaryName,
        accountNumber: beneficiaryAccount
      }
    ];
    setBeneficiaries(nextBeneficiaries);
    localStorage.setItem(
      "chybank-beneficiaries",
      JSON.stringify(nextBeneficiaries)
    );
    setBeneficiaryName("");
    setBeneficiaryAccount("");
    setMessage("Beneficiary saved.");
  }

  function downloadStatement() {
    const sanitizePdfText = (value) =>
      String(value ?? "")
        .normalize("NFKD")
        .replace(/[^\x20-\x7E]/g, "")
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");
    const wrapLine = (line, maxLength = 46) => {
      const words = String(line).split(" ");
      const wrapped = [];
      let current = "";

      words.forEach((word) => {
        const next = current ? `${current} ${word}` : word;
        if (next.length > maxLength) {
          if (current) wrapped.push(current);
          current = word;
        } else {
          current = next;
        }
      });

      if (current) wrapped.push(current);
      return wrapped;
    };
    const pdfTimestamp = () => {
      const now = new Date();
      const part = (value) => String(value).padStart(2, "0");
      return `${now.getFullYear()}${part(now.getMonth() + 1)}${part(now.getDate())}${part(
        now.getHours()
      )}${part(now.getMinutes())}${part(now.getSeconds())}`;
    };
    const moneyForStatement = (value) =>
      money(value, selectedAccount?.currency || "USD", balanceHidden);
    const textOp = (text, x, y, size = 10, font = "F1", color = "0.09 0.13 0.10") =>
      `BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${sanitizePdfText(
        text
      )}) Tj ET`;
    const rectOp = (x, y, width, height, color) =>
      `q ${color} rg ${x} ${y} ${width} ${height} re f Q`;
    const lineOp = (x1, y1, x2, y2, color = "0.82 0.86 0.81", width = 0.7) =>
      `q ${color} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S Q`;
    const buildPdf = (transactionsForStatement) => {
      const encoder = new TextEncoder();
      const objects = [];
      const rows = transactionsForStatement.flatMap((transaction) => {
        const isCredit = transaction.direction === "incoming";
        const amount = moneyForStatement(transaction.amount);
        const partyLabel = transactionPartyLabel(transaction);
        const wrappedDescription = wrapLine(
          `${partyLabel ? `${partyLabel} - ` : ""}${transaction.description || transaction.type}`
        );

        return wrappedDescription.map((description, descriptionIndex) => ({
          date:
            descriptionIndex === 0
              ? new Date(transaction.createdAt).toLocaleDateString()
              : "",
          description,
          debit: descriptionIndex === 0 && !isCredit ? amount : "",
          credit: descriptionIndex === 0 && isCredit ? amount : "",
          balance: descriptionIndex === 0 ? moneyForStatement(selectedAccount?.balance || 0) : ""
        }));
      });
      const rowsPerPage = 22;
      const pages = [];

      for (let index = 0; index < Math.max(rows.length, 1); index += rowsPerPage) {
        pages.push(rows.slice(index, index + rowsPerPage));
      }

      objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
      objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
      objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

      const pageIds = [];
      pages.forEach((pageRows, pageIndex) => {
        const pageId = objects.length;
        const contentId = pageId + 1;
        pageIds.push(`${pageId} 0 R`);
        const ops = [];
        const statementAccountNumber = accountNumber(
          selectedAccount?.accountNumber || "0000000000",
          accountNumbersHidden
        );

        ops.push(rectOp(0, 0, 612, 792, "0.98 0.99 0.97"));
        ops.push(rectOp(36, 720, 540, 58, "0.05 0.17 0.10"));
        ops.push(rectOp(36, 714, 540, 6, "0.84 0.66 0.16"));
        ops.push(textOp("CHYBANK", 56, 748, 19, "F2", "1 1 1"));
        ops.push(textOp("Digital Banking Statement", 56, 731, 9, "F1", "0.84 0.93 0.84"));
        ops.push(textOp("Account Statement", 418, 744, 15, "F2", "1 1 1"));
        ops.push(textOp(`Generated ${new Date().toLocaleString()}`, 418, 728, 8, "F1", "0.84 0.93 0.84"));

        ops.push(textOp("Statement Summary", 42, 686, 16, "F2"));
        ops.push(lineOp(42, 678, 570, 678, "0.10 0.45 0.26", 1.1));

        ops.push(rectOp(42, 602, 256, 58, "1 1 1"));
        ops.push(rectOp(314, 602, 256, 58, "1 1 1"));
        ops.push(lineOp(42, 660, 298, 660));
        ops.push(lineOp(314, 660, 570, 660));
        ops.push(textOp("Customer Details", 54, 642, 11, "F2", "0.07 0.28 0.16"));
        ops.push(textOp(`Name: ${user.fullName}`, 54, 625, 9));
        ops.push(textOp(`Email: ${user.email}`, 54, 611, 9));
        ops.push(textOp("Account Details", 326, 642, 11, "F2", "0.07 0.28 0.16"));
        ops.push(textOp(`Account: ${selectedAccount?.accountName || "Selected account"}`, 326, 625, 9));
        ops.push(textOp(`Account No: ${statementAccountNumber}`, 326, 611, 9));

        ops.push(rectOp(42, 548, 570 - 42, 30, "0.92 0.96 0.91"));
        ops.push(textOp("Date", 52, 559, 9, "F2", "0.07 0.28 0.16"));
        ops.push(textOp("Description", 112, 559, 9, "F2", "0.07 0.28 0.16"));
        ops.push(textOp("Debit", 344, 559, 9, "F2", "0.07 0.28 0.16"));
        ops.push(textOp("Credit", 424, 559, 9, "F2", "0.07 0.28 0.16"));
        ops.push(textOp("Balance", 502, 559, 9, "F2", "0.07 0.28 0.16"));

        if (transactionsForStatement.length === 0) {
          ops.push(textOp("No transactions found for the current filter.", 52, 520, 10));
        }

        let rowY = 529;
        pageRows.forEach((row, rowIndex) => {
          if (rowIndex % 2 === 0) {
            ops.push(rectOp(42, rowY - 8, 528, 20, "0.995 1 0.99"));
          }
          ops.push(textOp(row.date, 52, rowY, 8));
          ops.push(textOp(row.description, 112, rowY, 8));
          ops.push(textOp(row.debit, 344, rowY, 8));
          ops.push(textOp(row.credit, 424, rowY, 8));
          ops.push(textOp(row.balance, 502, rowY, 8));
          ops.push(lineOp(42, rowY - 11, 570, rowY - 11, "0.90 0.93 0.89", 0.5));
          rowY -= 22;
        });

        ops.push(lineOp(42, 72, 570, 72, "0.82 0.86 0.81", 0.7));
        ops.push(textOp("This is a computer-generated Chybank statement.", 42, 54, 8, "F1", "0.38 0.45 0.36"));
        ops.push(textOp(`Page ${pageIndex + 1} of ${pages.length}`, 514, 54, 8, "F1", "0.38 0.45 0.36"));

        const stream = ops.join("\n");

        objects[pageId] =
          `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
        objects[contentId] =
          `<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}\nendstream`;
      });

      objects[2] = `<< /Type /Pages /Kids [${pageIds.join(" ")}] /Count ${pageIds.length} >>`;

      let pdf = "%PDF-1.4\n";
      const offsets = [0];
      for (let id = 1; id < objects.length; id += 1) {
        offsets[id] = encoder.encode(pdf).length;
        pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
      }

      const xrefOffset = encoder.encode(pdf).length;
      pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
      for (let id = 1; id < objects.length; id += 1) {
        pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
      }
      pdf +=
        `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

      return pdf;
    };
    const blob = new Blob([buildPdf(filteredTransactions)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Statement_${selectedAccount?.accountNumber || "0000000000"}_${pdfTimestamp()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function createNewAccount(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const data = await api("/accounts", {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          accountType: newAccountType,
          accountSubType:
            newAccountType === "Investment" ? investmentSubType : undefined
        })
      });
      setAccounts(data.accounts);
      setSelectedAccountId(data.account.id);
      setMessage(
        newAccountType === "Investment"
          ? `${investmentSubType} investment account created.`
          : `${newAccountType} account created.`
      );
      const nextType = availableAccountTypes.find((type) => type !== newAccountType);
      if (nextType) setNewAccountType(nextType);
      const nextInvestmentSubType = availableInvestmentSubTypes.find(
        (type) => type !== investmentSubType
      );
      if (nextInvestmentSubType) setInvestmentSubType(nextInvestmentSubType);
    } catch (accountError) {
      setError(accountError.message);
    }
  }

  async function saveDocuments() {
    setError("");
    setMessage("");

    try {
      const data = await api("/profile/documents", {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          profilePhotoName,
          idDocumentName
        })
      });
      setUser(data.user);
      setMessage("Profile photo and ID details saved.");
    } catch (documentError) {
      setError(documentError.message);
    }
  }

  async function submitService(requestType, fallbackDetail) {
    setError("");
    setMessage("");

    try {
      await api("/service-requests", {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          requestType,
          details: serviceDetail || fallbackDetail
        })
      });
      setServiceDetail("");
      setMessage(`${requestType} request submitted.`);
    } catch (serviceError) {
      setError(serviceError.message);
    }
  }

  function handleProfilePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfilePhotoName(file.name);
    setProfilePreview(URL.createObjectURL(file));
  }

  function handleIdDocument(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIdDocumentName(file.name);
  }

  if (loading) {
    return <main className="status-page">Loading Chybank...</main>;
  }

  return (
    <main className={darkMode ? "app-shell dark-mode" : "app-shell"}>
      <header className="topbar">
        <div>
          <img className="topbar-logo" src="/chybank-logo.svg" alt="Chybank" />
          <span className="app-kicker">Digital banking workspace</span>
          <h1>Welcome, {user.fullName}</h1>
          <p>{user.email} {user.phone ? `· ${user.phone}` : ""}</p>
        </div>
        <div className="topbar-actions">
          <span className="status-chip">
            <ShieldCheck size={16} />
            {kycPercent}% verified
          </span>
          <button
            className="ghost-button"
            onClick={() => setBalanceHidden((current) => !current)}
            type="button"
          >
            {balanceHidden ? <Eye size={18} /> : <EyeOff size={18} />}
            {balanceHidden ? "Show balances" : "Hide balances"}
          </button>
          <button
            className="ghost-button"
            onClick={() => setDarkMode((current) => !current)}
            type="button"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            {darkMode ? "Light" : "Dark"}
          </button>
          <button className="ghost-button" onClick={onLogout}>
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </header>

      {error ? <p className="error banner">{error}</p> : null}
      {message ? <p className="success banner">{message}</p> : null}

      <nav className="page-tabs" aria-label="App pages">
        <button
          className={activePage === "overview" ? "active" : ""}
          onClick={() => setActivePage("overview")}
          type="button"
        >
          <Landmark size={17} />
          Overview
        </button>
        <button
          className={activePage === "transfers" ? "active" : ""}
          onClick={() => setActivePage("transfers")}
          type="button"
        >
          <Send size={17} />
          Transfers
        </button>
        <button
          className={activePage === "cards" ? "active" : ""}
          onClick={() => setActivePage("cards")}
          type="button"
        >
          <CreditCard size={17} />
          Cards
        </button>
        <button
          className={activePage === "insights" ? "active" : ""}
          onClick={() => setActivePage("insights")}
          type="button"
        >
          <SlidersHorizontal size={17} />
          Insights
        </button>
        <button
          className={activePage === "profile" ? "active" : ""}
          onClick={() => setActivePage("profile")}
          type="button"
        >
          <Users size={17} />
          Profile
        </button>
        <button
          className={activePage === "support" ? "active" : ""}
          onClick={() => setActivePage("support")}
          type="button"
        >
          <MessageCircle size={17} />
          Support
        </button>
      </nav>

      {activePage === "overview" ? (
        <>
          <section className="overview-grid">
            <article className="metric-card">
              <CircleDollarSign size={22} />
              <span>Total USD assets</span>
              <strong>{money(totalAssets, "USD", balanceHidden)}</strong>
            </article>
            <article className="metric-card">
              <WalletCards size={22} />
              <span>Accounts</span>
              <strong>{accounts.length}</strong>
            </article>
            <article className="metric-card">
              <ArrowUpRight size={22} />
              <span>Outgoing activity</span>
              <strong>{money(monthlyOutflow, "USD", balanceHidden)}</strong>
            </article>
            <article className="metric-card">
              <ShieldCheck size={22} />
              <span>KYC status</span>
              <strong>{kycPercent}% complete</strong>
            </article>
          </section>

          <section className="dashboard-grid">
            <article className="balance-card">
              <div className="balance-head">
                <span>Available balance</span>
                <div className="balance-actions">
                  <button
                    className="icon-button"
                    onClick={() => setBalanceHidden((current) => !current)}
                    type="button"
                    title={balanceHidden ? "Show balance" : "Hide balance"}
                  >
                    {balanceHidden ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => setAccountNumbersHidden((current) => !current)}
                    type="button"
                    title={
                      accountNumbersHidden
                        ? "Show account numbers"
                        : "Hide account numbers"
                    }
                  >
                    <CreditCard size={18} />
                  </button>
                </div>
              </div>
              <strong>
                {selectedAccount
                  ? money(selectedAccount.balance, selectedAccount.currency, balanceHidden)
                  : "$0.00"}
              </strong>
              <p>{selectedAccount?.accountName}</p>
              <small>
                {selectedAccount?.currency} Account No.{" "}
                {accountNumber(selectedAccount?.accountNumber, accountNumbersHidden)}
              </small>
            </article>

            <article className="panel account-panel">
              <h2><WalletCards size={19} /> Accounts</h2>
              <label>
                Select account
                <select
                  value={selectedAccountId}
                  onChange={(event) => setSelectedAccountId(event.target.value)}
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountType}
                      {account.accountSubType ? ` - ${account.accountSubType}` : ""} | Acct
                      No. {accountNumber(account.accountNumber, accountNumbersHidden)} |{" "}
                      {money(account.balance, account.currency, balanceHidden)}
                    </option>
                  ))}
                </select>
              </label>
              {selectedAccount ? (
                <div className="selected-account">
                  <span>{selectedAccount.accountType}</span>
                  <strong>{selectedAccount.accountName}</strong>
                  {selectedAccount.accountSubType ? (
                    <em>{selectedAccount.accountSubType}</em>
                  ) : null}
                  <b>
                    Account No.{" "}
                    {accountNumber(selectedAccount.accountNumber, accountNumbersHidden)}
                  </b>
                  <small>
                    {money(
                      selectedAccount.balance,
                      selectedAccount.currency,
                      balanceHidden
                    )}
                  </small>
                </div>
              ) : null}
              <form className="inline-form" onSubmit={createNewAccount}>
                <select
                  value={newAccountType}
                  onChange={(event) => setNewAccountType(event.target.value)}
                  disabled={availableAccountTypes.length === 0}
                >
                  {availableAccountTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
                {newAccountType === "Investment" ? (
                  <select
                    value={investmentSubType}
                    onChange={(event) => setInvestmentSubType(event.target.value)}
                    disabled={availableInvestmentSubTypes.length === 0}
                  >
                    {availableInvestmentSubTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                ) : null}
                <button
                  disabled={
                    availableAccountTypes.length === 0 || !canCreateSelectedAccount
                  }
                >
                  Create
                </button>
              </form>
              {newAccountType === "Investment" &&
              availableInvestmentSubTypes.length === 0 ? (
                <p className="muted">
                  You already have all investment suboptions: House Mortgage, Car,
                  and Child.
                </p>
              ) : null}
              {availableAccountTypes.length === 0 ? (
                <p className="muted">All available account types have been created.</p>
              ) : null}
            </article>

            <article className="panel">
              <h2><CreditCard size={19} /> Cards</h2>
              <div className="card-list">
                {cards.length === 0 ? (
                  <p className="muted">No cards available yet.</p>
                ) : null}
                {cards.slice(0, 2).map((card) => (
                  <div className="bank-card" key={card.id}>
                    <small>{card.brand}</small>
                    <strong>•••• •••• •••• {card.last4}</strong>
                    <span>
                      Expires {String(card.expiryMonth).padStart(2, "0")}/
                      {card.expiryYear}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel services-panel">
              <h2><ReceiptText size={19} /> Bills and airtime</h2>
              <textarea
                value={serviceDetail}
                onChange={(event) => setServiceDetail(event.target.value)}
                placeholder="Add request details"
                rows="4"
              />
              <div className="service-grid">
                <button onClick={() => submitService("Airtime", "Airtime top-up")} type="button">
                  <Smartphone size={18} />
                  Airtime
                </button>
                <button onClick={() => submitService("Bills", "Bill payment")} type="button">
                  <FileText size={18} />
                  Pay bills
                </button>
              </div>
            </article>

            <article className="panel transactions-panel">
              <h2><History size={19} /> Transaction history</h2>
              <div className="transaction-tools">
                <label>
                  <Search size={16} />
                  <input
                    value={transactionSearch}
                    onChange={(event) => setTransactionSearch(event.target.value)}
                    placeholder="Search transactions"
                  />
                </label>
                <select
                  value={transactionDirection}
                  onChange={(event) => setTransactionDirection(event.target.value)}
                >
                  <option value="all">All</option>
                  <option value="incoming">Incoming</option>
                  <option value="outgoing">Outgoing</option>
                </select>
                <button onClick={downloadStatement} type="button">
                  <Download size={18} />
                  PDF statement
                </button>
              </div>
              <div className="transaction-list">
                {filteredTransactions.length === 0 ? (
                  <p className="muted">No transactions yet.</p>
                ) : null}
                {filteredTransactions.map((transaction) => (
                  <div className="transaction" key={transaction.id}>
                    <div className={transaction.direction}>
                      {transaction.direction === "incoming" ? (
                        <ArrowDownLeft size={18} />
                      ) : transaction.type === "other-bank" ? (
                        <Building2 size={18} />
                      ) : (
                        <ArrowUpRight size={18} />
                      )}
                    </div>
                    <div>
                      <strong>{transaction.description}</strong>
                      <span>
                        {transactionPartyLabel(transaction)
                          ? `${transactionPartyLabel(transaction)} · `
                          : ""}
                        {transaction.type} · {new Date(transaction.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <b>
                      {transaction.direction === "incoming" ? "+" : "-"}
                      {money(transaction.amount, selectedAccount?.currency || "USD", balanceHidden)}
                    </b>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </>
      ) : null}

      {activePage === "transfers" ? (
        <section className="dashboard-grid">
          <article className="panel">
            <h2><Send size={19} /> Make transfer</h2>
            <form className="transfer-form" onSubmit={submitTransfer}>
              <label>
                From account
                <select
                  value={selectedAccountId}
                  onChange={(event) => setSelectedAccountId(event.target.value)}
                >
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.accountName} |{" "}
                        {accountNumber(account.accountNumber, accountNumbersHidden)}
                      </option>
                    ))}
                </select>
              </label>
              <div className="transfer-type">
                <button
                  className={transferType === "interbank" ? "active" : ""}
                  onClick={() => setTransferType("interbank")}
                  type="button"
                >
                  <Landmark size={17} />
                  Chybank
                </button>
                <button
                  className={transferType === "other-bank" ? "active" : ""}
                  onClick={() => setTransferType("other-bank")}
                  type="button"
                >
                  <Building2 size={17} />
                  Other bank
                </button>
              </div>
              <label>
                Receiver account number
                <input
                  value={receiverAccountNumber}
                  onChange={(event) => setReceiverAccountNumber(event.target.value)}
                  inputMode="numeric"
                />
                {resolvedBeneficiary ? (
                  <span className="beneficiary-match">
                    Beneficiary: {resolvedBeneficiary.fullName}
                  </span>
                ) : null}
                {!resolvedBeneficiary && beneficiaryLookupStatus ? (
                  <span className="field-hint">{beneficiaryLookupStatus}</span>
                ) : null}
              </label>
              <div className="two-column-form">
                <label>
                  Amount
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    type="number"
                    min="1"
                    step="0.01"
                  />
                </label>
                <label>
                  Description
                  <input
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Transfer note"
                  />
                </label>
              </div>
              <button>
                <Send size={18} />
                Send money
              </button>
            </form>
          </article>

          <article className="panel">
            <h2><Users size={19} /> Beneficiaries</h2>
            <form className="beneficiary-form" onSubmit={addBeneficiary}>
              <input
                value={beneficiaryName}
                onChange={(event) => setBeneficiaryName(event.target.value)}
                placeholder="Name"
              />
              <input
                value={beneficiaryAccount}
                onChange={(event) => setBeneficiaryAccount(event.target.value)}
                placeholder="Account number"
                inputMode="numeric"
              />
              <button>Save</button>
            </form>
            <div className="beneficiary-list">
              {beneficiaries.length === 0 ? (
                <p className="muted">No saved beneficiaries yet.</p>
              ) : null}
              {beneficiaries.map((beneficiary) => (
                <button
                  className="beneficiary"
                  key={beneficiary.id}
                  onClick={() => setReceiverAccountNumber(beneficiary.accountNumber)}
                  type="button"
                >
                  <strong>{beneficiary.name}</strong>
                  <span>{accountNumber(beneficiary.accountNumber, accountNumbersHidden)}</span>
                </button>
              ))}
            </div>
          </article>

          <article className="panel transactions-panel">
            <h2><History size={19} /> Recent transfers</h2>
            <div className="transaction-list">
              {filteredTransactions.length === 0 ? (
                <p className="muted">No transactions yet.</p>
              ) : null}
              {filteredTransactions.slice(0, 6).map((transaction) => (
                <div className="transaction" key={transaction.id}>
                  <div className={transaction.direction}>
                    {transaction.direction === "incoming" ? (
                      <ArrowDownLeft size={18} />
                    ) : (
                      <ArrowUpRight size={18} />
                    )}
                  </div>
                  <div>
                    <strong>{transaction.description}</strong>
                    <span>
                      {transactionPartyLabel(transaction)
                        ? `${transactionPartyLabel(transaction)} · `
                        : ""}
                      {new Date(transaction.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <b>
                    {transaction.direction === "incoming" ? "+" : "-"}
                    {money(transaction.amount, selectedAccount?.currency || "USD", balanceHidden)}
                  </b>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      {activePage === "cards" ? (
        <section className="dashboard-grid">
          <article className="panel">
            <h2><CreditCard size={19} /> Cards</h2>
            <div className="card-list">
              {cards.map((card) => (
                <div className="bank-card" key={card.id}>
                  <small>{card.brand}</small>
                  <strong>•••• •••• •••• {card.last4}</strong>
                  <span>
                    Expires {String(card.expiryMonth).padStart(2, "0")}/
                    {card.expiryYear}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <h2><ShieldCheck size={19} /> Card controls</h2>
            <div className="security-list">
              <span>Virtual card status: {cardFrozen ? "Frozen" : "Active"}</span>
              <span>Online payments: Enabled</span>
              <span>ATM withdrawals: Enabled</span>
            </div>
            <button
              className={cardFrozen ? "" : "ghost-button"}
              onClick={() => setCardFrozen((current) => !current)}
              type="button"
            >
              {cardFrozen ? "Unfreeze card" : "Freeze card"}
            </button>
          </article>

          <article className="panel services-panel">
            <h2><ReceiptText size={19} /> Bills and airtime</h2>
            <textarea
              value={serviceDetail}
              onChange={(event) => setServiceDetail(event.target.value)}
              placeholder="Add request details"
              rows="4"
            />
            <div className="service-grid">
              <button onClick={() => submitService("Airtime", "Airtime top-up")} type="button">
                <Smartphone size={18} />
                Airtime
              </button>
              <button onClick={() => submitService("Bills", "Bill payment")} type="button">
                <FileText size={18} />
                Pay bills
              </button>
            </div>
          </article>
        </section>
      ) : null}

      {activePage === "insights" ? (
        <>
          <section className="overview-grid insights-metrics">
            <article className="metric-card">
              <CircleDollarSign size={22} />
              <span>Total USD assets</span>
              <strong>{money(totalAssets, "USD", balanceHidden)}</strong>
            </article>
            <article className="metric-card">
              <ArrowUpRight size={22} />
              <span>Outgoing activity</span>
              <strong>{money(monthlyOutflow, "USD", balanceHidden)}</strong>
            </article>
            <article className="metric-card">
              <ShieldCheck size={22} />
              <span>KYC status</span>
              <strong>{kycPercent}% complete</strong>
            </article>
            <article className="metric-card">
              <Bell size={22} />
              <span>Notifications</span>
              <strong>{notifications.length}</strong>
            </article>
          </section>

          <section className="dashboard-grid insights-grid">
            <article className="panel">
              <h2><Bell size={19} /> Notifications</h2>
              <div className="notification-list">
                {notifications.map((notification) => (
                  <div className="notification" key={notification}>
                    <Bell size={16} />
                    <span>{notification}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel analytics-panel">
              <h2><SlidersHorizontal size={19} /> Spending analytics</h2>
              <div className="analytics-list">
                {spendingAnalytics.map((item) => (
                  <div className="analytics-row" key={item.label}>
                    <span>{item.label}</span>
                    <div>
                      <i
                        style={{
                          width: `${Math.min(100, Math.max(12, item.value / 8))}%`,
                          background: item.color
                        }}
                      />
                    </div>
                    <strong>{money(item.value, "USD", balanceHidden)}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <h2><Lock size={19} /> Security and KYC</h2>
              <div className="progress-track">
                <span style={{ width: `${kycPercent}%` }} />
              </div>
              <div className="check-list">
                {kycItems.map((item) => (
                  <div className={item.complete ? "check complete" : "check"} key={item.label}>
                    <ShieldCheck size={16} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="security-list">
                <span>Two-factor authentication: Demo ready</span>
                <span>Last login: Current device</span>
                <span>Trusted devices: 1</span>
              </div>
            </article>

            <article className="panel">
              <h2><Target size={19} /> Investment goals</h2>
              <div className="goal-list">
                {investmentAccounts.length === 0 ? (
                  <p className="muted">Create an investment account to track a goal.</p>
                ) : null}
                {investmentAccounts.map((account) => {
                  const goal = account.accountSubType === "House Mortgage" ? 50000 : account.accountSubType === "Car" ? 18000 : 12000;
                  const progress = Math.min(100, Math.round((account.balance / goal) * 100));

                  return (
                    <div className="goal" key={account.id}>
                      <div>
                        <strong>{account.accountName}</strong>
                        <span>{progress}% of {money(goal)}</span>
                      </div>
                      <div className="progress-track">
                        <span style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="panel">
              <h2><Calculator size={19} /> Loan calculator</h2>
              <div className="two-column-form">
                <label>
                  Amount
                  <input
                    value={loanAmount}
                    onChange={(event) => setLoanAmount(event.target.value)}
                    type="number"
                  />
                </label>
                <label>
                  Months
                  <input
                    value={loanMonths}
                    onChange={(event) => setLoanMonths(event.target.value)}
                    type="number"
                  />
                </label>
              </div>
              <div className="result-box">
                <span>Estimated monthly repayment</span>
                <strong>{money(estimatedLoanPayment)}</strong>
              </div>
              <button
                onClick={() =>
                  submitService(
                    "Loan",
                    `Loan request for ${money(Number(loanAmount) || 0)} over ${loanMonths} months`
                  )
                }
                type="button"
              >
                Request loan
              </button>
            </article>
          </section>
        </>
      ) : null}

      {activePage === "profile" ? (
        <section className="dashboard-grid">
          <article className="panel profile-panel">
            <h2><UserPlus size={19} /> Profile</h2>
            <div className="profile-row">
              <div className="avatar">
                {profilePreview ? <img src={profilePreview} alt="" /> : <Users size={28} />}
              </div>
              <div>
                <strong>{user.fullName}</strong>
                <span>{user.email}</span>
                <span>{user.phone}</span>
              </div>
            </div>
            <div className="upload-grid">
              <label className="upload-box">
                <Upload size={18} />
                Profile photo
                <input accept="image/*" onChange={handleProfilePhoto} type="file" />
              </label>
              <label className="upload-box">
                <Upload size={18} />
                ID document
                <input onChange={handleIdDocument} type="file" />
              </label>
            </div>
            <button onClick={saveDocuments} type="button">
              Save documents
            </button>
          </article>

          <article className="panel">
            <h2><Lock size={19} /> Verification</h2>
            <div className="progress-track">
              <span style={{ width: `${kycPercent}%` }} />
            </div>
            <div className="check-list">
              {kycItems.map((item) => (
                <div className={item.complete ? "check complete" : "check"} key={item.label}>
                  <ShieldCheck size={16} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      {activePage === "support" ? (
        <section className="dashboard-grid">
          <article className="panel">
            <h2><MessageCircle size={19} /> Support chat</h2>
            <div className="chat-box">
              <p>Hello {user.fullName.split(" ")[0]}, Chybank support is ready.</p>
              {supportMessage ? <p className="user-chat">{supportMessage}</p> : null}
            </div>
            <div className="chat-form">
              <input
                value={supportMessage}
                onChange={(event) => setSupportMessage(event.target.value)}
                placeholder="Type a support message"
              />
              <button
                onClick={() => setMessage("Support message queued for review.")}
                type="button"
              >
                Send
              </button>
            </div>
          </article>

          <article className="panel services-panel">
            <h2><Phone size={19} /> Service requests</h2>
            <textarea
              value={serviceDetail}
              onChange={(event) => setServiceDetail(event.target.value)}
              placeholder="Describe what you need"
              rows="4"
            />
            <div className="service-grid">
              <button onClick={() => submitService("Support", "General support")} type="button">
                <MessageCircle size={18} />
                Support
              </button>
              <button onClick={() => submitService("Loan", "Loan consultation")} type="button">
                <Banknote size={18} />
                Loan help
              </button>
            </div>
          </article>

          <article className="panel">
            <h2><Bell size={19} /> Notifications</h2>
            <div className="notification-list">
              {notifications.map((notification) => (
                <div className="notification" key={notification}>
                  <Bell size={16} />
                  <span>{notification}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}
    </main>
  );
}

function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  return <Dashboard initialUser={user} onLogout={() => setUser(null)} />;
}

createRoot(document.getElementById("root")).render(<App />);
