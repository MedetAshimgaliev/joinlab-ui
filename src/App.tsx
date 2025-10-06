import React, { useEffect, useMemo, useState } from "react";

/**
 * JoinLab React SPA — generic CRUD for the university training DB
 * ---------------------------------------------------------------
 * - Single-file React app to get you started quickly.
 * - Tailwind classes for styling (works even without Tailwind, just less pretty).
 * - Generic CRUD UI that adapts to different resources via config.
 * - Pagination, search, create/edit modal, delete with confirm.
 * - Minimal validation and helpful toasts.
 *
 * How to use locally (suggested):
 * 1) Create a Vite React app or any React project.
 * 2) Drop this file as src/JoinLabApp.tsx and import it in src/main.tsx.
 * 3) Set API base: window.__API_BASE__ = "http://localhost:8080/api" in index.html
 *    or edit API_BASE below.
 * 4) Implement backend endpoints as per the spec in the chat message.
 */

// ====== Config ======
const API_BASE = (window as any).__API_BASE__ || "/api"; // overrideable from index.html

// Resource meta config: columns (list), fields (form), etc.
// You can tweak labels, field types, and which columns show up.
const RESOURCES: Record<string, ResourceConfig<any>> = {
  dept: {
    label: "Departments",
    path: "dept",
    id: "dept_id",
    columns: [
      { key: "dept_id", label: "ID", width: "w-16" },
      { key: "name", label: "Name" },
    ],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
    ],
  },
  student: {
    label: "Students",
    path: "student",
    id: "student_id",
    columns: [
      { key: "student_id", label: "ID", width: "w-16" },
      { key: "fullname", label: "Full name" },
      { key: "year_num", label: "Year" },
      { key: "dept_id", label: "Dept" },
    ],
    fields: [
      { key: "fullname", label: "Full name", type: "text", required: true },
      { key: "year_num", label: "Year (1-4)", type: "number", min:1, max:4, required: true },
      { key: "dept_id", label: "Dept ID (nullable)", type: "number" },
    ],
  },
  teacher: {
    label: "Teachers",
    path: "teacher",
    id: "teacher_id",
    columns: [
      { key: "teacher_id", label: "ID", width: "w-16" },
      { key: "fullname", label: "Full name" },
      { key: "dept_id", label: "Dept" },
    ],
    fields: [
      { key: "fullname", label: "Full name", type: "text", required: true },
      { key: "dept_id", label: "Dept ID", type: "number", required: true },
    ],
  },
  course: {
    label: "Courses",
    path: "course",
    id: "course_id",
    columns: [
      { key: "course_id", label: "ID", width: "w-16" },
      { key: "title", label: "Title" },
      { key: "credits", label: "Credits" },
      { key: "dept_id", label: "Dept" },
    ],
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "credits", label: "Credits", type: "number", min:1, max:10, required: true },
      { key: "dept_id", label: "Dept ID", type: "number", required: true },
    ],
  },
  teach: {
    label: "Teaching",
    path: "teach",
    id: "teach_id",
    columns: [
      { key: "teach_id", label: "ID", width: "w-16" },
      { key: "teacher_id", label: "Teacher" },
      { key: "course_id", label: "Course" },
      { key: "semester", label: "Semester" },
    ],
    fields: [
      { key: "teacher_id", label: "Teacher ID", type: "number", required: true },
      { key: "course_id", label: "Course ID", type: "number", required: true },
      { key: "semester", label: "Semester", type: "text", required: true },
    ],
  },
  enroll: {
    label: "Enrollments",
    path: "enroll",
    id: "enroll_id",
    columns: [
      { key: "enroll_id", label: "ID", width: "w-16" },
      { key: "student_id", label: "Student" },
      { key: "course_id", label: "Course" },
      { key: "grade", label: "Grade" },
    ],
    fields: [
      { key: "student_id", label: "Student ID", type: "number", required: true },
      { key: "course_id", label: "Course ID", type: "number", required: true },
      { key: "grade", label: "Grade (0-100, nullable)", type: "number", min:0, max:100 },
    ],
  },
  room: {
    label: "Rooms",
    path: "room",
    id: "room_id",
    columns: [
      { key: "room_id", label: "ID", width: "w-16" },
      { key: "building", label: "Building" },
      { key: "room_num", label: "Room" },
    ],
    fields: [
      { key: "building", label: "Building", type: "text", required: true },
      { key: "room_num", label: "Room", type: "text", required: true },
    ],
  },
  sched: {
    label: "Schedule",
    path: "sched",
    id: "sched_id",
    columns: [
      { key: "sched_id", label: "ID", width: "w-16" },
      { key: "course_id", label: "Course" },
      { key: "room_id", label: "Room" },
      { key: "day_name", label: "Day" },
      { key: "start_time", label: "Start" },
      { key: "end_time", label: "End" },
    ],
    fields: [
      { key: "course_id", label: "Course ID", type: "number", required: true },
      { key: "room_id", label: "Room ID", type: "number", required: true },
      { key: "day_name", label: "Day (Mon..Fri)", type: "text", required: true },
      { key: "start_time", label: "Start (HH:MM)", type: "time", required: true },
      { key: "end_time", label: "End (HH:MM)", type: "time", required: true },
    ],
  },
  employee: {
    label: "Employees",
    path: "employee",
    id: "emp_id",
    columns: [
      { key: "emp_id", label: "ID", width: "w-16" },
      { key: "fullname", label: "Full name" },
      { key: "manager_id", label: "Manager" },
      { key: "dept_id", label: "Dept" },
    ],
    fields: [
      { key: "fullname", label: "Full name", type: "text", required: true },
      { key: "manager_id", label: "Manager ID (nullable)", type: "number" },
      { key: "dept_id", label: "Dept ID (nullable)", type: "number" },
    ],
  },
};

