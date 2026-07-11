const LIFE_BASE_ID = process.env.AIRTABLE_BASE_ID || process.env.LIFE_TRACKER_BASE_ID || "appxSbFxzUd4xCbTn";
const FINANCE_BASE_ID =
  process.env.FINANCE_AIRTABLE_BASE_ID ||
  process.env.AIRTABLE_FINANCE_BASE_ID ||
  process.env.FINANCES_AIRTABLE_BASE_ID ||
  "appVlWgUhBB73PDa4";
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;

const TABLES = {
  tasks: process.env.AIRTABLE_TASKS_TABLE || "Tasks",
  notes: process.env.AIRTABLE_NOTES_TABLE || "Notes",
  links: process.env.AIRTABLE_LINKS_TABLE || process.env.LINKS_TABLE_ID || "tblyaYNEozqaeFWnp",
  clients: process.env.AIRTABLE_CLIENTS_TABLE || "Weekly Sessions",
  today: process.env.AIRTABLE_TODAY_TABLE || process.env.AIRTABLE_TODAY_I_WILL_TABLE || "Today I will",
  expenses: process.env.AIRTABLE_EXPENSES_TABLE || process.env.FINANCE_AIRTABLE_TABLE_ID || "tblTe5SntepDSbEpS",
  income: process.env.AIRTABLE_INCOME_TABLE || "Income",
  debt: process.env.AIRTABLE_DEBT_TABLE || "Total Debt",
};

const TODAY_FIELDS = {
  date: process.env.AIRTABLE_TODAY_DATE_FIELD || "Checklist Date",
  text: process.env.AIRTABLE_TODAY_TEXT_FIELD || "Content",
  done: process.env.AIRTABLE_TODAY_DONE_FIELD || "Done",
};

const TODAY_DONE_FIELD_CANDIDATES = unique([
  TODAY_FIELDS.done,
  "Done",
  "Complete",
  "Completed",
  "Checked",
  "Finished",
]);

const OUTREACH_SOURCES = {
  sessionSpot: {
    baseId: "appQxIhwr00DmKBx5",
    tableId: "tblsxRK2slF0KzZY6",
    label: "Session Spot Outreach",
    fields: { name: "Name", status: "Status", category: "Category", email: "Email", notes: "Notes", lastContacted: "Date Contacted", instagram: "Instagram" },
  },
  thdProvider: {
    baseId: "appQxIhwr00DmKBx5",
    tableId: "tbl7yZL1WhvA20rEW",
    label: "THD Provider",
    fields: { name: "Name", status: "Status", category: "Category", email: "Email", notes: "Notes", website: "Website" },
  },
  devi: {
    baseId: "appQxIhwr00DmKBx5",
    tableId: "tblHqOpJcdFASnpDl",
    label: "Devi",
    fields: { name: "Name", status: "Status", category: "Category", email: "Email", notes: "Notes", website: "Website" },
  },
};

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return respond({});
  if (event.httpMethod !== "POST") return respond({ ok: false, error: "Use POST." }, 405);

  try {
    const { action, payload = {} } = JSON.parse(event.body || "{}");
    if (!AIRTABLE_PAT) return respond({ ok: true, mode: "sample", data: sampleData(), message: "Missing AIRTABLE_PAT." });

    if (action === "dashboard.load") return respond({ ok: true, mode: "live", data: await loadDashboard() });

    const [domain, ...parts] = String(action || "").split(".");
    const verb = parts.join(".");
    if (domain === "finances") return respond({ ok: true, data: await handleFinance(verb, payload) });
    if (["tasks", "notes", "links", "clients", "today"].includes(domain)) return respond({ ok: true, data: await handleRecord(domain, verb, payload) });
    if (domain === "outreach") return respond({ ok: true, data: await handleOutreach(verb, payload) });

    return respond({ ok: false, error: `Unknown action: ${action}` }, 400);
  } catch (error) {
    return respond({ ok: false, error: error.message || String(error) }, 500);
  }
}

async function loadDashboard() {
  const [tasks, notes, links, clients, todayItems, expenses, income, debt, outreach] = await Promise.all([
    safeList(LIFE_BASE_ID, TABLES.tasks, mapTask),
    safeList(LIFE_BASE_ID, TABLES.notes, mapNote),
    safeList(LIFE_BASE_ID, TABLES.links, mapLink),
    safeList(LIFE_BASE_ID, TABLES.clients, mapClient),
    safeList(LIFE_BASE_ID, TABLES.today, mapTodayItem),
    safeList(FINANCE_BASE_ID, TABLES.expenses, mapExpense),
    safeList(FINANCE_BASE_ID, TABLES.income, mapIncome),
    safeList(FINANCE_BASE_ID, TABLES.debt, mapDebt),
    loadOutreach(),
  ]);
  return { tasks, notes, links, clients, todayItems, finances: { expenses, income, debt }, outreach };
}

