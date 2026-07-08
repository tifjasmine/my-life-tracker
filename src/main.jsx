import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  BarChart3,
  BookOpenText,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  ContactRound,
  Edit3,
  ExternalLink,
  FileText,
  Home,
  LayoutDashboard,
  Link as LinkIcon,
  LockKeyhole,
  Loader2,
  Menu,
  MessageSquarePlus,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UsersRound,
  X,
  Zap,
} from "lucide-react";
import "./styles.css";

const SECTIONS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tasks", label: "Tasks", icon: Check },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "links", label: "Links", icon: LinkIcon },
  { id: "clients", label: "Clients", icon: ContactRound },
  { id: "notes", label: "Notes", icon: BookOpenText },
  { id: "finances", label: "Finances", icon: CircleDollarSign },
  { id: "outreach", label: "Outreach", icon: Send },
];

const SAMPLE = {
  tasks: [
    { id: "sample-task-1", title: "Review this week's client follow-ups", status: "Open", dueDate: today(), category: "Clients", priority: "High" },
    { id: "sample-task-2", title: "Update monthly budget notes", status: "Open", dueDate: addDays(1), category: "Finances", priority: "Medium" },
  ],
  links: [
    { id: "sample-link-1", title: "Airtable", url: "https://airtable.com", category: "Work", notes: "Primary data home" },
    { id: "sample-link-2", title: "Netlify", url: "https://app.netlify.com", category: "Deployments", notes: "Site hosting" },
  ],
  clients: [
    { id: "sample-client-1", name: "Sample Client", status: "Active", nextSession: today(), notes: "Replace with Airtable data after env setup." },
  ],
  notes: [
    { id: "sample-note-1", title: "Migration note", content: "This PWA is ready for Netlify. Set AIRTABLE_PAT and table env vars to connect live data.", category: "Setup", updatedAt: new Date().toISOString() },
  ],
  outreach: [
    { id: "sample-outreach-1", name: "Sample Contact", status: "Pending", category: "Provider", email: "hello@example.com", notes: "Imported from outreach hub shape." },
  ],
  finances: {
    expenses: [{ id: "sample-expense-1", name: "Software", month: monthName(), amount: 29, paid: false, category: "Tools" }],
    income: [{ id: "sample-income-1", source: "Sample Income", month: monthName(), amount: 100 }],
    debt: [{ id: "sample-debt-1", name: "Sample Debt", remaining: 500, payment: 50 }],
  },
};

