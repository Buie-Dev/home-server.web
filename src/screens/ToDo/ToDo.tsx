import React, { ReactElement, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArchiveIcon from '@mui/icons-material/Archive';
import IconButton from '@mui/material/IconButton';
import PageContainer from 'components/PageContainer/PageContainer';
import LoadingSpinner from 'components/LoadingSpinner/LoadingSpinner';
import useTodo, { TodoCategory, TodoTask, TodoTemplate, TodoHistoryItem, Frequency } from 'hooks/useTodo.hook';
import useBodyScrollLock from 'hooks/useBodyScrollLock.hook';
import useConfirm from 'hooks/useConfirm.hook';
import styles from './ToDo.module.scss';

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'one_time', label: 'One time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const freqLabel = ({ frequency, month }: { frequency: Frequency; month?: number }) => {
  const f = FREQUENCIES.find((x) => x.value === frequency)?.label ?? frequency;
  return frequency === 'yearly' && month ? `${f} (${MONTHS[month - 1]})` : f;
};

// ── Category filter helpers ──────────────────────────────────────────────────

type FilterRowProps = {
  categories: TodoCategory[];
  categoryId: number | '';
  subcategoryId: number | '';
  onCategory: ({ value }: { value: number | '' }) => void;
  onSubcategory: ({ value }: { value: number | '' }) => void;
  children?: React.ReactNode;
};