async function handleRecord(kind, verb, payload) {
  const table = TABLES[kind];
  if (kind === "today") return handleTodayRecord(verb, payload);
  const fields = fieldsFor(kind, payload);
  if (verb === "create") return createRecord(LIFE_BASE_ID, table, fields);
  if (verb === "update") return updateRecord(LIFE_BASE_ID, table, payload.id, fields);
  if (verb === "delete") return deleteRecord(LIFE_BASE_ID, table, payload.id);
  throw new Error(`Unsupported ${kind} action: ${verb}`);
}

async function handleTodayRecord(verb, payload) {
  const table = TABLES.today;
  if (verb === "create") return createRecord(LIFE_BASE_ID, table, fieldsFor("today", payload));
  if (verb === "update") {
    const isDoneOnlyUpdate = payload.done !== undefined && payload.text === undefined && payload.date === undefined;
    if (isDoneOnlyUpdate) return updateTodayDone(table, payload.id, Boolean(payload.done));
    return updateRecord(LIFE_BASE_ID, table, payload.id, fieldsFor("today", payload));
  }
  if (verb === "delete") return deleteRecord(LIFE_BASE_ID, table, payload.id);
  throw new Error(`Unsupported today action: ${verb}`);
}

async function updateTodayDone(table, id, done) {
  let lastError;
  for (const fieldName of TODAY_DONE_FIELD_CANDIDATES) {
    try {
      return await updateRecord(LIFE_BASE_ID, table, id, { [fieldName]: done });
    } catch (error) {
      lastError = error;
      if (!isFieldNameError(error)) break;
    }
  }
  throw lastError || new Error("Could not update Today I will checkbox.");
}

async function handleFinance(verb, payload) {
  const [type, op] = String(verb || "").split(".");
  const table = TABLES[type];
  if (!table) throw new Error(`Unknown finance table: ${type}`);
  const fields = financeFieldsFor(type, payload);
  if (op === "create") return createRecord(FINANCE_BASE_ID, table, fields);
  if (op === "update") return updateRecord(FINANCE_BASE_ID, table, payload.id, fields);
  if (op === "delete") return deleteRecord(FINANCE_BASE_ID, table, payload.id);
  throw new Error(`Unsupported finances action: ${verb}`);
}

async function handleOutreach(verb, payload) {
  const sourceKey = payload.sourceKey || "sessionSpot";
  const source = OUTREACH_SOURCES[sourceKey] || OUTREACH_SOURCES.sessionSpot;
  const fields = {};
  for (const [key, fieldName] of Object.entries(source.fields)) {
    if (payload[key] !== undefined && fieldName) fields[fieldName] = payload[key];
  }
  if (verb === "create") return createRecord(source.baseId, source.tableId, fields);
  if (verb === "update") return updateRecord(source.baseId, source.tableId, payload.id, fields);
  if (verb === "delete") return deleteRecord(source.baseId, source.tableId, payload.id);
  throw new Error(`Unsupported outreach action: ${verb}`);
}

async function loadOutreach() {
  const groups = await Promise.all(
    Object.entries(OUTREACH_SOURCES).map(([sourceKey, source]) =>
      safeList(source.baseId, source.tableId, (record) => mapOutreach(record, sourceKey, source))
    )
  );
  return groups.flat();
}

async function safeList(baseId, table, mapper) {
  try {
    return await listRecords(baseId, table, mapper);
  } catch {
    return [];
  }
}

async function listRecords(baseId, table, mapper) {
  let offset = "";
  const records = [];
  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);
    const json = await airtable(baseId, table, `?${params.toString()}`);
    records.push(...(json.records || []).map(mapper));
    offset = json.offset || "";
  } while (offset && records.length < 1200);
  return records;
}

async function createRecord(baseId, table, fields) {
  return airtable(baseId, table, "", { method: "POST", body: JSON.stringify({ fields: clean(fields) }) });
}

async function updateRecord(baseId, table, id, fields) {
  if (!id) throw new Error("Missing record id.");
  return airtable(baseId, `${table}/${id}`, "", { method: "PATCH", body: JSON.stringify({ fields: clean(fields) }) });
}

async function deleteRecord(baseId, table, id) {
  if (!id) throw new Error("Missing record id.");
  return airtable(baseId, `${table}/${id}`, "", { method: "DELETE" });
}