// ====== Types ======
type Column = { key: string; label: string; width?: string };
type Field = {
  key: string;
  label: string;
  type: "text" | "number" | "time";
  required?: boolean;
  min?: number;
  max?: number;
};

type ResourceConfig<T> = {
  label: string;
  path: string; // e.g., "student"
  id: keyof T & string; // e.g., "student_id"
  columns: Column[];
  fields: Field[];
};

type PageResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

// ====== Fetch helpers ======
async function apiList<T>(path: string, params: Record<string, any>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") usp.set(k, String(v));
  const res = await fetch(`${API_BASE}/${path}?${usp.toString()}`);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as PageResponse<T>;
}

async function apiCreate<T>(path: string, body: any) {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

async function apiUpdate<T>(path: string, id: number | string, body: any) {
  const res = await fetch(`${API_BASE}/${path}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

async function apiDelete(path: string, id: number | string) {
  const res = await fetch(`${API_BASE}/${path}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

// ====== UI helpers ======
function clsx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(t);
  }, [msg]);
  return { msg, push: setMsg } as const;
}

// ====== Generic Table ======
function DataTable<T extends Record<string, any>>({
  rows,
  columns,
  onEdit,
  onDelete,
  loading,
}: {
  rows: T[];
  columns: Column[];
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  loading?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={clsx("text-left px-3 py-2 font-medium text-gray-700", c.width)}>
                {c.label}
              </th>
            ))}
            <th className="w-32 px-3 py-2"/>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-3 py-6 text-center text-gray-500">
                Loading...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-3 py-6 text-center text-gray-500">
                No data
              </td>
            </tr>
          ) : (
            rows.map((r, idx) => (
              <tr key={idx} className={clsx(idx % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-2 align-top text-gray-800">
                    {String(r[c.key] ?? "")}
                  </td>
                ))}
                <td className="px-3 py-2">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => onEdit(r)} className="px-2 py-1 rounded-lg border hover:bg-gray-100">Edit</button>
                    <button onClick={() => onDelete(r)} className="px-2 py-1 rounded-lg border border-red-300 text-red-700 hover:bg-red-50">Delete</button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ====== Generic Form Modal ======
function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg px-2 py-1 hover:bg-gray-100">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ResourceForm<T extends Record<string, any>>({
  fields,
  value,
  onChange,
}: {
  fields: Field[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((f) => (
        <label key={f.key} className="flex flex-col gap-1">
          <span className="text-sm text-gray-700">{f.label}{f.required ? " *" : ""}</span>
          <input
            className="rounded-xl border px-3 py-2 focus:outline-none focus:ring"
            type={f.type}
            required={f.required}
            min={f.min}
            max={f.max}
            value={value?.[f.key] ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              const v = f.type === "number" ? (raw === "" ? null : Number(raw)) : raw;
              onChange({ ...value, [f.key]: v } as T);
            }}
            placeholder={f.label}
          />
        </label>
      ))}
    </div>
  );
}