function FilterRow({
  categories,
  categoryId,
  subcategoryId,
  onCategory,
  onSubcategory,
  children,
}: FilterRowProps): ReactElement {
  const subs = categories.find((c) => c.id === categoryId)?.subcategories ?? [];
  return (
    <div className={styles.filterRow}>
      <select
        className={styles.filterSelect}
        value={categoryId}
        onChange={(e) => onCategory({ value: e.target.value ? Number(e.target.value) : '' })}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {subs.length > 0 && (
        <select
          className={styles.filterSelect}
          value={subcategoryId}
          onChange={(e) => onSubcategory({ value: e.target.value ? Number(e.target.value) : '' })}
        >
          <option value="">All subcategories</option>
          {subs.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}
      {children}
    </div>
  );
}

// ── Manage Categories Modal ──────────────────────────────────────────────────

type ManageCatProps = {
  categories: TodoCategory[];
  onClose: () => void;
  onAddCategory: ({ name, subcategoryNames }: { name: string; subcategoryNames: string[] }) => Promise<void>;
  onUpdateCategory: ({ id, name }: { id: number; name: string }) => Promise<void>;
  onDeleteCategory: ({ id }: { id: number }) => Promise<void>;
  onAddSubcategory: ({ categoryId, name }: { categoryId: number; name: string }) => Promise<void>;
  onUpdateSubcategory: ({ id, name }: { id: number; name: string }) => Promise<void>;
  onDeleteSubcategory: ({ id }: { id: number }) => Promise<void>;
};

function ManageCatModal({
  categories,
  onClose,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddSubcategory,
  onUpdateSubcategory,
  onDeleteSubcategory,
}: ManageCatProps): ReactElement {
  useBodyScrollLock();
  const { confirm, alert, prompt, confirmElement } = useConfirm();
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newSubNames, setNewSubNames] = useState<Record<number, string>>({});

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    await onAddCategory({ name: newCatName.trim(), subcategoryNames: [] });
    setNewCatName('');
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Manage Categories</h3>
          <button className={styles.modalClose} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.catList}>
          {categories.map((cat) => (
            <div key={cat.id} className={styles.catItem}>
              <div className={styles.catRow}>
                {editingId === cat.id ? (
                  <input
                    className={styles.catInput}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <span className={styles.catName}>
                    {cat.name} <span className={styles.catCount}>({cat.itemCount})</span>
                  </span>
                )}
                <div className={styles.catActions}>
                  {editingId === cat.id ? (
                    <>
                      <button
                        className={styles.iconBtn}
                        onClick={async () => {
                          await onUpdateCategory({ id: cat.id, name: editingName.trim() });
                          setEditingId(null);
                        }}
                      >
                        ✓
                      </button>
                      <button className={styles.iconBtn} onClick={() => setEditingId(null)}>
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditingName(cat.name);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        disabled={cat.itemCount > 0}
                        onClick={async () => {
                          if (cat.itemCount > 0) {
                            await alert({ message: `"${cat.name}" has active templates. Remove them first.` });
                            return;
                          }
                          if (
                            !(await confirm({
                              message: `Delete "${cat.name}"?`,
                              variant: 'danger',
                              confirmLabel: 'Delete',
                            }))
                          )
                            return;
                          await onDeleteCategory({ id: cat.id });
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </div>
              </div>
              {cat.subcategories.map((sub) => (
                <div key={sub.id} className={styles.subRow}>
                  <span className={styles.subName}>— {sub.name}</span>
                  <div className={styles.catActions}>
                    <IconButton
                      size="small"
                      onClick={async () => {
                        const n = await prompt({ message: 'New name:', defaultValue: sub.name });
                        if (n?.trim()) onUpdateSubcategory({ id: sub.id, name: n.trim() });
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={async () => {
                        if (
                          await confirm({ message: `Delete "${sub.name}"?`, variant: 'danger', confirmLabel: 'Delete' })
                        )
                          onDeleteSubcategory({ id: sub.id });
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </div>
                </div>
              ))}
              <div className={styles.addSubRow}>
                <input
                  className={styles.subInput}
                  placeholder="Add subcategory…"
                  value={newSubNames[cat.id] ?? ''}
                  onChange={(e) => setNewSubNames((p) => ({ ...p, [cat.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onAddSubcategory({ categoryId: cat.id, name: newSubNames[cat.id]?.trim() ?? '' });
                      setNewSubNames((p) => ({ ...p, [cat.id]: '' }));
                    }
                  }}
                />
                <button
                  className={styles.addSubBtn}
                  onClick={() => {
                    onAddSubcategory({ categoryId: cat.id, name: newSubNames[cat.id]?.trim() ?? '' });
                    setNewSubNames((p) => ({ ...p, [cat.id]: '' }));
                  }}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.addCatRow}>
          <input
            className={styles.fieldInput}
            placeholder="New category name"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCategory();
            }}
          />
          <button className={styles.primaryBtn} onClick={handleAddCategory} disabled={!newCatName.trim()}>
            Add
          </button>
        </div>
        <div className={styles.modalBtns}>
          <button className={styles.primaryBtn} onClick={onClose}>
            Done
          </button>
        </div>
        {confirmElement}
      </div>
    </div>
  );
}

// ── Add/Edit Template Modal ──────────────────────────────────────────────────

type TemplateModalProps = {
  template: TodoTemplate | null;
  categories: TodoCategory[];
  onSave: ({ data }: { data: any }) => Promise<void>;
  onClose: () => void;
};

function TemplateModal({ template, categories, onSave, onClose }: TemplateModalProps): ReactElement {
  useBodyScrollLock();
  const [title, setTitle] = useState(template?.title ?? '');
  const [notes, setNotes] = useState(template?.notes ?? '');
  const [categoryId, setCategoryId] = useState<number | ''>(template?.categoryId ?? categories[0]?.id ?? '');
  const [subcategoryId, setSubcategoryId] = useState<number | ''>(template?.subcategoryId ?? '');
  const [frequency, setFrequency] = useState<Frequency>(template?.frequency ?? 'one_time');
  const [month, setMonth] = useState<number>(template?.month ?? 1);
  const [newItem, setNewItem] = useState('');
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const subs = categories.find((c) => c.id === categoryId)?.subcategories ?? [];

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!categoryId) {
      setError('Category is required.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        data: {
          title: title.trim(),
          notes: notes.trim() || undefined,
          categoryId: Number(categoryId),
          subcategoryId: subcategoryId ? Number(subcategoryId) : undefined,
          frequency,
          month: frequency === 'yearly' ? month : undefined,
          checklistItems,
        },
      });
      onClose();
    } catch {
      setError('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{template ? 'Edit Template' : 'Add Template'}</h3>
          <button className={styles.modalClose} onClick={onClose}>
            ✕
          </button>
        </div>
        {error && <p className={styles.modalError}>{error}</p>}
        <label className={styles.fieldLabel}>Title *</label>
        <input
          className={styles.fieldInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Template title"
          autoFocus
        />
        <label className={styles.fieldLabel}>Category *</label>
        <select
          className={styles.fieldInput}
          value={categoryId}
          onChange={(e) => {
            setCategoryId(Number(e.target.value));
            setSubcategoryId('');
          }}
        >
          <option value="" disabled>
            Select category
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {subs.length > 0 && (
          <>
            <label className={styles.fieldLabel}>Subcategory</label>
            <select
              className={styles.fieldInput}
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">None</option>
              {subs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </>
        )}
        <label className={styles.fieldLabel}>Frequency</label>
        <select
          className={styles.fieldInput}
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as Frequency)}
        >
          {FREQUENCIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        {frequency === 'yearly' && (
          <>
            <label className={styles.fieldLabel}>Month</label>
            <select className={styles.fieldInput} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </>
        )}
        <label className={styles.fieldLabel}>Notes</label>
        <textarea
          className={styles.fieldTextarea}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes"
          rows={2}
        />
        {!template && (
          <>
            <label className={styles.fieldLabel}>Checklist items</label>
            <div className={styles.checklistAddRow}>
              <input
                className={styles.fieldInput}
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add item…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newItem.trim()) {
                    setChecklistItems((p) => [...p, newItem.trim()]);
                    setNewItem('');
                  }
                }}
              />
              <button
                className={styles.addSubBtn}
                onClick={() => {
                  if (newItem.trim()) {
                    setChecklistItems((p) => [...p, newItem.trim()]);
                    setNewItem('');
                  }
                }}
              >
                +
              </button>
            </div>
            {checklistItems.map((item, i) => (
              <div key={i} className={styles.checklistPreviewItem}>
                <span>{item}</span>
                <button
                  className={styles.iconBtn}
                  onClick={() => setChecklistItems((p) => p.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              </div>
            ))}
          </>
        )}
        <div className={styles.modalBtns}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.primaryBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Direct Task Modal ────────────────────────────────────────────────────

type DirectTaskModalProps = {
  categories: TodoCategory[];
  onSave: ({ data }: { data: any }) => Promise<void>;
  onClose: () => void;
};

function DirectTaskModal({ categories, onSave, onClose }: DirectTaskModalProps): ReactElement {
  useBodyScrollLock();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>(categories[0]?.id ?? '');
  const [subcategoryId, setSubcategoryId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const subs = categories.find((c) => c.id === categoryId)?.subcategories ?? [];

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!categoryId) {
      setError('Category is required.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        data: {
          title: title.trim(),
          notes: notes.trim() || undefined,
          categoryId: Number(categoryId),
          subcategoryId: subcategoryId ? Number(subcategoryId) : undefined,
        },
      });
      onClose();
    } catch {
      setError('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Add Task</h3>
          <button className={styles.modalClose} onClick={onClose}>
            ✕
          </button>
        </div>
        {error && <p className={styles.modalError}>{error}</p>}
        <label className={styles.fieldLabel}>Title *</label>
        <input
          className={styles.fieldInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          autoFocus
        />
        <label className={styles.fieldLabel}>Category *</label>
        <select
          className={styles.fieldInput}
          value={categoryId}
          onChange={(e) => {
            setCategoryId(Number(e.target.value));
            setSubcategoryId('');
          }}
        >
          <option value="" disabled>
            Select category
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {subs.length > 0 && (
          <>
            <label className={styles.fieldLabel}>Subcategory</label>
            <select
              className={styles.fieldInput}
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">None</option>
              {subs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </>
        )}
        <label className={styles.fieldLabel}>Notes</label>
        <textarea
          className={styles.fieldTextarea}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes"
          rows={2}
        />
        <div className={styles.modalBtns}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.primaryBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Task Row ─────────────────────────────────────────────────────────────────

type TaskRowProps = {
  task: TodoTask;
  onComplete: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onToggleChecklist: ({ id, checked }: { id: number; checked: boolean }) => void;
};

function TaskRow({ task, onComplete, onArchive, onDelete, onToggleChecklist }: TaskRowProps): ReactElement {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`${styles.taskRow} ${task.completed ? styles.taskCompleted : ''}`}>
      <div className={styles.taskMain}>
        <button
          className={styles.completeBtn}
          onClick={onComplete}
          disabled={task.completed}
          title={task.completed ? 'Completed' : 'Mark complete'}
        >
          {task.completed ? (
            <CheckCircleIcon style={{ color: '#4CAF50' }} />
          ) : (
            <CheckCircleOutlineIcon style={{ color: '#bbb' }} />
          )}
        </button>
        <div className={styles.taskContent} onClick={() => setExpanded((p) => !p)}>
          <span className={`${styles.taskTitle} ${task.completed ? styles.taskTitleDone : ''}`}>{task.title}</span>
          <div className={styles.taskMeta}>
            <span className={styles.catBadge}>{task.categoryName}</span>
            {task.subcategoryName && <span className={styles.subBadge}>{task.subcategoryName}</span>}
            <span className={styles.freqBadge}>{freqLabel({ frequency: task.frequency })}</span>
          </div>
        </div>
        <div className={styles.taskActions}>
          <IconButton size="small" title="Archive" onClick={onArchive}>
            <ArchiveIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" title="Delete" onClick={onDelete}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </div>
      </div>
      {expanded && (
        <div className={styles.taskDetail}>
          {task.notes && <p className={styles.taskNotes}>{task.notes}</p>}
          {(task.checklistItems ?? []).length > 0 && (
            <div className={styles.checklist}>
              {(task.checklistItems ?? []).map((item) => (
                <label key={item.id} className={styles.checklistItem}>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => onToggleChecklist({ id: item.id, checked: e.target.checked })}
                  />
                  <span className={item.checked ? styles.checklistTextDone : ''}>{item.text}</span>
                </label>
              ))}
            </div>
          )}
          <span className={styles.taskDate}>Added {dayjs(task.addedAt).format('MMM D, YYYY')}</span>
        </div>
      )}
    </div>
  );
}

// ── Main ToDo Screen ──────────────────────────────────────────────────────────

type Tab = 'tasks' | 'templates' | 'history';

function ToDo(): ReactElement {
  const {
    categories,
    templates,
    tasks,
    history,
    loading,
    fetchCategories,
    fetchTemplates,
    fetchTasks,
    fetchHistory,
    createCategory,
    updateCategory,
    deleteCategory,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createTaskFromTemplate,
    createDirectTask,
    completeTask,
    archiveTask,
    archiveAllCompleted,
    deleteTask,
    toggleChecklistItem,
  } = useTodo();
  const { confirm, confirmElement } = useConfirm();

  const [tab, setTab] = useState<Tab>('tasks');
  const [catId, setCatId] = useState<number | ''>('');
  const [subId, setSubId] = useState<number | ''>('');
  const [showManageCat, setShowManageCat] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TodoTemplate | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = ({ next }: { next: Tab }) => {
    setTab(next);
    setCatId('');
    setSubId('');
    if (next === 'tasks') fetchTasks();
    if (next === 'templates') fetchTemplates();
    if (next === 'history') fetchHistory();
  };

  const handleFilterCategory = ({ value }: { value: number | '' }) => {
    setCatId(value);
    setSubId('');
    const f = { categoryId: value || undefined, subcategoryId: undefined };
    if (tab === 'tasks') fetchTasks(f);
    if (tab === 'templates') fetchTemplates(f);
    if (tab === 'history') fetchHistory(f);
  };

  const handleFilterSubcategory = ({ value }: { value: number | '' }) => {
    setSubId(value);
    const f = { categoryId: catId || undefined, subcategoryId: value || undefined };
    if (tab === 'tasks') fetchTasks(f);
    if (tab === 'templates') fetchTemplates(f);
    if (tab === 'history') fetchHistory(f);
  };

  const handleCompleteTask = async ({ task }: { task: TodoTask }) => {
    await completeTask({ id: task.id });
  };

  const handleArchiveTask = async ({ task }: { task: TodoTask }) => {
    await archiveTask({ id: task.id });
  };

  const handleDeleteTask = async ({ task }: { task: TodoTask }) => {
    if (!(await confirm({ message: `Delete "${task.title}"?`, variant: 'danger', confirmLabel: 'Delete' }))) return;
    await deleteTask({ id: task.id });
  };

  const handleDeleteTemplate = async ({ template }: { template: TodoTemplate }) => {
    if (
      !(await confirm({ message: `Delete template "${template.title}"?`, variant: 'danger', confirmLabel: 'Delete' }))
    )
      return;
    await deleteTemplate({ id: template.id });
  };

  const handleAddTaskFromTemplate = async ({ template }: { template: TodoTemplate }) => {
    await createTaskFromTemplate({ templateId: template.id });
    handleTabChange({ next: 'tasks' });
  };

  const handleArchiveAll = async () => {
    if (!(await confirm({ message: 'Archive all completed tasks?' }))) return;
    await archiveAllCompleted();
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>To Do</h2>
        <button className={styles.manageCatBtn} onClick={() => setShowManageCat(true)}>
          Manage Categories
        </button>
      </div>

      <div className={styles.tabs}>
        {(['tasks', 'templates', 'history'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => handleTabChange({ next: t })}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <FilterRow
        categories={categories}
        categoryId={catId}
        subcategoryId={subId}
        onCategory={handleFilterCategory}
        onSubcategory={handleFilterSubcategory}
      >
        {tab === 'tasks' && (
          <>
            <button className={styles.addBtn} onClick={() => setShowAddTask(true)}>
              + Add Task
            </button>
            {completedCount > 0 && (
              <button className={styles.archiveAllBtn} onClick={handleArchiveAll}>
                Archive completed ({completedCount})
              </button>
            )}
          </>
        )}
        {tab === 'templates' && (
          <button
            className={styles.addBtn}
            onClick={() => {
              setEditingTemplate(null);
              setShowAddTemplate(true);
            }}
          >
            + Add Template
          </button>
        )}
      </FilterRow>

      {loading && <LoadingSpinner />}

      {/* Tasks tab */}
      {!loading && tab === 'tasks' && (
        <div className={styles.list}>
          {tasks.length === 0 && <p className={styles.empty}>No tasks found.</p>}
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onComplete={() => handleCompleteTask({ task })}
              onArchive={() => handleArchiveTask({ task })}
              onDelete={() => handleDeleteTask({ task })}
              onToggleChecklist={toggleChecklistItem}
            />
          ))}
        </div>
      )}

      {/* Templates tab */}
      {!loading && tab === 'templates' && (
        <div className={styles.list}>
          {templates.length === 0 && <p className={styles.empty}>No templates found.</p>}
          {templates.map((template) => (
            <div key={template.id} className={styles.templateCard}>
              <div className={styles.templateMain}>
                <div className={styles.templateInfo}>
                  <span className={styles.templateTitle}>{template.title}</span>
                  <div className={styles.taskMeta}>
                    <span className={styles.catBadge}>{template.categoryName}</span>
                    {template.subcategoryName && <span className={styles.subBadge}>{template.subcategoryName}</span>}
                    <span className={styles.freqBadge}>
                      {freqLabel({ frequency: template.frequency, month: template.month })}
                    </span>
                  </div>
                  {template.notes && <p className={styles.templateNotes}>{template.notes}</p>}
                </div>
                <div className={styles.taskActions}>
                  <button className={styles.useBtn} onClick={() => handleAddTaskFromTemplate({ template })}>
                    Use
                  </button>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditingTemplate(template);
                      setShowAddTemplate(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteTemplate({ template })}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History tab */}
      {!loading && tab === 'history' && (
        <div className={styles.list}>
          {history.length === 0 && <p className={styles.empty}>No history yet.</p>}
          {history.map((item: TodoHistoryItem) => (
            <div key={item.id} className={styles.historyRow}>
              <div className={styles.historyMain}>
                <span className={styles.historyTitle}>{item.title}</span>
                <div className={styles.taskMeta}>
                  <span className={styles.catBadge}>{item.categoryName}</span>
                  {item.subcategoryName && <span className={styles.subBadge}>{item.subcategoryName}</span>}
                  <span className={styles.freqBadge}>{freqLabel({ frequency: item.frequency })}</span>
                </div>
              </div>
              <span className={styles.historyDate}>{dayjs(item.completedAt).format('MMM D, YYYY')}</span>
            </div>
          ))}
        </div>
      )}

      {showManageCat && (
        <ManageCatModal
          categories={categories}
          onClose={() => setShowManageCat(false)}
          onAddCategory={createCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
          onAddSubcategory={createSubcategory}
          onUpdateSubcategory={updateSubcategory}
          onDeleteSubcategory={deleteSubcategory}
        />
      )}

      {showAddTemplate && (
        <TemplateModal
          template={editingTemplate}
          categories={categories}
          onSave={editingTemplate ? ({ data }) => updateTemplate({ id: editingTemplate.id, data }) : createTemplate}
          onClose={() => {
            setShowAddTemplate(false);
            setEditingTemplate(null);
          }}
        />
      )}

      {showAddTask && (
        <DirectTaskModal categories={categories} onSave={createDirectTask} onClose={() => setShowAddTask(false)} />
      )}
      {confirmElement}
    </PageContainer>
  );
}

export default ToDo;