async function airtable(baseId, path, suffix = "", options = {}) {
  const url = `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodePath(path)}${suffix}`;
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${AIRTABLE_PAT}`,
      "Content-Type": "application/json",
    },
    body: options.body,
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error?.message || `Airtable request failed: ${response.status}`);
  return json;
}

function encodePath(path) {
  return String(path)
    .split("/")
    .map((part) => (part.startsWith("tbl") || part.startsWith("rec") ? part : encodeURIComponent(part)))
    .join("/");
}

function fieldsFor(kind, payload) {
  if (kind === "tasks") {
    return {
      "Task Name": payload.title,
      "Due Date": payload.dueDate,
      "Due Time": payload.dueTime,
      Status: payload.status || "Open",
      Priority: payload.priority,
      Category: payload.category,
      Notes: payload.notes,
    };
  }
  if (kind === "notes") return { "Note Title": payload.title, Category: payload.category, Body: payload.content };
  if (kind === "links") return { Name: payload.title, Link: payload.url, Category: payload.category, Notes: payload.notes };
  if (kind === "clients") {
    const fields = {};
    if (payload.name !== undefined) fields["Client Name"] = payload.name;
    if (payload.status !== undefined) fields.Status = payload.status;
    if (payload.nextSession !== undefined) fields["Session Date"] = payload.nextSession;
    if (payload.weekOf !== undefined) fields["Week Of"] = payload.weekOf;
    if (payload.notes !== undefined) fields.Notes = payload.notes;
    if (payload.rate !== undefined) fields["Session Price"] = Number(payload.rate || 0);
    if (payload.duration !== undefined) fields["Session Duration"] = payload.duration;
    if (payload.sessionHeld !== undefined) fields["Session Held"] = Boolean(payload.sessionHeld);
    if (payload.noteDone !== undefined) fields["Note Done"] = Boolean(payload.noteDone);
    if (payload.nextSessionScheduled !== undefined) fields["Next Session Scheduled"] = Boolean(payload.nextSessionScheduled);
    if (payload.nextSessionPrepared !== undefined) fields["Next Session Prepared"] = Boolean(payload.nextSessionPrepared);
    return fields;
  }
  if (kind === "today") {
    const fields = {};
    if (payload.date !== undefined) fields[TODAY_FIELDS.date] = payload.date;
    if (payload.text !== undefined) fields[TODAY_FIELDS.text] = payload.text;
    if (payload.done !== undefined) fields[TODAY_FIELDS.done] = Boolean(payload.done);
    return fields;
  }
  return {};
}

function financeFieldsFor(type, payload) {
  if (type === "expenses") {
    const fields = {};
    if (payload.name !== undefined) fields["Expense Name"] = payload.name;
    if (payload.month !== undefined) fields.Month = payload.month;
    if (payload.year !== undefined) fields.Year = payload.year;
    if (payload.amount !== undefined) fields.Amount = Number(payload.amount || 0);
    if (payload.category !== undefined) fields.Category = payload.category;
    if (payload.frequency !== undefined) fields.Frequency = payload.frequency;
    if (payload.notes !== undefined) fields.Notes = payload.notes;
    if (payload.paid !== undefined) fields.Paid = Boolean(payload.paid);
    return fields;
  }
  if (type === "income") {
    const fields = {};
    if (payload.source !== undefined) fields.Source = payload.source;
    if (payload.month !== undefined) fields.Month = payload.month;
    if (payload.year !== undefined) fields.Year = payload.year;
    if (payload.amount !== undefined) fields.Amount = Number(payload.amount || 0);
    if (payload.date !== undefined) fields.Income = payload.date;
    return fields;
  }
  if (type === "debt") {
    const fields = {};
    if (payload.name !== undefined) fields.Name = payload.name;
    if (payload.remaining !== undefined) fields.Remaining = Number(payload.remaining || 0);
    if (payload.payment !== undefined) fields.Amount = Number(payload.payment || 0);
    if (payload.lastPaid !== undefined) fields["Last paid"] = payload.lastPaid;
    return fields;
  }
  return {};
}

function mapTask(record) {
  const f = record.fields || {};
  return { id: record.id, title: pick(f, "Task Name", "Task", "Title", "Name"), dueDate: pick(f, "Due Date", "Date", "Calendar Date"), dueTime: pick(f, "Due Time", "Calendar Start Time"), status: pick(f, "Status") || "Open", priority: pick(f, "Priority"), category: pick(f, "Category"), notes: pick(f, "Notes", "Description") };
}

function mapNote(record) {
  const f = record.fields || {};
  return { id: record.id, title: pick(f, "Note Title", "Title", "Name"), category: pick(f, "Category"), content: pick(f, "Body", "Content", "Notes", "Note"), updatedAt: pick(f, "Updated", "Last Modified") };
}

function mapLink(record) {
  const f = record.fields || {};
  return { id: record.id, title: pick(f, "Name", "Title", "Link Name"), url: pick(f, "Link", "URL", "Url"), category: pick(f, "Category"), notes: pick(f, "Notes") };
}

function mapClient(record) {
  const f = record.fields || {};
  return {
    id: record.id,
    name: pick(f, "Name", "Client", "Client Name"),
    status: pick(f, "Status", "Session Status"),
    email: pick(f, "Email"),
    nextSession: pick(f, "Session Date", "Date", "Start", "Start Time", "Appointment Date", "Next Session"),
    weekOf: pick(f, "Week Of", "Week", "Week Start"),
    rate: pick(f, "Session Price", "Rate", "Session Rate", "Amount", "Session Amount"),
    duration: pick(f, "Session Duration", "Duration"),
    nextSessionDate: pick(f, "Next Session Date"),
    sessionHeld: Boolean(pick(f, "Session Held", "Held")),
    noteDone: Boolean(pick(f, "Note Done", "Note")),
    nextSessionScheduled: Boolean(pick(f, "Next Session Scheduled", "Scheduled")),
    nextSessionPrepared: Boolean(pick(f, "Next Session Prepared", "Prepared")),
    paid: Boolean(pick(f, "Paid")),
    notes: pick(f, "Notes"),
  };
}

function mapTodayItem(record) {
  const f = record.fields || {};
  const done = pick(f, TODAY_FIELDS.done, "Done", "Completed", "Complete", "Checked", "Finished");
  return {
    id: record.id,
    text: pick(f, TODAY_FIELDS.text, "Content", "Item", "Task", "Task Name", "Title", "Name", "Today I will"),
    date: pick(f, TODAY_FIELDS.date, "Checklist Date", "Date", "Day"),
    done: done === true || String(done).toLowerCase() === "true" || String(done).toLowerCase() === "done" || String(done).toLowerCase() === "completed",
  };
}

function mapExpense(record) {
  const f = record.fields || {};
  const paid = pick(f, "Paid", "Paid?", "Complete", "Completed");
  const status = pick(f, "Status", "Payment Status");
  return { id: record.id, name: pick(f, "Expense Name", "Name"), month: pick(f, "Month", "Expense Month", "Month Year", "Billing Month"), year: pick(f, "Year"), date: pick(f, "Date", "Due Date", "Expense Date"), amount: num(pick(f, "Amount", "Paid Amount", "Expense Amount", "Total")), paid: isChecked(paid) || isPaidStatus(status), category: pick(f, "Category"), frequency: pick(f, "Frequency"), notes: pick(f, "Notes") };
}

function mapIncome(record) {
  const f = record.fields || {};
  return { id: record.id, date: pick(f, "Income", "Date"), amount: num(pick(f, "Amount")), source: pick(f, "Source"), month: pick(f, "Month"), year: pick(f, "Year") };
}

function mapDebt(record) {
  const f = record.fields || {};
  return { id: record.id, name: pick(f, "Name", "Debt Name", "Loan Name"), remaining: num(pick(f, "Remaining")), amount: num(pick(f, "Amount")), payment: num(pick(f, "Payment", "Amount")), lastPaid: pick(f, "Last paid", "Last Paid") };
}

function mapOutreach(record, sourceKey, source) {
  const f = record.fields || {};
  const fields = source.fields;
  return {
    id: record.id,
    sourceKey,
    source: source.label,
    name: f[fields.name] || f[fields.displayName] || "",
    status: f[fields.status] || "Pending",
    category: f[fields.category] || "",
    email: f[fields.email] || "",
    website: f[fields.website] || f[fields.instagram] || "",
    notes: f[fields.notes] || "",
  };
}

function pick(fields, ...names) {
  for (const name of names) {
    const value = fields[name];
    if (Array.isArray(value)) return value.join(", ");
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
}

function clean(fields) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined && value !== ""));
}

function isFieldNameError(error) {
  return /unknown field|field .*does not exist|invalid field|cannot accept/i.test(String(error?.message || ""));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function num(value) {
  return Number(value || 0);
}

function isChecked(value) {
  if (value === true) return true;
  const text = String(value || "").toLowerCase();
  return text === "true" || text === "yes" || text === "paid" || text === "done" || text === "complete" || text === "completed";
}

function isPaidStatus(value) {
  const text = String(value || "").trim().toLowerCase();
  return text === "paid" || text === "complete" || text === "completed";
}

function respond(body, statusCode = 200) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

function sampleData() {
  return {
    tasks: [],
    notes: [],
    links: [],
    clients: [],
    todayItems: [],
    outreach: [],
    finances: { expenses: [], income: [], debt: [] },
  };
}