// ====== Resource Panel (List + Search + CRUD) ======
function ResourcePanel<T extends Record<string, any>>({ cfg }: { cfg: ResourceConfig<T> }) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<T | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<any>({});
  const toast = useToast();

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  async function load() {
    setLoading(true);
    try {
      const data = await apiList<T>(cfg.path, { page, pageSize, q });
      setRows(data.items);
      setTotal(data.total);
    } catch (e:any) {
      toast.push(e.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, pageSize, q, cfg.path]);

  function openCreate() {
    setForm({});
    setCreating(true);
  }

  function openEdit(row: T) {
    setForm(row);
    setEditing(row);
  }

  async function submitCreate() {
    try {
      await apiCreate<T>(cfg.path, form);
      setCreating(false);
      toast.push("Created");
      load();
    } catch (e:any) {
      toast.push(e.message || "Create failed");
    }
  }

  async function submitEdit() {
    try {
      const id = (editing as any)[cfg.id];
      await apiUpdate<T>(cfg.path, id, form);
      setEditing(null);
      toast.push("Updated");
      load();
    } catch (e:any) {
      toast.push(e.message || "Update failed");
    }
  }

  async function submitDelete(row: T) {
    if (!confirm("Delete this record?")) return;
    try {
      const id = (row as any)[cfg.id];
      await apiDelete(cfg.path, id);
      toast.push("Deleted");
      load();
    } catch (e:any) {
      toast.push(e.message || "Delete failed");
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{cfg.label}</h2>
          <p className="text-sm text-gray-500">/{cfg.path} — id: {cfg.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="rounded-xl border px-3 py-2"
            placeholder="Search..."
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
          />
          <button onClick={openCreate} className="rounded-xl bg-black px-4 py-2 text-white hover:bg-gray-800">New</button>
        </div>
      </div>

      {/* Table */}
      <DataTable rows={rows} columns={cfg.columns} onEdit={openEdit} onDelete={submitDelete} loading={loading} />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Total: {total}</div>
        <div className="flex items-center gap-2">
          <button disabled={page<=1} onClick={() => setPage((p) => Math.max(1, p-1))} className="rounded-lg border px-3 py-1 disabled:opacity-50">Prev</button>
          <span className="text-sm">Page {page} / {totalPages}</span>
          <button disabled={page>=totalPages} onClick={() => setPage((p) => p+1)} className="rounded-lg border px-3 py-1 disabled:opacity-50">Next</button>
          <select value={pageSize} onChange={(e)=>{setPageSize(Number(e.target.value)); setPage(1);}} className="rounded-lg border px-2 py-1">
            {[10,20,50].map(s=> <option key={s} value={s}>{s}/page</option>)}
          </select>
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={creating} onClose={()=>setCreating(false)} title={`Create in ${cfg.label}`}>
        <div className="space-y-4">
          <ResourceForm fields={cfg.fields} value={form} onChange={setForm} />
          <div className="flex justify-end gap-2">
            <button onClick={()=>setCreating(false)} className="rounded-lg border px-4 py-2">Cancel</button>
            <button onClick={submitCreate} className="rounded-lg bg-black px-4 py-2 text-white">Create</button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editing} onClose={()=>setEditing(null)} title={`Edit ${cfg.label}`}>
        <div className="space-y-4">
          <ResourceForm fields={cfg.fields} value={form} onChange={setForm} />
          <div className="flex justify-end gap-2">
            <button onClick={()=>setEditing(null)} className="rounded-lg border px-4 py-2">Cancel</button>
            <button onClick={submitEdit} className="rounded-lg bg-black px-4 py-2 text-white">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ====== App Shell ======
const TABS = Object.keys(RESOURCES) as Array<keyof typeof RESOURCES>;

export default function JoinLabApp() {
  const [tab, setTab] = useState<keyof typeof RESOURCES>("student");
  const cfg = RESOURCES[tab];
  const toast = useToast();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold">JoinLab Admin</h1>
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={String(t)}
                onClick={() => setTab(t)}
                className={clsx(
                  "rounded-full px-3 py-1 text-sm border",
                  t === tab ? "bg-black text-white border-black" : "bg-white hover:bg-gray-100"
                )}
              >{RESOURCES[t].label}</button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 space-y-6">
        <ResourcePanel cfg={cfg as any} />
      </main>

      {toast.msg && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-xl bg-black text-white px-4 py-2 shadow-lg">
          {toast.msg}
        </div>
      )}

      <footer className="mt-10 py-8 text-center text-xs text-gray-500">
        API base: <code>{API_BASE}</code> — switch with <code>window.__API_BASE__</code>
      </footer>
    </div>
  );
}
