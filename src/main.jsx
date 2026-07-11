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
    { id: "sample-link-1", title: "Client Portal", url: "https://example.com", category: "Work", notes: "Frequently used" },
    { id: "sample-link-2", title: "Resource Folder", url: "https://example.com/resources", category: "Personal", notes: "" },
  ],
  clients: [
    { id: "sample-client-1", name: "Practice Session", status: "Active", nextSession: today(), notes: "" },
  ],
  notes: [
    { id: "sample-note-1", title: "Morning note", content: "Check the day, choose the next right thing, and keep moving.", category: "Brain Dump", updatedAt: new Date().toISOString() },
  ],
  todayItems: [
    { id: "sample-today-1", text: "Choose one thing that makes today easier", date: today(), done: false },
  ],
  outreach: [
    { id: "sample-outreach-1", name: "massage", status: "Pending", category: "Keyword", email: "", notes: "" },
  ],
  finances: {
    expenses: [{ id: "sample-expense-1", name: "Software", month: monthName(), amount: 29, paid: false, category: "Tools" }],
    income: [{ id: "sample-income-1", source: "Session income", month: monthName(), amount: 100 }],
    debt: [{ id: "sample-debt-1", name: "Balance", remaining: 500, payment: 50 }],
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
        setNotice("");
      } else {
        setNotice(result.error || "Could not refresh data.");
      }
    } catch (error) {
      setNotice(error.message || "Could not refresh data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  async function mutate(action, payload) {
    const result = await api(action, payload);
    if (!result.ok) throw new Error(result.error || "Request failed.");
    await loadData();
    return result;
  }

  if (!unlocked) {
    return (
      <LockScreen
        data={data}
        mutate={mutate}
        loading={loading}
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
            <span>Daily menu</span>
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
      </aside>

      <main className={active === "dashboard" ? "home-main" : ""}>
        {active !== "dashboard" && active !== "tasks" && active !== "calendar" && active !== "links" && active !== "clients" && active !== "notes" && active !== "finances" && active !== "outreach" ? (
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

        {notice && active !== "dashboard" && active !== "tasks" && active !== "calendar" && active !== "links" && active !== "clients" && active !== "notes" && active !== "finances" && active !== "outreach" ? <div className="notice">{notice}</div> : null}

        {active === "dashboard" && <Dashboard data={data} stats={stats} setActive={setActive} mutate={mutate} query={query} />}
        {active === "tasks" && <TasksPage tasks={data.tasks} setActive={setActive} mutate={mutate} refresh={loadData} loading={loading} />}
        {active === "calendar" && <CalendarPage tasks={data.tasks} mutate={mutate} setActive={setActive} />}
        {active === "links" && <LinksPage links={data.links} setActive={setActive} mutate={mutate} refresh={loadData} loading={loading} />}
        {active === "clients" && <ClientsPage clients={data.clients} setActive={setActive} mutate={mutate} />}
        {active === "notes" && <NotesPage notes={data.notes} setActive={setActive} mutate={mutate} refresh={loadData} loading={loading} />}
        {active === "finances" && <FinancesPage data={data.finances} mutate={mutate} setActive={setActive} />}
        {active === "outreach" && <OutreachPage records={data.outreach} setActive={setActive} mutate={mutate} refresh={loadData} loading={loading} />}
      </main>
    </div>
  );
}

function LockScreen({ onUnlock, data, mutate, loading }) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [brainDump, setBrainDump] = useState("");
  const [detailNotes, setDetailNotes] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedChecklistDate, setSelectedChecklistDate] = useState(() => {
    rolloverChecklistItems();
    return today();
  });
  const [todayItems, setTodayItems] = useState(() => loadChecklistItems(today()));
  const [todayText, setTodayText] = useState("");
  const [busyQuickAdd, setBusyQuickAdd] = useState(false);
  const [todayDoneOverrides, setTodayDoneOverrides] = useState({});
  const [savingTodayIds, setSavingTodayIds] = useState([]);
  const [todayError, setTodayError] = useState("");
  const airtableTodayItems = [...(data?.todayItems || [])]
    .filter((item) => !item.done || Object.prototype.hasOwnProperty.call(todayDoneOverrides, item.id))
    .map((item) => ({ ...item, done: todayDoneOverrides[item.id] ?? item.done }))
    .sort(sortChecklistItems);
  const combinedTodayItems = [
    ...airtableTodayItems,
    ...todayItems.map((item) => ({ ...item, localOnly: true })),
  ].sort(sortChecklistItems);
  const doneCount = combinedTodayItems.filter((item) => item.done).length;
  const totalCount = combinedTodayItems.length;

  useEffect(() => {
    setTodayItems(loadChecklistItems(selectedChecklistDate));
  }, [selectedChecklistDate]);

  function saveTodayItems(items) {
    setTodayItems(items);
    saveChecklistItems(selectedChecklistDate, items);
  }

  async function createQuickTask(title, category, extra = {}) {
    setBusyQuickAdd(true);
    try {
      await mutate("tasks.create", {
        title,
        category,
        status: "Open",
        notes: detailNotes,
        ...extra,
      });
    } finally {
      setBusyQuickAdd(false);
    }
  }

  async function addBrainDump(category) {
    if (!brainDump.trim()) return;
    await createQuickTask(brainDump.trim(), category);
    setBrainDump("");
    setDetailNotes("");
    setDetailsOpen(false);
  }

  async function addTodayItem(event) {
    event.preventDefault();
    if (!todayText.trim()) return;
    const title = todayText.trim();
    setTodayText("");
    try {
      await mutate("today.create", { text: title, date: selectedChecklistDate, done: false });
    } catch {
      saveTodayItems([...todayItems, { id: crypto.randomUUID(), text: title, done: false }]);
    }
  }

  function toggleTodayItem(id) {
    saveTodayItems(todayItems.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  }

  async function toggleAirtableTodayItem(item) {
    const nextDone = !item.done;
    setTodayError("");
    setSavingTodayIds((ids) => [...new Set([...ids, item.id])]);
    setTodayDoneOverrides((current) => ({ ...current, [item.id]: nextDone }));

    try {
      await mutate("today.update", { id: item.id, done: nextDone });
    } catch (error) {
      setTodayDoneOverrides((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
      setTodayError(error.message || "Could not update this item in Airtable.");
    } finally {
      setSavingTodayIds((ids) => ids.filter((id) => id !== item.id));
    }
  }

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
          <button className="peach-button" type="submit"><ShieldCheck size={17} /> Enter</button>
        </form>
        <article className="home-card locked-preview">
          <h3>Brain dump a task</h3>
          <input value={brainDump} onChange={(event) => setBrainDump(event.target.value)} placeholder="Brain dump a task..." />
          {detailsOpen ? <textarea value={detailNotes} onChange={(event) => setDetailNotes(event.target.value)} placeholder="Add details..." /> : null}
          <button className="outline-button" type="button" onClick={() => setDetailsOpen(!detailsOpen)}>Add details</button>
          <button className="brown-button" type="button" disabled={busyQuickAdd || loading} onClick={() => addBrainDump("Random Now")}><Plus size={17} /> Random Now</button>
          <button className="orange-button" type="button" disabled={busyQuickAdd || loading} onClick={() => addBrainDump("Today's 5")}><Sparkles size={17} /> Today's 5</button>
        </article>
        <form className="home-card locked-preview" onSubmit={addTodayItem}>
          <div className="today-head">
            <div>
              <h3>Today I will</h3>
            </div>
            <span>{doneCount}/{totalCount} done</span>
          </div>
          <label>
            <span>Checklist date</span>
            <input type="date" value={selectedChecklistDate} onChange={(event) => setSelectedChecklistDate(event.target.value || today())} />
          </label>
          <button className="outline-button" type="button" onClick={() => setSelectedChecklistDate(today())}>Today</button>
          <input value={todayText} onChange={(event) => setTodayText(event.target.value)} placeholder="Add one thing for today..." />
          <button className="outline-button" type="submit"><Plus size={16} /> Add</button>
          {totalCount ? (
            <div className="today-list">
              {combinedTodayItems.map((item) => (
                <div className={`today-item ${item.done ? "done" : ""}`} key={item.id}>
                  <button
                    type="button"
                    className={`today-check ${item.done ? "checked" : ""}`}
                    disabled={savingTodayIds.includes(item.id)}
                    onClick={() => (item.localOnly ? toggleTodayItem(item.id) : toggleAirtableTodayItem(item))}
                    aria-label={item.done ? "Mark not done" : "Mark done"}
                  >
                    {item.done ? <Check size={16} /> : null}
                  </button>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-dashed">No Today I will items yet.</div>
          )}
          {todayError ? <p className="form-error">{todayError}</p> : null}
        </form>
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

function BottomNav({ active, setActive, avatarAction, avatarDisabled }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreItems = SECTIONS.filter((section) => !["dashboard", "tasks", "clients"].includes(section.id));

  function go(sectionId) {
    setMoreOpen(false);
    setActive(sectionId);
  }

  return (
    <div className="bottom-nav-wrap">
      {moreOpen ? (
        <div className="more-menu">
          {moreItems.map((section) => {
            const Icon = section.icon;
            return (
              <button key={section.id} className={active === section.id ? "active" : ""} onClick={() => go(section.id)}>
                <Icon size={17} />
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="bottom-nav">
        <button className={active === "dashboard" ? "active" : ""} onClick={() => go("dashboard")}><Home size={18} />Home</button>
        <button className={active === "tasks" ? "active" : ""} onClick={() => go("tasks")}><Check size={18} />Tasks</button>
        <button className={active === "clients" ? "active" : ""} onClick={() => go("clients")}><UsersRound size={18} />Clients</button>
        <button className={moreOpen || moreItems.some((item) => item.id === active) ? "active" : ""} onClick={() => setMoreOpen((open) => !open)}>•••<span>More</span></button>
        <button className="avatar" onClick={avatarAction} disabled={avatarDisabled}>T</button>
      </div>
    </div>
  );
}

function HomeDashboard({ data, stats, upcoming, setActive, mutate }) {
  const [brainDump, setBrainDump] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailNotes, setDetailNotes] = useState("");
  const [homeSearch, setHomeSearch] = useState("");
  const todaysFive = data.tasks.filter((task) => task.category === "Today's 5");
  const weekSessions = currentWeekCompletedSessions(data.clients);
  const sessionsThisWeek = weekSessions.length;
  const unpaid = stats.unpaid || stats.expenses;
  const earnings = sumSessionRates(weekSessions);
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
        <p>Tasks, clients, notes, money.</p>
        <button className="refresh-pill" onClick={() => window.location.reload()}><RefreshCw size={17} /> Refresh</button>
        <div className="hero-pills">
          <button onClick={() => setActive("tasks")}>◎ Tasks</button>
          <button onClick={() => setActive("clients")}><UsersRound size={14} /> Clients</button>
          <button onClick={() => setActive("finances")}><CircleDollarSign size={14} /> Finances</button>
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

      <BottomNav active="dashboard" setActive={setActive} />
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
            {!displayTasks.length ? <div className="empty-dashed">Nothing in this view.</div> : null}
          </div>
        </article>
      </div>

      <BottomNav active="tasks" setActive={setActive} avatarAction={refresh} avatarDisabled={loading} />
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

function LinksPage({ links = [], setActive, mutate, refresh, loading }) {
  const [linkSearch, setLinkSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [busyCreate, setBusyCreate] = useState(false);

  const categories = useMemo(() => {
    const counts = links.reduce((all, link) => {
      const category = link.category || "Personal";
      all[category] = (all[category] || 0) + 1;
      return all;
    }, {});
    return [
      { label: "All", count: links.length },
      ...Object.entries(counts).map(([label, count]) => ({ label, count })),
    ];
  }, [links]);

  const filteredLinks = useMemo(() => {
    const term = linkSearch.trim().toLowerCase();
    return links.filter((link) => {
      const matchesCategory = selectedCategory === "All" || (link.category || "Personal") === selectedCategory;
      const matchesTerm = !term || [link.title, link.url, link.category, link.notes].some((value) => String(value || "").toLowerCase().includes(term));
      return matchesCategory && matchesTerm;
    });
  }, [links, linkSearch, selectedCategory]);

  const files = links.filter((link) => hasAttachment(link)).length;

  async function addLink() {
    const title = window.prompt("Link title");
    if (!title?.trim()) return;
    const url = window.prompt("URL");
    if (!url?.trim()) return;
    const category = window.prompt("Category", "Personal") || "Personal";
    setBusyCreate(true);
    try {
      await mutate("links.create", {
        title: title.trim(),
        url: url.trim(),
        category: category.trim(),
      });
    } finally {
      setBusyCreate(false);
    }
  }

  return (
    <section className="links-page">
      <header className="calendar-app-header links-nav">
        <div className="calendar-brand">
          <Home size={20} />
          <strong>LifeTracker</strong>
        </div>
        <nav>
          {["Home", "Tasks", "Clients", "Calendar", "Finances", "Links", "Notes", "Dashboard", "Outreach"].map((item) => (
            <button
              key={item}
              className={item === "Links" ? "active" : ""}
              onClick={() => setActive(item === "Home" ? "dashboard" : item.toLowerCase())}
            >
              {item}
            </button>
          ))}
        </nav>
        <button className="tasks-avatar" aria-label="Profile">T</button>
      </header>

      <div className="links-content">
        <section className="links-hero">
          <p>My Life Tracker</p>
          <h1>Links Library</h1>
          <span>Docs, resources, referrals, assessments, attachments, and everyday shortcuts.</span>
          <div className="links-stats">
            <StatTile label="Total links" value={links.length} />
            <StatTile label="Categories" value={Math.max(categories.length - 1, 0)} />
            <StatTile label="Files" value={files} />
          </div>
        </section>

        <section className="links-controls">
          <label className="links-search">
            <Search size={18} />
            <input value={linkSearch} onChange={(event) => setLinkSearch(event.target.value)} placeholder="Search links, categories, files..." />
          </label>
          <button className="links-icon-button" onClick={refresh} disabled={loading} aria-label="Refresh links">
            {loading ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
            <span>Refresh</span>
          </button>
          <button className="links-add-button" onClick={addLink} disabled={busyCreate}>
            {busyCreate ? <Loader2 className="spin" size={18} /> : <Plus size={18} />}
            <span>Add Link</span>
          </button>
          <div className="links-chip-row">
            {categories.map((category) => (
              <button key={category.label} className={selectedCategory === category.label ? "active" : ""} onClick={() => setSelectedCategory(category.label)}>
                {linkCategoryIcon(category.label)} {category.label} <span>{category.count}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="links-results">
          <div className="links-results-head">
            <h2>{selectedCategory === "All" ? "All Links" : selectedCategory}</h2>
            <p>{filteredLinks.length} results</p>
          </div>
          <div className="links-grid">
            {filteredLinks.map((link) => (
              <LinkLibraryCard key={link.id} link={link} />
            ))}
            {!filteredLinks.length ? <div className="empty-dashed">Nothing in this view.</div> : null}
          </div>
        </section>
      </div>

      <BottomNav active="links" setActive={setActive} />
    </section>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="links-stat-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function LinkLibraryCard({ link }) {
  const host = linkHost(link.url);
  const category = link.category || "Personal";
  return (
    <article className="link-library-card">
      <div className={`link-library-icon ${linkTone(category)}`}>
        {linkCategorySvg(category)}
      </div>
      <div className="link-library-body">
        <h3>{link.title || "Untitled Link"}</h3>
        <p>{host}</p>
        {link.notes ? <em>{link.notes}</em> : null}
        {hasAttachment(link) ? <span className="attachment-pill">📎 {attachmentLabel(link)}</span> : null}
        <span className={`category-pill ${linkTone(category)}`}>{category}</span>
      </div>
      <a href={normalizeUrl(link.url)} target="_blank" rel="noreferrer">
        Open Link <ExternalLink size={15} />
      </a>
    </article>
  );
}

function ClientsPage({ clients = [], setActive, mutate }) {
  const [tab, setTab] = useState("This Week");
  const [modalOpen, setModalOpen] = useState(false);
  const [openCarried, setOpenCarried] = useState({});
  const sessions = clients.length ? clients : SAMPLE.clients;
  const currentWeek = currentWeekRange();
  const currentWeekLabel = weekOfLabel(currentWeek.start);
  const thisWeekSessions = currentWeekSessions(sessions);
  const weekSessions = currentWeekCompletedSessions(sessions);
  const weekPotential = 966;
  const earned = sumSessionRates(weekSessions);
  const progress = Math.min(100, Math.round((earned / weekPotential) * 100));
  const closed = sessions.filter((client) => String(client.status || "").toLowerCase().includes("closed")).length;
  const grouped = groupSessions(thisWeekSessions);
  const carriedGroups = groupCarriedSessions(sessions);
  const carriedTotal = Object.values(carriedGroups).reduce((total, records) => total + records.length, 0);

  return (
    <section className="clients-page">
      <header className="calendar-app-header clients-nav">
        <div className="calendar-brand">
          <Home size={20} />
          <strong>LifeTracker</strong>
        </div>
        <nav>
          {["Home", "Tasks", "Clients", "Calendar", "Finances", "Links", "Notes", "Dashboard", "Outreach"].map((item) => (
            <button
              key={item}
              className={item === "Clients" ? "active" : ""}
              onClick={() => setActive(item === "Home" ? "dashboard" : item.toLowerCase())}
            >
              {item}
            </button>
          ))}
        </nav>
        <button className="tasks-avatar" aria-label="Profile">T</button>
      </header>

      <section className="clients-hero">
        <div className="clients-hero-inner">
          <p>Client Tracker</p>
          <h1>Your Practice</h1>
          <span>{longDate()}</span>
          <div className="practice-progress">
            <div>
              <small>Earned this week</small>
              <strong>{money(earned)}</strong>
            </div>
            <div>
              <small>Week potential</small>
              <strong>{money(weekPotential)}</strong>
            </div>
            <div className="progress-bar"><i style={{ width: `${progress}%` }} /></div>
            <em>{progress}% earned · {Math.min(weekSessions.length, 10)}/10 sessions held</em>
          </div>
          <div className="practice-pills">
            <span><UsersRound size={15} /> {sessions.length} sessions</span>
            <span><Check size={15} /> {closed}/10 closed</span>
            <span><BarChart3 size={15} /> {currentWeekLabel.toLowerCase()}</span>
          </div>
        </div>
      </section>

      <div className="clients-tabs">
        {["This Week", "Upcoming", "Clients"].map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {item === "This Week" ? "⭐" : item === "Upcoming" ? "📅" : "👥"} {item}
          </button>
        ))}
        <button className="add-session-button" onClick={() => setModalOpen(true)}><Plus size={17} /> Add Session</button>
      </div>

      <main className="clients-week">
        <div className="clients-week-head">
          <strong>{currentWeekLabel}</strong>
          <span>{thisWeekSessions.length} sessions · <b>{carriedTotal} carried over</b> <RefreshCw size={14} /></span>
        </div>
        <div className="carried-list">
          {Object.entries(carriedGroups).map(([label, records]) => (
            <section className={`carried-group ${openCarried[label] ? "open" : ""}`} key={label}>
              <button
                className="carried-row"
                type="button"
                onClick={() => setOpenCarried((current) => ({ ...current, [label]: !current[label] }))}
              >
                <span>△ Carried Over · {label}</span>
                <b>{records.length}</b>
                <i />
                <ChevronDown size={14} />
              </button>
              {openCarried[label] ? (
                <div className="carried-session-list">
                  {records.map((session) => <SessionCard key={session.id} session={session} mutate={mutate} />)}
                </div>
              ) : null}
            </section>
          ))}
          {!carriedTotal ? <div className="empty-dashed">No carried-over sessions.</div> : null}
        </div>
        <div className="session-groups">
          {Object.entries(grouped).map(([date, records]) => (
            <section key={date} className="session-group">
              <div className="session-date-head"><span>{date}</span><i /><ChevronDown size={14} /></div>
              {records.map((session) => <SessionCard key={session.id} session={session} mutate={mutate} />)}
            </section>
          ))}
          {!Object.keys(grouped).length ? <div className="empty-dashed">No sessions scheduled this week.</div> : null}
        </div>
      </main>

      {modalOpen ? <AddSessionModal clients={clients} mutate={mutate} onClose={() => setModalOpen(false)} /> : null}

      <BottomNav active="clients" setActive={setActive} />
    </section>
  );
}

function SessionCard({ session, mutate }) {
  const [open, setOpen] = useState(false);
  const [busyField, setBusyField] = useState("");
  const rate = sessionRate(session);
  const tasks = sessionChecklist(session);
  const doneCount = tasks.filter((task) => task.done).length;
  const progress = Math.round((doneCount / tasks.length) * 100);

  async function toggleSessionTask(task) {
    setBusyField(task.key);
    try {
      await mutate("clients.update", { id: session.id, [task.key]: !task.done });
    } finally {
      setBusyField("");
    }
  }

  return (
    <article className={`session-card ${open ? "open" : ""}`}>
      <button className="session-summary" type="button" onClick={() => setOpen((value) => !value)}>
        <div>
          <strong>{session.name || "Client"}</strong>
          {rate ? <span className="rate-pill">{money(rate)}</span> : null}
          <p>{formatSessionDate(session.nextSession)} · {sessionTime(session)}</p>
        </div>
        <div className="session-progress-dots">
          {tasks.map((task) => <i key={task.key} className={task.done ? "done" : ""} />)}
        </div>
        <span>{doneCount}/4</span>
        <ChevronDown className="session-chevron" size={16} />
      </button>
      {open ? (
        <div className="session-detail">
          <div className="session-detail-head">
            <span>{doneCount}/4 tasks done</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar"><i style={{ width: `${progress}%` }} /></div>
          <label>
            <span>Session status</span>
            <select value={session.status || "Upcoming"} onChange={(event) => mutate("clients.update", { id: session.id, status: event.target.value })}>
              {["Upcoming", "Held", "Completed", "Canceled"].map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <div className="session-task-list">
            {tasks.map((task) => (
              <button
                type="button"
                key={task.key}
                className={task.done ? "done" : ""}
                disabled={busyField === task.key}
                onClick={() => toggleSessionTask(task)}
              >
                <span className="session-check">{task.done ? <Check size={15} /> : null}</span>
                <span>
                  <b>{task.label}</b>
                  {task.detail ? <small>{task.detail}</small> : null}
                </span>
              </button>
            ))}
          </div>
          <div className="session-card-actions">
            <button type="button"><Edit3 size={17} /> Edit</button>
            <button type="button" className="danger"><Trash2 size={17} /> Delete</button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function sessionChecklist(session) {
  const rate = sessionRate(session);
  return [
    { key: "sessionHeld", label: "Session held", done: Boolean(session.sessionHeld), detail: rate ? money(rate) : "" },
    { key: "noteDone", label: "Note done", done: Boolean(session.noteDone) },
    { key: "nextSessionScheduled", label: "Next session scheduled", done: Boolean(session.nextSessionScheduled) },
    { key: "nextSessionPrepared", label: "Next session prepared", done: Boolean(session.nextSessionPrepared) },
  ];
}

function AddSessionModal({ clients = [], mutate, onClose }) {
  const choices = useMemo(() => uniqueClients(clients), [clients]);
  const [selectedId, setSelectedId] = useState(choices[0]?.id || "");
  const selected = choices.find((client) => client.id === selectedId) || choices[0] || {};
  const [date, setDate] = useState(todaySlash());
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [rate, setRate] = useState(String(sessionRate(selected) || ""));
  const [status, setStatus] = useState("Upcoming");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRate(String(sessionRate(selected) || ""));
  }, [selectedId]);

  async function submit(event) {
    event.preventDefault();
    if (!selected.name) return;
    setBusy(true);
    try {
      await mutate("clients.create", {
        name: selected.name,
        status,
        nextSession: slashToIso(date),
        weekOf: weekStartIso(slashToIso(date)),
        rate,
        notes: [time ? `Time: ${time}` : "", duration ? `Duration: ${duration}` : "", rate ? `Rate: ${rate}` : "", notes].filter(Boolean).join("\n"),
      });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <form className="session-modal" onSubmit={submit}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close"><X size={26} /></button>
        <h2>Add Session</h2>
        <label className="wide">
          <span>Client *</span>
          <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            {choices.map((client) => (
              <option key={client.id} value={client.id}>{client.name} · {money(sessionRate(client))}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Session Date</span>
          <input value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label>
          <span>Time</span>
          <input value={time} onChange={(event) => setTime(event.target.value)} placeholder="--:-- --" />
        </label>
        <label>
          <span>Duration</span>
          <select value={duration} onChange={(event) => setDuration(event.target.value)}>
            <option value=""> </option>
            <option>30 minutes</option>
            <option>45 minutes</option>
            <option>60 minutes</option>
          </select>
        </label>
        <label>
          <span>Rate ($)</span>
          <input value={rate} onChange={(event) => setRate(event.target.value.replace(/[^\d.]/g, ""))} />
        </label>
        <label>
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option>Upcoming</option>
            <option>Held</option>
            <option>Closed</option>
            <option>Canceled</option>
          </select>
        </label>
        <label className="wide">
          <span>Notes</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <button className="session-submit" disabled={busy}>{busy ? <Loader2 className="spin" size={18} /> : null} Add Session</button>
        <button className="session-cancel" type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
}

function NotesPage({ notes = [], setActive, mutate, refresh, loading }) {
  const [noteSearch, setNoteSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Notes");
  const [lockedOnly, setLockedOnly] = useState(false);
  const [busyCreate, setBusyCreate] = useState(false);

  const categories = useMemo(() => {
    const found = [...new Set(notes.map((note) => note.category || "Brain Dump"))];
    return ["All Notes", ...found];
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const term = noteSearch.trim().toLowerCase();
    return notes.filter((note) => {
      const locked = isLockedNote(note);
      const matchesCategory = selectedCategory === "All Notes" || (note.category || "Brain Dump") === selectedCategory;
      const matchesTerm = !term || [note.title, note.content, note.category].some((value) => String(value || "").toLowerCase().includes(term));
      return matchesCategory && matchesTerm && (!lockedOnly || locked);
    });
  }, [notes, noteSearch, selectedCategory, lockedOnly]);

  async function addNote() {
    const title = window.prompt("Note title");
    if (!title?.trim()) return;
    const content = window.prompt("Note body", "") || "";
    setBusyCreate(true);
    try {
      await mutate("notes.create", {
        title: title.trim(),
        category: selectedCategory === "All Notes" ? "Brain Dump" : selectedCategory,
        content,
      });
    } finally {
      setBusyCreate(false);
    }
  }

  return (
    <section className="notes-page">
      <header className="calendar-app-header notes-nav">
        <div className="calendar-brand">
          <Home size={20} />
          <strong>LifeTracker</strong>
        </div>
        <nav>
          {["Home", "Tasks", "Clients", "Calendar", "Finances", "Links", "Notes", "Dashboard", "Outreach"].map((item) => (
            <button
              key={item}
              className={item === "Notes" ? "active" : ""}
              onClick={() => setActive(item === "Home" ? "dashboard" : item.toLowerCase())}
            >
              {item}
            </button>
          ))}
        </nav>
        <button className="tasks-avatar" aria-label="Profile">T</button>
      </header>

      <div className="notes-shell">
        <section className="notes-controls">
          <label className="notes-search">
            <Search size={18} />
            <input value={noteSearch} onChange={(event) => setNoteSearch(event.target.value)} placeholder="Search notes..." />
          </label>
          <button className="note-filter-button"><PinIcon /> Pinned</button>
          <button className={`note-filter-button ${lockedOnly ? "active" : ""}`} onClick={() => setLockedOnly(!lockedOnly)}><LockKeyhole size={16} /> Locked</button>
          <button className="notes-refresh" onClick={refresh} disabled={loading} aria-label="Refresh notes">
            {loading ? <Loader2 className="spin" size={17} /> : <RefreshCw size={17} />}
          </button>
          <button className="notes-add" onClick={addNote} disabled={busyCreate} aria-label="Add note">
            {busyCreate ? <Loader2 className="spin" size={17} /> : <Plus size={17} />}
          </button>
          <div className="notes-chip-row">
            {categories.map((category) => (
              <button key={category} className={selectedCategory === category ? "active" : ""} onClick={() => setSelectedCategory(category)}>
                {category}
              </button>
            ))}
          </div>
        </section>

        <section className="notes-list">
          {filteredNotes.map((note) => <NoteCard key={note.id} note={note} />)}
          {!filteredNotes.length ? <div className="empty-dashed">Nothing in this view.</div> : null}
          <div className="notes-count"><FileText size={15} /> {notes.length} notes saved</div>
        </section>
      </div>

      <BottomNav active="notes" setActive={setActive} />
    </section>
  );
}

function NoteCard({ note }) {
  const locked = isLockedNote(note);
  return (
    <article className={`note-card ${locked ? "locked" : ""}`}>
      <span className="note-pin"><PinIcon /></span>
      <div className="note-body">
        <div className="note-title-row">
          <h3>{note.title || "Untitled"}</h3>
          {note.category ? <span className="note-category">{note.category}</span> : null}
          {locked ? <span className="locked-pill"><LockKeyhole size={13} /> Locked</span> : null}
        </div>
        <p>{locked ? "Locked note." : note.content || ""}</p>
        <small>{noteDate(note)} · {wordCount(note.content)} words</small>
      </div>
    </article>
  );
}

function PinIcon(props) {
  return <span className="pin-glyph" {...props}>♟</span>;
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
              <p>{record.notes || record.content || record.category || record.status || ""}</p>
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
        {!records.length ? <EmptyState label="Nothing in this view." /> : null}
      </div>
    </section>
  );
}

function CalendarPage({ tasks, mutate, setActive }) {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [calendarSearch, setCalendarSearch] = useState("");
  const [view, setView] = useState("Week");
  const [selectedDate, setSelectedDate] = useState(todaySlash());
  const datedTasks = tasks.filter((task) => task.dueDate);
  const matchingEvents = events.filter((event) => String(event.summary || "").toLowerCase().includes(calendarSearch.trim().toLowerCase()));

  async function addTaskEvent(task) {
    await mutate("tasks.update", { ...task, addToCalendar: true });
  }

  return (
    <section className="calendar-page">
      <header className="calendar-app-header">
        <div className="calendar-brand">
          <Home size={20} />
          <strong>LifeTracker</strong>
        </div>
        <nav>
          {["Home", "Tasks", "Clients", "Calendar", "Finances", "Links", "Notes", "Dashboard", "Outreach"].map((item) => (
            <button
              key={item}
              className={item === "Calendar" ? "active" : ""}
              onClick={() => setActive(item === "Home" ? "dashboard" : item.toLowerCase())}
            >
              {item}
            </button>
          ))}
        </nav>
        <button className="tasks-avatar" aria-label="Profile">T</button>
      </header>

      <div className="calendar-title-row">
        <div>
          <p>Calendar</p>
          <h1>{longDateWithYear()}</h1>
        </div>
        <div className="calendar-actions">
          <button><Plus size={16} /> Add</button>
          <button aria-label="More calendar actions">•••</button>
        </div>
      </div>

      <div className="calendar-toolbar">
        <label className="calendar-search">
          <Search size={18} />
          <input value={calendarSearch} onChange={(event) => setCalendarSearch(event.target.value)} placeholder="Search appointments..." />
        </label>
        <button className="calendar-select">All accessible calendars <ChevronDown size={15} /></button>
        <div className="calendar-view-tabs">
          {["Day", "Week", "Month", "List"].map((item) => (
            <button key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>{item}</button>
          ))}
        </div>
        <div className="calendar-date-controls">
          <button aria-label="Previous date">‹</button>
          <label>
            <input value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            <CalendarDays size={16} />
          </label>
          <button aria-label="Next date">›</button>
          <button onClick={() => setSelectedDate(todaySlash())}>Today</button>
        </div>
      </div>

      <div className="calendar-stage">
        {connected && matchingEvents.length ? (
          <div className="calendar-event-list">
            {matchingEvents.map((event) => (
              <article key={event.id}>
                <strong>{event.summary}</strong>
                <span>{event.start || event.calendar}</span>
              </article>
            ))}
          </div>
        ) : (
          <article className="calendar-connect-card">
            <CalendarDays size={44} />
            <h2>Connect Google Calendar</h2>
            <p>Sign in with the Google account that has access to your calendars.</p>
            <button onClick={() => connectGoogle(setConnected, setEvents)}>
              <ArrowUpRight size={16} /> {connected ? "Reconnect Google" : "Connect Google"}
            </button>
          </article>
        )}
        {datedTasks.length ? (
          <div className="calendar-task-strip">
            {datedTasks.slice(0, 4).map((task) => (
              <button key={task.id} onClick={() => addTaskEvent(task)}>
                <Clock3 size={15} />
                <span>{task.title}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <BottomNav active="calendar" setActive={setActive} />
    </section>
  );
}

function FinancesPage({ data, mutate, setActive }) {
  const [tab, setTab] = useState("expenses");
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(monthName());
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [addKind, setAddKind] = useState("");
  const allExpenses = data?.expenses || [];
  const allIncome = data?.income || [];
  const debt = data?.debt || [];
  const expenses = allExpenses;
  const income = allIncome.filter((record) => financeRecordMatchesPeriod(record, month, year));
  const expenseTotal = sum(expenses, "amount");
  const paidTotal = sum(expenses.filter((item) => item.paid), "amount");
  const unpaidTotal = sum(expenses.filter((item) => !item.paid), "amount");
  const incomeTotal = sum(income, "amount");
  const debtTotal = sum(debt, "remaining");
  const paymentTotal = sum(debt, "payment");
  const progress = expenseTotal ? Math.round((paidTotal / expenseTotal) * 100) : 0;
  const records = tab === "expenses" ? expenses : tab === "income" ? income : debt;
  const filtered = records.filter((record) => {
    const term = search.trim().toLowerCase();
    const paidMatch = tab !== "expenses" || status === "All" || (status === "Paid" ? record.paid : !record.paid);
    const termMatch = !term || [record.name, record.source, record.category, record.frequency, record.notes].some((value) => String(value || "").toLowerCase().includes(term));
    return paidMatch && termMatch;
  });

  async function togglePaid(record) {
    await mutate("finances.expenses.update", { id: record.id, paid: !record.paid });
  }

  async function deleteExpense(record) {
    if (!window.confirm("Delete this finance item?")) return;
    await mutate(`finances.${tab}.delete`, record);
  }

  return (
    <section className="finances-page">
      <header className="calendar-app-header finances-nav">
        <div className="calendar-brand">
          <Home size={20} />
          <strong>LifeTracker</strong>
        </div>
        <nav>
          {["Home", "Tasks", "Clients", "Calendar", "Finances", "Links", "Notes", "Dashboard", "Outreach"].map((item) => (
            <button
              key={item}
              className={item === "Finances" ? "active" : ""}
              onClick={() => setActive(item === "Home" ? "dashboard" : item.toLowerCase())}
            >
              {item}
            </button>
          ))}
        </nav>
        <button className="tasks-avatar" aria-label="Profile">T</button>
      </header>

      <div className="finances-shell">
        <header className="finances-title">
          <h1>💰 Finances</h1>
          <p>{month} {year}</p>
        </header>

        <section className="finance-summary-grid">
          <FinanceSummary label="Income" value={moneyCents(incomeTotal)} sub={`${income.length} records`} tone="green" />
          <FinanceSummary label="Expenses" value={moneyCents(expenseTotal)} sub={`${expenses.filter((item) => !item.paid).length} unpaid`} />
          <FinanceSummary label="Still Owe" value={moneyCents(unpaidTotal)} sub="expenses unpaid" tone="red" />
          <FinanceSummary label="Total Debt 🏦 ▾" value={moneyCents(debtTotal)} sub={`${debt.length} active / ${debt.length || 0} total`} chip={`${moneyCents(paymentTotal)} payment total`} tone="red" />
        </section>

        <div className="finance-filters">
          <select value={month} onChange={(event) => setMonth(event.target.value)}>
            {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={year} onChange={(event) => setYear(event.target.value)}>
            {["2025", "2026", "2027"].map((item) => <option key={item}>{item}</option>)}
          </select>
          <label>
            <Search size={15} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search expenses, income, debt..." />
          </label>
        </div>

        <div className="finance-tabs">
          {["expenses", "income", "debt"].map((item) => (
            <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
              {item === "expenses" ? "📋" : item === "income" ? "💵" : "🏦"} {capitalize(item)}
            </button>
          ))}
          <div className="finance-add-actions">
            <button onClick={() => setAddKind("expenses")}><Plus size={16} /> Expense</button>
            <button onClick={() => setAddKind("income")}><Plus size={16} /> Income</button>
          </div>
        </div>

        {tab === "expenses" ? (
          <section className="expense-progress-card">
            <div className="expense-totals">
              <span><b>Amount</b>{moneyCents(expenseTotal)}</span>
              <span className="green"><b>Paid</b>{moneyCents(paidTotal)}</span>
              <span className="red"><b>Unpaid</b>{moneyCents(unpaidTotal)}</span>
            </div>
            <div className="finance-progress-label"><b>Progress</b><strong>{progress}%</strong></div>
            <div className="finance-status-pills">
              {["All", "Unpaid", "Paid"].map((item) => (
                <button key={item} className={status === item ? "active" : ""} onClick={() => setStatus(item)}>{item}</button>
              ))}
            </div>
            <div className="finance-progress-bar"><i style={{ width: `${progress}%` }} /></div>
          </section>
        ) : null}

        <section className="finance-list">
          {filtered.map((record) => (
            <FinanceRow
              key={record.id}
              record={record}
              tab={tab}
              onTogglePaid={() => togglePaid(record)}
              onDelete={() => deleteExpense(record)}
            />
          ))}
          {!filtered.length ? <div className="empty-dashed">Nothing in this view.</div> : null}
        </section>
      </div>

      {addKind ? (
        <FinanceAddModal
          kind={addKind}
          month={month}
          year={year}
          mutate={mutate}
          onClose={() => setAddKind("")}
        />
      ) : null}

      <BottomNav active="finances" setActive={setActive} />
    </section>
  );
}

function FinanceSummary({ label, value, sub, chip, tone }) {
  return (
    <article className={`finance-summary ${tone || ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{sub}</em>
      {chip ? <small>{chip}</small> : null}
    </article>
  );
}

function FinanceRow({ record, tab, onTogglePaid, onDelete }) {
  const title = record.name || record.source || "Finance Item";
  const amount = record.amount || record.remaining || record.payment || 0;
  const paid = Boolean(record.paid);
  return (
    <article className="finance-row">
      {tab === "expenses" ? <button className={`paid-dot ${paid ? "paid" : ""}`} onClick={onTogglePaid} aria-label={paid ? "Mark unpaid" : "Mark paid"} /> : null}
      <div>
        <h3>{title}</h3>
        <div className="finance-row-pills">
          {record.category ? <span>{record.category}</span> : null}
          {record.frequency ? <span>{record.frequency}</span> : null}
          {tab === "expenses" ? <span className={paid ? "paid" : "unpaid"}>{paid ? "Paid" : "Unpaid"}</span> : null}
        </div>
      </div>
      <strong>{moneyCents(amount)}</strong>
      <button className="finance-edit" aria-label="Edit finance item">✎</button>
      <button className="finance-delete" onClick={onDelete} aria-label="Delete finance item">×</button>
    </article>
  );
}

function FinanceAddModal({ kind, month, year, mutate, onClose }) {
  const isExpense = kind === "expenses";
  const [form, setForm] = useState(() => ({
    name: "",
    source: "",
    amount: "",
    category: "",
    frequency: "Monthly",
    notes: "",
    date: today(),
  }));
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    const amount = Number(form.amount || 0);
    if (!amount) return;
    const financeMonth = financeMonthLabel(month, year);
    setBusy(true);
    try {
      if (isExpense) {
        await mutate("finances.expenses.create", {
          name: form.name.trim(),
          month: financeMonth,
          amount,
          category: form.category.trim(),
          frequency: form.frequency,
          notes: form.notes.trim(),
          paid: false,
        });
      } else {
        await mutate("finances.income.create", {
          source: form.source.trim(),
          month: financeMonth,
          amount,
          date: form.date,
        });
      }
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <form className="session-modal finance-add-modal" onSubmit={submit}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close"><X size={26} /></button>
        <h2>Add {isExpense ? "Expense" : "Income"}</h2>
        <p className="finance-modal-period">{month} {year}</p>
        {isExpense ? (
          <>
            <label className="wide">
              <span>Expense *</span>
              <input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Expense name" required />
            </label>
            <label>
              <span>Amount *</span>
              <input value={form.amount} onChange={(event) => update("amount", event.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" required />
            </label>
            <label>
              <span>Category</span>
              <input value={form.category} onChange={(event) => update("category", event.target.value)} placeholder="Business, Personal..." />
            </label>
            <label>
              <span>Frequency</span>
              <select value={form.frequency} onChange={(event) => update("frequency", event.target.value)}>
                <option>Monthly</option>
                <option>One-time</option>
                <option>Weekly</option>
                <option>Annual</option>
              </select>
            </label>
            <label className="wide">
              <span>Notes</span>
              <textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} />
            </label>
          </>
        ) : (
          <>
            <label className="wide">
              <span>Source *</span>
              <input value={form.source} onChange={(event) => update("source", event.target.value)} placeholder="Income source" required />
            </label>
            <label>
              <span>Amount *</span>
              <input value={form.amount} onChange={(event) => update("amount", event.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" required />
            </label>
            <label>
              <span>Date</span>
              <input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} />
            </label>
          </>
        )}
        <button className="session-submit" disabled={busy}>{busy ? <Loader2 className="spin" size={18} /> : null} Add {isExpense ? "Expense" : "Income"}</button>
        <button className="session-cancel" type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
}

function OutreachPage({ records = [], setActive, mutate, refresh, loading }) {
  const [source, setSource] = useState("All sources");
  const [status, setStatus] = useState("Pending");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState("");
  const [busyCreate, setBusyCreate] = useState(false);
  const sources = ["All sources", ...new Set(records.map((record) => record.source).filter(Boolean))];
  const pending = records.filter((record) => outreachStatus(record) === "Pending").length;
  const potential = records.filter((record) => outreachStatus(record) === "Potential").length;
  const contacted = records.filter((record) => outreachStatus(record) === "Contacted").length;
  const filtered = records.filter((record) => {
    const term = search.trim().toLowerCase();
    const matchesSource = source === "All sources" || record.source === source;
    const matchesStatus = status === "All" || outreachStatus(record) === status;
    const matchesTerm = !term || [record.name, record.category, record.source, record.email, record.notes, record.website].some((value) => String(value || "").toLowerCase().includes(term));
    return matchesSource && matchesStatus && matchesTerm;
  });

  async function setLeadStatus(record, nextStatus) {
    setBusyId(record.id);
    try {
      await mutate("outreach.update", { ...record, status: nextStatus });
    } finally {
      setBusyId("");
    }
  }

  async function addLead() {
    const name = window.prompt("Lead name or keyword");
    if (!name?.trim()) return;
    const category = window.prompt("Category", "Keyword") || "Keyword";
    setBusyCreate(true);
    try {
      await mutate("outreach.create", {
        sourceKey: "sessionSpot",
        name: name.trim(),
        category: category.trim(),
        status: "Pending",
      });
    } finally {
      setBusyCreate(false);
    }
  }

  return (
    <section className="outreach-page">
      <header className="calendar-app-header outreach-nav">
        <div className="calendar-brand">
          <Home size={20} />
          <strong>LifeTracker</strong>
        </div>
        <nav>
          {["Home", "Tasks", "Clients", "Calendar", "Finances", "Links", "Notes", "Dashboard", "Outreach"].map((item) => (
            <button
              key={item}
              className={item === "Outreach" ? "active" : ""}
              onClick={() => setActive(item === "Home" ? "dashboard" : item.toLowerCase())}
            >
              {item}
            </button>
          ))}
        </nav>
        <button className="tasks-avatar" aria-label="Profile">T</button>
      </header>

      <section className="outreach-hero">
        <div className="outreach-hero-inner">
          <p>Outreach Hub</p>
          <h1>Lead Pipeline</h1>
          <span>{longDate()}</span>
          <div className="pipeline-stats">
            <PipelineStat value={pending} label="Pending" />
            <PipelineStat value={potential} label="Potential" tone="yellow" />
            <PipelineStat value={contacted} label="Contacted" tone="peach" />
          </div>
          <div className="source-pills">
            {sources.map((item) => (
              <button key={item} className={source === item ? "active" : ""} onClick={() => setSource(item)}>{item}</button>
            ))}
          </div>
        </div>
      </section>

      <div className="outreach-tabs">
        {["Pending", "Potential", "Contacted"].map((item) => (
          <button key={item} className={status === item ? "active" : ""} onClick={() => setStatus(item)}>
            {item === "Pending" ? "🕵️" : item === "Potential" ? "✨" : "✅"} {item} ({item === "Pending" ? pending : item === "Potential" ? potential : contacted})
          </button>
        ))}
        <button className="add-lead-button" onClick={addLead} disabled={busyCreate}>{busyCreate ? <Loader2 className="spin" size={16} /> : <Plus size={17} />} Add Lead</button>
      </div>

      <main className="outreach-list-shell">
        <label className="outreach-search">
          <Search size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, keyword, neighborhood, category..." />
        </label>
        <div className="outreach-list-meta">
          <span>Showing {filtered.length} of {records.length} records</span>
          <button onClick={refresh} disabled={loading}>Test {loading ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />}</button>
        </div>
        <div className="lead-list">
          {filtered.map((record) => (
            <LeadCard
              key={record.id}
              record={record}
              busy={busyId === record.id}
              onPotential={() => setLeadStatus(record, "Potential")}
              onContacted={() => setLeadStatus(record, "Contacted")}
            />
          ))}
          {!filtered.length ? <div className="empty-dashed">Nothing in this view.</div> : null}
        </div>
      </main>

      <BottomNav active="outreach" setActive={setActive} />
    </section>
  );
}

function PipelineStat({ value, label, tone }) {
  return (
    <article className={`pipeline-stat ${tone || ""}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function LeadCard({ record, busy, onPotential, onContacted }) {
  return (
    <article className="lead-card">
      <div>
        <h3>{record.name || "Untitled lead"}</h3>
        <p>{record.source || "Source"} <span>{record.category || "Keyword"}</span></p>
      </div>
      <button className="lead-status">{outreachStatus(record)} <ChevronDown size={15} /></button>
      <div className="lead-actions">
        <button onClick={onPotential} disabled={busy}>Potential</button>
        <button onClick={onContacted} disabled={busy}>Contacted</button>
      </div>
    </article>
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
    setEvents([{ id: "google-help", summary: "Google Calendar is not connected.", start: "Calendar" }]);
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
  const currentMonth = monthName();
  const currentYear = String(new Date().getFullYear());
  const currentExpenses = data.finances?.expenses || [];
  const currentIncome = (data.finances?.income || []).filter((record) => financeRecordMatchesPeriod(record, currentMonth, currentYear));
  const expenses = sum(currentExpenses, "amount");
  const income = sum(currentIncome, "amount");
  const debt = sum(data.finances?.debt, "remaining");
  const unpaid = sum(currentExpenses.filter((item) => !item.paid), "amount");
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

function sortChecklistItems(a, b) {
  if (Boolean(a.done) !== Boolean(b.done)) return a.done ? 1 : -1;
  return 0;
}

function currentWeekCompletedSessions(sessions = []) {
  const currentWeek = dateToInputValue(currentWeekRange().start);
  return sessions.filter((session) => {
    if (sessionWeekIso(session) !== currentWeek) return false;
    return isCompletedSession(session);
  });
}

function currentWeekSessions(sessions = []) {
  const currentWeek = dateToInputValue(currentWeekRange().start);
  return sessions.filter((session) => {
    if (sessionWeekIso(session) !== currentWeek) return false;
    return !String(session.status || "").toLowerCase().includes("cancel");
  });
}

function currentWeekRange(reference = new Date()) {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function parseIsoDate(value) {
  return parseDateValue(value);
}

function parseDateValue(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const text = String(value).trim();
  if (!text) return null;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (iso) {
    const [, year, month, day, hour = "12", minute = "00"] = iso;
    const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?/i);
  if (slash) {
    const [, month, day, year, rawHour, rawMinute, meridian] = slash;
    let hour = rawHour ? Number(rawHour) : 12;
    if (meridian?.toLowerCase() === "pm" && hour < 12) hour += 12;
    if (meridian?.toLowerCase() === "am" && hour === 12) hour = 0;
    const date = new Date(Number(year), Number(month) - 1, Number(day), hour, rawMinute ? Number(rawMinute) : 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  if (!hasTimeValue(text)) parsed.setHours(12, 0, 0, 0);
  return parsed;
}

function dateToInputValue(date) {
  if (!date || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function weekStartForDate(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function weekStartIso(value) {
  const date = parseDateValue(value);
  return date ? dateToInputValue(weekStartForDate(date)) : "";
}

function sessionWeekIso(session) {
  return weekStartIso(session?.weekOf) || weekStartIso(session?.nextSession);
}

function weekOfLabel(value) {
  const date = parseDateValue(value);
  if (!date) return "This Week";
  return `Week of ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function hasTimeValue(value) {
  return /T\d{2}:\d{2}|\b\d{1,2}:\d{2}\s*(?:AM|PM)?\b/i.test(String(value || ""));
}

function isCompletedSession(session) {
  const status = String(session?.status || "").toLowerCase();
  if (status.includes("cancel")) return false;
  if (session?.sessionHeld || session?.paid) return true;
  return ["complete", "completed", "closed", "done", "held", "paid", "attended"].some((word) => status.includes(word));
}

function sumSessionRates(sessions = []) {
  return sessions.reduce((total, session) => total + Number(sessionRate(session) || 0), 0);
}

function mergeData(live) {
  return {
    tasks: live.tasks || SAMPLE.tasks,
    links: live.links || SAMPLE.links,
    clients: live.clients || SAMPLE.clients,
    notes: live.notes || SAMPLE.notes,
    todayItems: live.todayItems || SAMPLE.todayItems,
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

function financeRecordMatchesPeriod(record, month, year) {
  const monthNumber = monthIndex(month);
  const selectedYear = String(year || "");
  const recordMonth = monthIndex(record?.month);
  const recordYear = String(record?.year || yearFromText(record?.month) || "").trim();
  const recordDate = parseDateValue(record?.date);
  const hasPeriod = recordMonth >= 0 || Boolean(recordYear) || Boolean(recordDate);
  if (!hasPeriod) return false;
  const dateMatchesMonth = recordDate ? recordDate.getMonth() === monthNumber : false;
  const dateMatchesYear = recordDate ? String(recordDate.getFullYear()) === selectedYear : false;
  const monthMatches = recordMonth >= 0 ? recordMonth === monthNumber : dateMatchesMonth;
  const yearMatches = recordYear ? recordYear === selectedYear : recordDate ? dateMatchesYear : true;
  return monthMatches && yearMatches;
}

function yearFromText(value) {
  return String(value || "").match(/\b(20\d{2})\b/)?.[1] || "";
}

function financeMonthLabel(month, year) {
  return `${month || monthName()} ${year || new Date().getFullYear()}`;
}

function monthIndex(value) {
  if (value === undefined || value === null || value === "") return -1;
  const text = String(value).trim();
  const numeric = Number(text);
  if (Number.isFinite(numeric) && numeric >= 1 && numeric <= 12) return numeric - 1;
  const short = text.slice(0, 3).toLowerCase();
  return ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(short);
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

const CHECKLIST_PREFIX = "lifeTrackerChecklist:";

function checklistKey(date) {
  return `${CHECKLIST_PREFIX}${date}`;
}

function loadChecklistItems(date) {
  try {
    return JSON.parse(localStorage.getItem(checklistKey(date)) || "[]");
  } catch {
    return [];
  }
}

function saveChecklistItems(date, items) {
  localStorage.setItem(checklistKey(date), JSON.stringify(items));
}

function addIsoDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function rolloverChecklistItems(targetDate = today()) {
  if (typeof localStorage === "undefined") return;
  let moved = true;
  let guard = 0;
  while (moved && guard < 370) {
    moved = false;
    guard += 1;
    const dates = Object.keys(localStorage)
      .filter((key) => key.startsWith(CHECKLIST_PREFIX))
      .map((key) => key.slice(CHECKLIST_PREFIX.length))
      .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
      .sort();

    for (const date of dates) {
      if (date >= targetDate) continue;
      const items = loadChecklistItems(date);
      const checked = items.filter((item) => item.done);
      const unchecked = items.filter((item) => !item.done);
      if (!unchecked.length) continue;

      const nextDate = addIsoDays(date, 1);
      const nextItems = loadChecklistItems(nextDate);
      const carried = unchecked.map((item) => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        carriedFrom: item.carriedFrom || date,
      }));
      const merged = [
        ...nextItems,
        ...carried.filter((item) => !nextItems.some((nextItem) => (nextItem.id && nextItem.id === item.id) || (nextItem.text === item.text && nextItem.carriedFrom === item.carriedFrom))),
      ];

      saveChecklistItems(date, checked);
      saveChecklistItems(nextDate, merged);
      moved = true;
    }
  }
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

function moneyCents(value) {
  return Number(value || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function capitalize(value) {
  return String(value || "").charAt(0).toUpperCase() + String(value || "").slice(1);
}

function normalizeUrl(url) {
  if (!url) return "#";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function linkHost(url) {
  if (!url) return "saved link";
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function hasAttachment(link) {
  return Boolean(link.attachment || link.attachments || link.file || link.filename);
}

function attachmentLabel(link) {
  if (link.filename) return link.filename;
  if (Array.isArray(link.attachments) && link.attachments[0]?.filename) return link.attachments[0].filename;
  if (typeof link.attachment === "string") return link.attachment.split("/").pop() || "Attachment";
  return "Attachment";
}

function linkTone(category) {
  const text = String(category || "").toLowerCase();
  if (text.includes("relationship") || text.includes("book")) return "yellow";
  if (text.includes("embodied") || text.includes("self")) return "aqua";
  if (text.includes("personal")) return "green";
  if (text.includes("daily") || text.includes("business")) return "orange";
  return "cream";
}

function linkCategoryIcon(category) {
  const text = String(category || "").toLowerCase();
  if (category === "All") return "▱";
  if (text.includes("kids")) return "◉";
  if (text.includes("personal")) return "♙";
  if (text.includes("relationship")) return "▭";
  if (text.includes("daily")) return "▣";
  if (text.includes("embodied")) return "✣";
  return "◌";
}

function linkCategorySvg(category) {
  const text = String(category || "").toLowerCase();
  if (text.includes("relationship") || text.includes("book")) return <BookOpenText size={20} />;
  if (text.includes("embodied") || text.includes("self")) return <Sparkles size={20} />;
  return <ContactRound size={20} />;
}

function uniqueClients(records = []) {
  const seen = new Map();
  for (const record of records) {
    const name = record.name || "Client";
    if (!seen.has(name)) seen.set(name, record);
  }
  return [...seen.values()].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
}

function groupSessions(records = []) {
  const sorted = [...records]
    .filter((record) => parseIsoDate(record.nextSession))
    .sort((a, b) => parseIsoDate(a.nextSession) - parseIsoDate(b.nextSession));
  return sorted.reduce((groups, record) => {
    const key = shortSessionDay(record.nextSession);
    groups[key] = groups[key] || [];
    groups[key].push(record);
    return groups;
  }, {});
}

function groupCarriedSessions(records = []) {
  const currentWeek = dateToInputValue(currentWeekRange().start);
  const carried = records.filter((record) => {
    const recordWeek = sessionWeekIso(record);
    if (!recordWeek || recordWeek >= currentWeek) return false;
    if (String(record.status || "").toLowerCase().includes("cancel")) return false;
    return !sessionChecklist(record).every((item) => item.done);
  });
  return groupSessions(carried);
}

function sessionRate(session) {
  const explicit = String(session?.rate || "").match(/\d+/)?.[0];
  if (explicit) return Number(explicit);
  const notesRate = String(session?.notes || "").match(/rate:\s*\$?(\d+)/i)?.[1];
  if (notesRate) return Number(notesRate);
  const seed = String(session?.name || "").split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return [81, 86, 95, 102, 116, 129][seed % 6];
}

function sessionTime(session) {
  const notesTime = String(session?.notes || "").match(/time:\s*([^\n]+)/i)?.[1];
  if (notesTime) return notesTime;
  const date = parseDateValue(session?.nextSession);
  if (date && hasTimeValue(session?.nextSession)) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  const seed = String(session?.name || "").length % 5;
  return ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "3:00 PM"][seed];
}

function shortSessionDay(value) {
  const date = parseDateValue(value) || new Date();
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatSessionDate(value) {
  return shortSessionDay(value);
}

function slashToIso(value) {
  const [month, day, year] = String(value || "").split("/");
  if (!month || !day || !year) return today();
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function isLockedNote(note) {
  const text = `${note?.title || ""} ${note?.category || ""} ${note?.content || ""}`.toLowerCase();
  return text.includes("locked") || text.includes("token");
}

function noteDate(note) {
  const value = note?.updatedAt || "";
  if (!value) return "May 17";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function wordCount(content) {
  return String(content || "").trim().split(/\s+/).filter(Boolean).length;
}

function outreachStatus(record) {
  const status = String(record?.status || "Pending").toLowerCase();
  if (status.includes("contact")) return "Contacted";
  if (status.includes("potential")) return "Potential";
  return "Pending";
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