function App() {
  const [active, setActive] = useState("dashboard");
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("lifeTrackerUnlocked") === "true");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState(SAMPLE);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");

  const activeSection = SECTIONS.find((section) => section.id === active) || SECTIONS[0];
  const stats = useMemo(() => summarize(data), [data]);

  async function loadData() {
    setLoading(true);
    setNotice("");
    try {
      const result = await api("dashboard.load", {});
      if (result.ok && result.data) {
        setData(mergeData(result.data));
        setNotice(result.mode === "sample" ? "Using sample data until Airtable env vars are set." : "Live data loaded.");
      } else {
        setNotice(result.error || "Using sample data until the backend is configured.");
      }
    } catch (error) {
      setNotice(error.message || "Could not load live data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  }, []);

  useEffect(() => {
    if (unlocked) loadData();
  }, [unlocked]);

  async function mutate(action, payload) {
    const result = await api(action, payload);
    if (!result.ok) throw new Error(result.error || "Request failed.");
    await loadData();
    return result;
  }

  if (!unlocked) {
    return (
      <LockScreen
        onUnlock={() => {
          sessionStorage.setItem("lifeTrackerUnlocked", "true");
          setUnlocked(true);
        }}
      />
    );
  }

  return (
    <div className="app">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <button className="icon-button close-sidebar" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
          <X size={18} />
        </button>
        <div className="brand">
          <div className="brand-mark"><Home size={20} /></div>
          <div>
            <strong>My Life Tracker</strong>
            <span>Private organizer</span>
          </div>
        </div>
        <nav>
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                className={active === section.id ? "active" : ""}
                onClick={() => {
                  setActive(section.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <Sparkles size={16} />
          <span>Built for quick capture, calm review, and fewer scattered tabs.</span>
        </div>
      </aside>

      <main className={active === "dashboard" ? "home-main" : ""}>
        {active !== "dashboard" && active !== "tasks" ? (
          <header className="topbar">
            <button className="icon-button menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
              <Menu size={20} />
            </button>
            <div>
              <p>{activeSection.label}</p>
              <h1>{sectionTitle(active)}</h1>
            </div>
            <div className="topbar-actions">
              <label className="search">
                <Search size={17} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search everything" />
              </label>
              <button className="button ghost" onClick={loadData} disabled={loading}>
                {loading ? <Loader2 className="spin" size={17} /> : <RefreshCw size={17} />}
                Refresh
              </button>
            </div>
          </header>
        ) : null}

        {notice && active !== "dashboard" && active !== "tasks" ? <div className="notice">{notice}</div> : null}

        {active === "dashboard" && <Dashboard data={data} stats={stats} setActive={setActive} mutate={mutate} query={query} />}
        {active === "tasks" && <TasksPage tasks={data.tasks} setActive={setActive} mutate={mutate} refresh={loadData} loading={loading} />}
        {active === "calendar" && <CalendarPage tasks={data.tasks} mutate={mutate} />}
        {active === "links" && <RecordsPage title="Links" kind="links" records={filterRecords(data.links, query, ["title", "url", "category", "notes"])} fields={linkFields} mutate={mutate} linkField="url" />}
        {active === "clients" && <RecordsPage title="Clients" kind="clients" records={filterRecords(data.clients, query, ["name", "status", "notes"])} fields={clientFields} mutate={mutate} />}
        {active === "notes" && <RecordsPage title="Notes" kind="notes" records={filterRecords(data.notes, query, ["title", "content", "category"])} fields={noteFields} mutate={mutate} />}
        {active === "finances" && <FinancesPage data={data.finances} mutate={mutate} />}
        {active === "outreach" && <RecordsPage title="Outreach" kind="outreach" records={filterRecords(data.outreach, query, ["name", "status", "category", "email", "notes"])} fields={outreachFields} mutate={mutate} linkField="website" />}
      </main>
    </div>
  );
}

function LockScreen({ onUnlock }) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    if (passcode === "2468") {
      setError("");
      onUnlock();
      return;
    }
    setError("That passcode did not match.");
    setPasscode("");
  }

  return (
    <main className="phone-stage">
      <section className="phone-shell">
        <div className="lock-hero">
          <div className="lock-icon"><LockKeyhole size={24} /></div>
          <span className="private-pill">Private</span>
          <p className="mini-label">Organizer app</p>
          <h1>Enter your space.</h1>
          <p>Unlock your command center.</p>
        </div>
        <form className="unlock-card" onSubmit={submit}>
          <label>
            <span>Passcode</span>
            <input
              value={passcode}
              onChange={(event) => setPasscode(event.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              type="password"
              placeholder="Enter passcode"
              autoFocus
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="peach-button" type="submit"><ShieldCheck size={17} /> Unlock Dashboard</button>
          <strong>Your future self is built by what you do today.</strong>
        </form>
        <article className="home-card locked-preview">
          <h3>Brain dump a task</h3>
          <p>Quickly add a task without opening the full dashboard.</p>
          <input disabled placeholder="Brain dump a task..." />
          <button className="outline-button" disabled>Add details</button>
          <button className="brown-button" disabled><Plus size={17} /> Random Now</button>
          <button className="orange-button" disabled><Sparkles size={17} /> Today's 5</button>
        </article>
        <article className="home-card locked-preview">
          <div className="today-head">
            <div>
              <h3>Today I will</h3>
              <p>Saved by date, ready after unlock.</p>
            </div>
            <span>0/0 done</span>
          </div>
          <label>
            <span>Checklist date</span>
            <input disabled value={todaySlash()} readOnly />
          </label>
          <button className="outline-button" disabled>Today</button>
          <input disabled placeholder="Add one thing for today..." />
          <button className="outline-button" disabled><Plus size={16} /> Add</button>
          <div className="empty-dashed">Unlock to add checklist items.</div>
        </article>
      </section>
    </main>
  );
}

function Dashboard({ data, stats, setActive, mutate }) {
  const upcoming = [...data.tasks]
    .filter((task) => String(task.status || "").toLowerCase() !== "done")
    .sort((a, b) => String(a.dueDate || "").localeCompare(String(b.dueDate || "")))
    .slice(0, 5);
  const recentNotes = [...data.notes].slice(0, 3);

  return <HomeDashboard data={data} stats={stats} upcoming={upcoming} setActive={setActive} mutate={mutate} />;
}

function HomeDashboard({ data, stats, upcoming, setActive, mutate }) {
  const [brainDump, setBrainDump] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailNotes, setDetailNotes] = useState("");
  const [homeSearch, setHomeSearch] = useState("");
  const todaysFive = data.tasks.filter((task) => task.category === "Today's 5");
  const sessionsThisWeek = data.clients.filter((client) => String(client.status || "").toLowerCase() !== "canceled").length;
  const unpaid = stats.unpaid || stats.expenses;
  const earnings = Math.max(0, sessionsThisWeek * 36.9);
  const potential = 966;
  const progress = Math.min(100, Math.round((earnings / potential) * 100));

  const actionRows = [
    { label: "Quick Actions", eyebrow: "Add + update", icon: Plus, onClick: () => setDetailsOpen(!detailsOpen) },
    { label: "Today's 5 Tasks", eyebrow: "Focus list", icon: Check, meta: "Open", onClick: () => setActive("tasks") },
    { label: "Habits", eyebrow: "Today", icon: ShieldCheck, meta: "Open", onClick: () => setActive("tasks") },
    { label: "Practice Clients", eyebrow: "Sessions", icon: UsersRound, meta: "Open", onClick: () => setActive("clients") },
    { label: "Today's Calendar", eyebrow: "Calendar only", icon: CalendarDays, meta: "Open", onClick: () => setActive("calendar") },
    { label: "Finances", eyebrow: monthYear(), icon: CircleDollarSign, meta: "Open", onClick: () => setActive("finances") },
    { label: "Notes", eyebrow: "5 most recent", icon: BookOpenText, meta: "Open", onClick: () => setActive("notes") },
    { label: "Links", eyebrow: `${data.links.length} saved`, icon: LinkIcon, meta: "Open", onClick: () => setActive("links") },
  ];

  async function addBrainDump(category) {
    if (!brainDump.trim()) return;
    await mutate("tasks.create", {
      title: brainDump.trim(),
      category,
      status: "Open",
      notes: detailNotes,
    });
    setBrainDump("");
    setDetailNotes("");
    setDetailsOpen(false);
  }

  return (
    <section className="unlocked-phone">
      <div className="command-hero">
        <p className="hero-date">{longDate()}</p>
        <h2>Afternoon, Tiffany.</h2>
        <p>Your calm command center for today.</p>
        <button className="refresh-pill" onClick={() => window.location.reload()}><RefreshCw size={17} /> Refresh</button>
        <div className="hero-pills">
          <button onClick={() => setActive("tasks")}>◎ Tasks</button>
          <button onClick={() => setActive("clients")}><UsersRound size={14} /> Clients</button>
          <button onClick={() => setActive("notes")}><BookOpenText size={14} /> Notes</button>
          <button onClick={() => setActive("links")}><LinkIcon size={14} /> Links</button>
        </div>
        <div className="earnings-card">
          <div>
            <span>Earned this week</span>
            <strong>{money(earnings)}</strong>
          </div>
          <div>
            <span>Potential</span>
            <strong>{money(potential)}</strong>
          </div>
          <div className="progress-bar"><i style={{ width: `${progress}%` }} /></div>
          <p>{progress}% of weekly potential · {sessionsThisWeek} sessions</p>
        </div>
      </div>

      <label className="home-search">
        <Search size={17} />
        <input value={homeSearch} onChange={(event) => setHomeSearch(event.target.value)} placeholder="Search tasks, clients, notes, finances..." />
      </label>

      <div className="metric-grid">
        <MetricCard icon={TargetIcon} value={todaysFive.length || 10} label="Today's 5" sub={`${stats.openTasks} open tasks`} tone="orange" onClick={() => setActive("tasks")} />
        <MetricCard icon={ShieldCheck} value="0/6" label="Habits" sub="0% done" tone="green" onClick={() => setActive("tasks")} />
        <MetricCard icon={UsersRound} value={sessionsThisWeek} label="Sessions this week" sub="0 sessions today" tone="purple" onClick={() => setActive("clients")} />
        <MetricCard icon={CircleDollarSign} value={money(unpaid)} label="Unpaid" sub={monthYear()} tone="red" onClick={() => setActive("finances")} />
      </div>

      <article className="home-card brain-card command-quick">
        <h3>Brain dump a task</h3>
        <input value={brainDump} onChange={(event) => setBrainDump(event.target.value)} placeholder="Brain dump a task..." />
        {detailsOpen ? <textarea value={detailNotes} onChange={(event) => setDetailNotes(event.target.value)} placeholder="Add details..." /> : null}
        <button className="outline-button" onClick={() => setDetailsOpen(!detailsOpen)}>Add details</button>
        <button className="brown-button" onClick={() => addBrainDump("Random Now")}><Plus size={17} /> Random Now</button>
        <button className="orange-button" onClick={() => addBrainDump("Today's 5")}><Sparkles size={17} /> Today's 5</button>
      </article>

      <div className="action-list">
        {actionRows.map((row) => (
          <ActionRow key={row.label} {...row} />
        ))}
      </div>

      <div className="bottom-nav">
        <button className="active"><Home size={18} />Unlocked</button>
        <button onClick={() => setActive("tasks")}><Check size={18} />Tasks</button>
        <button onClick={() => setActive("clients")}><UsersRound size={18} />Clients</button>
        <button onClick={() => setActive("links")}>•••<span>More</span></button>
        <button className="avatar">T</button>
      </div>
    </section>
  );
}

function MetricCard({ icon: Icon, value, label, sub, tone, onClick }) {
  return (
    <button className={`metric-card ${tone}`} onClick={onClick}>
      <span className="metric-icon"><Icon size={18} /></span>
      <ArrowUpRight className="metric-arrow" size={18} />
      <strong>{value}</strong>
      <em>{label}</em>
      <small>{sub}</small>
    </button>
  );
}

function ActionRow({ icon: Icon, eyebrow, label, meta, onClick }) {
  return (
    <button className="action-row" onClick={onClick}>
      <span className="action-icon"><Icon size={17} /></span>
      <span>
        <small>{eyebrow}</small>
        <strong>{label}</strong>
      </span>
      <em>{meta ? `${meta} →` : ""}</em>
      <span className="chev">⌄</span>
    </button>
  );
}

function TargetIcon(props) {
  return <Check {...props} />;
}

function TasksPage({ tasks = [], setActive, mutate, refresh, loading }) {
  const [brainDump, setBrainDump] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailNotes, setDetailNotes] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [includeCompleted, setIncludeCompleted] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [busyCreate, setBusyCreate] = useState(false);

  const categories = [
    "Dashboard",
    "Today's 5",
    "Random Now",
    "Random Later",
    "Habits",
    "Kids",
    "The Daily Session",
    "The Regulated Mother",
    "The Embodied Self",
    "Admin",
    "Household",
    "Husband and Family",
    "Me Time",
    "Supplies",
  ];

  const filtered = useMemo(() => {
    const term = taskSearch.trim().toLowerCase();
    return tasks.filter((task) => {
      const done = isTaskDone(task);
      const matchesTerm = !term || [task.title, task.category, task.status, task.priority, task.notes].some((value) => String(value || "").toLowerCase().includes(term));
      return matchesTerm && (includeCompleted || !done);
    });
  }, [tasks, taskSearch, includeCompleted]);

  const completed = tasks.filter(isTaskDone);
  const activeTasks = tasks.filter((task) => !isTaskDone(task));
  const dueToday = activeTasks.filter((task) => task.dueDate === today());
  const todaysFive = filtered.filter((task) => task.category === "Today's 5");
  const displayTasks = todaysFive.length ? todaysFive : filtered;
  const openTodayFive = displayTasks.filter((task) => !isTaskDone(task)).length;
  const completeTodayFive = displayTasks.filter(isTaskDone).length;

  async function addBrainDump(event) {
    event.preventDefault();
    if (!brainDump.trim()) return;
    setBusyCreate(true);
    try {
      await mutate("tasks.create", {
        title: brainDump.trim(),
        category: "Random Now",
        status: "Open",
        notes: detailNotes,
      });
      setBrainDump("");
      setDetailNotes("");
      setDetailsOpen(false);
    } finally {
      setBusyCreate(false);
    }
  }

  async function toggleTask(task) {
    setBusyId(task.id);
    try {
      await mutate("tasks.update", {
        ...task,
        status: isTaskDone(task) ? "Open" : "Completed",
      });
    } finally {
      setBusyId("");
    }
  }

  async function editTask(task) {
    const title = window.prompt("Edit task", task.title || "");
    if (!title || title.trim() === task.title) return;
    setBusyId(task.id);
    try {
      await mutate("tasks.update", { ...task, title: title.trim() });
    } finally {
      setBusyId("");
    }
  }

  async function deleteTask(task) {
    if (!window.confirm("Delete this task?")) return;
    setBusyId(task.id);
    try {
      await mutate("tasks.delete", task);
    } finally {
      setBusyId("");
    }
  }

  async function starTask(task) {
    setBusyId(task.id);
    try {
      await mutate("tasks.update", {
        ...task,
        priority: task.priority === "Starred" ? "" : "Starred",
      });
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="tasks-page">
      <header className="tasks-header">
        <div className="tasks-brand-row">
          <div>
            <h1>My Life Tracker</h1>
            <p>{longDateWithYear()}</p>
          </div>
          <button className="tasks-avatar" aria-label="Profile">T</button>
        </div>
        <div className="task-chip-row" aria-label="Task categories">
          {categories.map((category) => (
            <button
              key={category}
              className={category === "Dashboard" ? "active" : ""}
              onClick={() => (category === "Dashboard" ? setActive("dashboard") : setTaskSearch(category === "Today's 5" ? "Today's 5" : category))}
            >
              {taskCategoryIcon(category)} {category}
            </button>
          ))}
        </div>
      </header>

      <div className="tasks-content">
        <form className="task-capture" onSubmit={addBrainDump}>
          <label>
            <Zap size={17} />
            <input value={brainDump} onChange={(event) => setBrainDump(event.target.value)} placeholder="Brain dump a task into Random Now..." />
          </label>
          <button className="task-details-button" type="button" onClick={() => setDetailsOpen(!detailsOpen)}>
            Add details <ChevronDown size={15} />
          </button>
          <button className="task-add-button" disabled={busyCreate} type="submit">
            {busyCreate ? <Loader2 className="spin" size={16} /> : null}
            Add to Random Now
          </button>
          {detailsOpen ? (
            <textarea value={detailNotes} onChange={(event) => setDetailNotes(event.target.value)} placeholder="Add details..." />
          ) : null}
        </form>

        <div className="task-search-card">
          <label>
            <Search size={20} />
            <input value={taskSearch} onChange={(event) => setTaskSearch(event.target.value)} placeholder="Search tasks..." />
          </label>
          <label className="include-completed">
            <input type="checkbox" checked={includeCompleted} onChange={(event) => setIncludeCompleted(event.target.checked)} />
            Include completed
          </label>
        </div>

        <article className="encouragement-card">
          <p>Good afternoon — let's make today count.</p>
          <em>"Rest is part of the plan, not a break from it."</em>
        </article>

        <div className="task-stats">
          <TaskStat value={dueToday.length} label="Due Today" />
          <TaskStat value={completed.length} label="Completed" />
          <TaskStat value={activeTasks.length} label="Active" />
        </div>

        <article className="task-section-card">
          <div className="task-section-head">
            <div>
              <h2>Today's 5 ({displayTasks.length})</h2>
              <p>{openTodayFive} open · {completeTodayFive} complete</p>
            </div>
            <button aria-label="Collapse Today's 5"><ChevronDown size={18} /></button>
          </div>
          <div className="task-list">
            {displayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                busy={busyId === task.id}
                onToggle={() => toggleTask(task)}
                onEdit={() => editTask(task)}
                onDelete={() => deleteTask(task)}
                onStar={() => starTask(task)}
              />
            ))}
            {!displayTasks.length ? <div className="empty-dashed">No tasks found for this view.</div> : null}
          </div>
        </article>
      </div>

      <div className="bottom-nav">
        <button onClick={() => setActive("dashboard")}><Home size={18} />Unlocked</button>
        <button className="active"><Check size={18} />Tasks</button>
        <button onClick={() => setActive("clients")}><UsersRound size={18} />Clients</button>
        <button onClick={() => setActive("links")}>•••<span>More</span></button>
        <button className="avatar" onClick={refresh} disabled={loading}>T</button>
      </div>
    </section>
  );
}

function TaskStat({ value, label }) {
  return (
    <div className="task-stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function TaskCard({ task, busy, onToggle, onEdit, onDelete, onStar }) {
  const done = isTaskDone(task);
  return (
    <article className={`task-card ${done ? "done" : ""}`}>
      <button className="task-check" onClick={onToggle} disabled={busy} aria-label={done ? "Mark task open" : "Mark task completed"}>
        {busy ? <Loader2 className="spin" size={14} /> : done ? <Check size={14} /> : null}
      </button>
      <div className="task-card-body">
        <h3>{task.title || "Untitled task"}</h3>
        <div className="task-pills">
          {task.category ? <span>{task.category}</span> : null}
          {task.status ? <span>{task.status}</span> : null}
          {task.dueDate ? <span>{task.dueDate}</span> : null}
        </div>
      </div>
      <div className="task-actions">
        <button className={task.priority === "Starred" ? "starred" : ""} onClick={onStar} disabled={busy} aria-label="Star task"><Star size={18} /></button>
        <button onClick={onEdit} disabled={busy} aria-label="Edit task"><Edit3 size={18} /></button>
        <button className="danger" onClick={onDelete} disabled={busy} aria-label="Delete task"><Trash2 size={18} /></button>
      </div>
    </article>
  );
}

function RecordsPage({ title, kind, records, fields, mutate, linkField }) {
  const blank = Object.fromEntries(fields.map((field) => [field.name, field.default || ""]));
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const form = editing || blank;

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await mutate(`${kind}.${form.id ? "update" : "create"}`, form);
      setEditing(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section-stack">
      <div className="section-head">
        <div>
          <p className="eyebrow">{records.length} records</p>
          <h2>{title}</h2>
        </div>
        <button className="button" onClick={() => setEditing(blank)}><Plus size={17} /> New</button>
      </div>

      {editing ? (
        <form className="editor" onSubmit={save}>
          <div className="editor-head">
            <strong>{form.id ? "Edit record" : "New record"}</strong>
            <button type="button" className="icon-button" onClick={() => setEditing(null)} aria-label="Close form"><X size={18} /></button>
          </div>
          <div className="form-grid">
            {fields.map((field) => (
              <label key={field.name} className={field.long ? "wide" : ""}>
                <span>{field.label}</span>
                {field.type === "textarea" ? (
                  <textarea value={form[field.name] || ""} onChange={(event) => setEditing({ ...form, [field.name]: event.target.value })} />
                ) : (
                  <input type={field.type || "text"} value={form[field.name] || ""} onChange={(event) => setEditing({ ...form, [field.name]: event.target.value })} />
                )}
              </label>
            ))}
          </div>
          <div className="form-actions">
            <button type="button" className="button ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button className="button" disabled={busy}>{busy ? <Loader2 className="spin" size={17} /> : <Check size={17} />} Save</button>
          </div>
        </form>
      ) : null}

      <div className="record-grid">
        {records.map((record) => (
          <article className="record-card" key={record.id}>
            <div>
              <h3>{record.title || record.name || record.source || "Untitled"}</h3>
              <p>{record.notes || record.content || record.category || record.status || "No extra details yet."}</p>
            </div>
            <div className="meta-row">
              {record.status ? <span>{record.status}</span> : null}
              {record.category ? <span>{record.category}</span> : null}
              {record.dueDate ? <span>{record.dueDate}</span> : null}
              {record.amount ? <span>{money(record.amount)}</span> : null}
            </div>
            <div className="card-actions">
              {linkField && record[linkField] ? (
                <a className="button ghost" href={normalizeUrl(record[linkField])} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open</a>
              ) : null}
              <button className="button ghost" onClick={() => setEditing(record)}><Edit3 size={16} /> Edit</button>
            </div>
          </article>
        ))}
        {!records.length ? <EmptyState label={`No ${title.toLowerCase()} found.`} /> : null}
      </div>
    </section>
  );
}

function CalendarPage({ tasks, mutate }) {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const datedTasks = tasks.filter((task) => task.dueDate);

  async function addTaskEvent(task) {
    await mutate("tasks.update", { ...task, addToCalendar: true });
  }

  return (
    <section className="section-stack">
      <div className="section-head">
        <div>
          <p className="eyebrow">Calendar</p>
          <h2>Schedule and due dates</h2>
        </div>
        <button className="button" onClick={() => connectGoogle(setConnected, setEvents)}>
          <CalendarDays size={17} /> {connected ? "Reconnect Google" : "Connect Google"}
        </button>
      </div>
      <div className="calendar-layout">
        <Panel title="Task dates">
          <List records={datedTasks} primary="title" secondary={(item) => [item.dueDate, item.priority].filter(Boolean).join(" • ")} empty="No dated tasks." action={(task) => <button onClick={() => addTaskEvent(task)}>Add flag</button>} />
        </Panel>
        <Panel title="Google events">
          <List records={events} primary="summary" secondary={(item) => item.start || item.calendar || ""} empty="Connect Google Calendar to show live events." />
        </Panel>
      </div>
    </section>
  );
}

function FinancesPage({ data, mutate }) {
  const [tab, setTab] = useState("expenses");
  const records = data?.[tab] || [];
  const fields = tab === "expenses" ? expenseFields : tab === "income" ? incomeFields : debtFields;

  return (
    <section className="section-stack">
      <div className="section-head">
        <div>
          <p className="eyebrow">Money</p>
          <h2>Finances</h2>
        </div>
        <div className="tabs">
          {["expenses", "income", "debt"].map((item) => (
            <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>
          ))}
        </div>
      </div>
      <RecordsPage title={tab} kind={`finances.${tab}`} records={records} fields={fields} mutate={mutate} />
    </section>
  );
}

function Panel({ title, children, action, onAction }) {
  return (
    <article className="panel">
      <div className="panel-head">
        <h3>{title}</h3>
        {action ? <button onClick={onAction}>{action} <ArrowUpRight size={15} /></button> : null}
      </div>
      {children}
    </article>
  );
}

function List({ records, primary, secondary, empty, action }) {
  if (!records.length) return <EmptyState label={empty} />;
  return (
    <div className="list">
      {records.map((record) => (
        <div className="list-row" key={record.id}>
          <div>
            <strong>{record[primary] || "Untitled"}</strong>
            <span>{typeof secondary === "function" ? secondary(record) : record[secondary]}</span>
          </div>
          {action ? action(record) : null}
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }) {
  return <div className="stat"><strong>{value}</strong><span>{label}</span></div>;
}

function EmptyState({ label }) {
  return <div className="empty"><FileText size={28} /><span>{label}</span></div>;
}

async function api(action, payload) {
  const response = await fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  return response.json();
}

async function connectGoogle(setConnected, setEvents) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId || !window.google?.accounts?.oauth2) {
    setEvents([{ id: "google-help", summary: "Add VITE_GOOGLE_CLIENT_ID and load the Google Identity script to enable live Google Calendar.", start: "Setup needed" }]);
    return;
  }
  const tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly",
    callback: async ({ access_token }) => {
      setConnected(true);
      const now = new Date();
      const max = new Date(now);
      max.setDate(now.getDate() + 14);
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${now.toISOString()}&timeMax=${max.toISOString()}`;
      const response = await fetch(url, { headers: { Authorization: `Bearer ${access_token}` } });
      const json = await response.json();
      setEvents((json.items || []).map((item) => ({ id: item.id, summary: item.summary, start: item.start?.dateTime || item.start?.date, calendar: "Primary" })));
    },
  });
  tokenClient.requestAccessToken();
}

function summarize(data) {
  const expenses = sum(data.finances?.expenses, "amount");
  const income = sum(data.finances?.income, "amount");
  const debt = sum(data.finances?.debt, "remaining");
  const unpaid = sum((data.finances?.expenses || []).filter((item) => !item.paid), "amount");
  return {
    openTasks: (data.tasks || []).filter((task) => String(task.status || "").toLowerCase() !== "done").length,
    clients: data.clients?.length || 0,
    links: data.links?.length || 0,
    expenses,
    income,
    debt,
    unpaid,
  };
}

function isTaskDone(task) {
  const status = String(task?.status || "").toLowerCase();
  return status.includes("done") || status.includes("complete");
}

function mergeData(live) {
  return {
    tasks: live.tasks || SAMPLE.tasks,
    links: live.links || SAMPLE.links,
    clients: live.clients || SAMPLE.clients,
    notes: live.notes || SAMPLE.notes,
    outreach: live.outreach || SAMPLE.outreach,
    finances: {
      expenses: live.finances?.expenses || SAMPLE.finances.expenses,
      income: live.finances?.income || SAMPLE.finances.income,
      debt: live.finances?.debt || SAMPLE.finances.debt,
    },
  };
}

function filterRecords(records = [], query, keys) {
  const term = query.trim().toLowerCase();
  if (!term) return records;
  return records.filter((record) => keys.some((key) => String(record[key] || "").toLowerCase().includes(term)));
}

function sum(records = [], key) {
  return records.reduce((total, record) => total + Number(record[key] || 0), 0);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function todaySlash() {
  const date = new Date();
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()}`;
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function monthName() {
  return new Date().toLocaleString("en-US", { month: "long" });
}

function monthYear() {
  return new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
}

function longDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function longDateWithYear() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function taskCategoryIcon(category) {
  const icons = {
    Dashboard: "🏠",
    "Today's 5": "⭐",
    "Random Now": "🎲",
    "Random Later": "🔀",
    Habits: "💪",
    Kids: "☀️",
    "The Daily Session": "📓",
    "The Regulated Mother": "💗",
    "The Embodied Self": "🌿",
    Admin: "📋",
    Household: "🏠",
    "Husband and Family": "🏡",
    "Me Time": "✨",
    Supplies: "🛒",
  };
  return icons[category] || "•";
}

function money(value) {
  return Number(value || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function normalizeUrl(url) {
  if (!url) return "#";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function sectionTitle(id) {
  return SECTIONS.find((section) => section.id === id)?.label || "Dashboard";
}

const taskFields = [
  { name: "title", label: "Task" },
  { name: "dueDate", label: "Due date", type: "date" },
  { name: "dueTime", label: "Time", type: "time" },
  { name: "status", label: "Status", default: "Open" },
  { name: "priority", label: "Priority" },
  { name: "category", label: "Category" },
  { name: "notes", label: "Notes", type: "textarea", long: true },
];
const linkFields = [
  { name: "title", label: "Title" },
  { name: "url", label: "URL" },
  { name: "category", label: "Category" },
  { name: "notes", label: "Notes", type: "textarea", long: true },
];
const clientFields = [
  { name: "name", label: "Name" },
  { name: "status", label: "Status" },
  { name: "nextSession", label: "Next session", type: "date" },
  { name: "email", label: "Email", type: "email" },
  { name: "notes", label: "Notes", type: "textarea", long: true },
];
const noteFields = [
  { name: "title", label: "Title" },
  { name: "category", label: "Category" },
  { name: "content", label: "Content", type: "textarea", long: true },
];
const outreachFields = [
  { name: "name", label: "Name" },
  { name: "status", label: "Status", default: "Pending" },
  { name: "category", label: "Category" },
  { name: "email", label: "Email", type: "email" },
  { name: "website", label: "Website" },
  { name: "notes", label: "Notes", type: "textarea", long: true },
];
const expenseFields = [
  { name: "name", label: "Expense" },
  { name: "month", label: "Month", default: monthName() },
  { name: "amount", label: "Amount", type: "number" },
  { name: "category", label: "Category" },
  { name: "frequency", label: "Frequency" },
  { name: "notes", label: "Notes", type: "textarea", long: true },
];
const incomeFields = [
  { name: "source", label: "Source" },
  { name: "month", label: "Month", default: monthName() },
  { name: "amount", label: "Amount", type: "number" },
  { name: "date", label: "Date", type: "date" },
];
const debtFields = [
  { name: "name", label: "Debt" },
  { name: "remaining", label: "Remaining", type: "number" },
  { name: "payment", label: "Payment", type: "number" },
  { name: "lastPaid", label: "Last paid", type: "date" },
];

createRoot(document.getElementById("root")).render(<App />);
