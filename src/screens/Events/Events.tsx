import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ListIcon from '@mui/icons-material/List';
import PageContainer from 'components/PageContainer/PageContainer';
import useEvents, { CalendarEvent, EventCategory } from 'hooks/useEvents.hook';
import useBodyScrollLock from 'hooks/useBodyScrollLock.hook';
import useConfirm from 'hooks/useConfirm.hook';
import styles from './Events.module.scss';

const CATEGORY_COLORS = [
  '#2196F3',
  '#4CAF50',
  '#E91E63',
  '#FF9800',
  '#9C27B0',
  '#00BCD4',
  '#F44336',
  '#607D8B',
  '#795548',
  '#3F51B5',
];

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getCategoryColor = ({ index }: { index: number }) => CATEGORY_COLORS[index % CATEGORY_COLORS.length];

const formatTime = ({ timeStr }: { timeStr: string }) => {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const toDateStr = ({ d }: { d: Dayjs }) => d.format('YYYY-MM-DD');

// ── Add/Edit Modal ─────────────────────────────────────────────────────────────

type EventPayload = {
  title: string;
  description?: string;
  date: string;
  time?: string;
  categoryId: number;
  subcategoryId?: number;
};

type AddEditModalProps = {
  event: CalendarEvent | null;
  defaultDate: string;
  categories: EventCategory[];
  onSave: ({ data }: { data: EventPayload }) => Promise<void>;
  onClose: () => void;
};

function AddEditModal({ event, defaultDate, categories, onSave, onClose }: AddEditModalProps): ReactElement {
  useBodyScrollLock();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description ?? '');
      setDate(event.date);
      setTime(event.time ?? '');
      setCategoryId(event.categoryId);
      setSubcategoryId(event.subcategoryId ?? null);
    } else {
      setTitle('');
      setDescription('');
      setDate(defaultDate);
      setTime('');
      setCategoryId(categories[0]?.id ?? null);
      setSubcategoryId(null);
    }
    setError('');
  }, [event, defaultDate]);

  const selectedCategory = categories.find((c) => c.id === categoryId) ?? null;
  const subcategories = selectedCategory?.subcategories ?? [];

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!categoryId) {
      setError('Please select a category.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          date,
          time: time || undefined,
          categoryId,
          subcategoryId: subcategoryId ?? undefined,
        },
      });
      onClose();
    } catch {
      setError('Failed to save event.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{event ? 'Edit Event' : 'Add Event'}</h3>
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
          placeholder="Event title"
        />

        <label className={styles.fieldLabel}>Date *</label>
        <input className={styles.fieldInput} type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <label className={styles.fieldLabel}>
          Time <span className={styles.optional}>(optional)</span>
        </label>
        <input className={styles.fieldInput} type="time" value={time} onChange={(e) => setTime(e.target.value)} />

        <label className={styles.fieldLabel}>Category *</label>
        <select
          className={styles.fieldInput}
          value={categoryId ?? ''}
          onChange={(e) => {
            setCategoryId(Number(e.target.value));
            setSubcategoryId(null);
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

        {subcategories.length > 0 && (
          <>
            <label className={styles.fieldLabel}>
              Subcategory <span className={styles.optional}>(optional)</span>
            </label>
            <select
              className={styles.fieldInput}
              value={subcategoryId ?? ''}
              onChange={(e) => setSubcategoryId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">None</option>
              {subcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </>
        )}

        <label className={styles.fieldLabel}>
          Description <span className={styles.optional}>(optional)</span>
        </label>
        <textarea
          className={styles.fieldTextarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional notes"
          rows={3}
        />

        <div className={styles.modalBtns}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Manage Categories Modal ────────────────────────────────────────────────────

type ManageCatModalProps = {
  categories: EventCategory[];
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
}: ManageCatModalProps): ReactElement {
  useBodyScrollLock();
  const { confirm, alert, prompt, confirmElement } = useConfirm();
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newSubNames, setNewSubNames] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setSaving(true);
    try {
      await onAddCategory({ name: newCatName.trim(), subcategoryNames: [] });
      setNewCatName('');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategory = async ({ id }: { id: number }) => {
    if (!editingName.trim()) return;
    setSaving(true);
    try {
      await onUpdateCategory({ id, name: editingName.trim() });
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async ({ cat }: { cat: EventCategory }) => {
    if (cat.itemCount > 0) {
      await alert({ message: `"${cat.name}" has ${cat.itemCount} event(s). Remove them first.` });
      return;
    }
    if (!(await confirm({ message: `Delete "${cat.name}"?`, variant: 'danger', confirmLabel: 'Delete' }))) return;
    await onDeleteCategory({ id: cat.id });
  };

  const handleAddSubcategory = async ({ categoryId }: { categoryId: number }) => {
    const name = newSubNames[categoryId]?.trim();
    if (!name) return;
    setSaving(true);
    try {
      await onAddSubcategory({ categoryId, name });
      setNewSubNames((prev) => ({ ...prev, [categoryId]: '' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
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
                        onClick={() => handleUpdateCategory({ id: cat.id })}
                        disabled={saving}
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
                        onClick={() => handleDeleteCategory({ cat })}
                        disabled={cat.itemCount > 0}
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
                  onChange={(e) => setNewSubNames((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSubcategory({ categoryId: cat.id });
                  }}
                />
                <button className={styles.addSubBtn} onClick={() => handleAddSubcategory({ categoryId: cat.id })}>
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
          <button className={styles.saveBtn} onClick={handleAddCategory} disabled={saving || !newCatName.trim()}>
            Add
          </button>
        </div>

        <div className={styles.modalBtns}>
          <button className={styles.saveBtn} onClick={onClose}>
            Done
          </button>
        </div>
        {confirmElement}
      </div>
    </div>
  );
}

// ── Main Events Screen ─────────────────────────────────────────────────────────

function Events(): ReactElement {
  const {
    events,
    categories,
    loading,
    fetchEvents,
    fetchCategories,
    createEvent,
    updateEvent,
    deleteEvent,
    createCategory,
    updateCategory,
    deleteCategory,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
  } = useEvents();
  const { confirm, confirmElement: eventsConfirmElement } = useConfirm();

  const [view, setView] = useState<'calendar' | 'list'>('list');
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs().startOf('month'));
  const [selectedDate, setSelectedDate] = useState<string>(toDateStr({ d: dayjs() }));
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showManageCat, setShowManageCat] = useState(false);
  const [filterCategoryId, setFilterCategoryId] = useState<number | ''>('');
  const [filterSubcategoryId, setFilterSubcategoryId] = useState<number | ''>('');

  useEffect(() => {
    fetchCategories();
    fetchEvents();
  }, []);

  const doFetch = ({
    categoryId,
    subcategoryId,
    month,
    year,
  }: {
    categoryId?: number;
    subcategoryId?: number;
    month?: number;
    year?: number;
  }) => {
    fetchEvents({ categoryId, subcategoryId, month, year });
  };

  const loadMonth = ({ month }: { month: Dayjs }) => {
    setCurrentMonth(month);
    doFetch({
      categoryId: filterCategoryId || undefined,
      subcategoryId: filterSubcategoryId || undefined,
      month: month.month() + 1,
      year: month.year(),
    });
  };

  const handleFilterCategory = ({ value }: { value: number | '' }) => {
    setFilterCategoryId(value);
    setFilterSubcategoryId('');
    doFetch({
      categoryId: value || undefined,
      subcategoryId: undefined,
      month: view === 'calendar' ? currentMonth.month() + 1 : undefined,
      year: view === 'calendar' ? currentMonth.year() : undefined,
    });
  };

  const handleFilterSubcategory = ({ value }: { value: number | '' }) => {
    setFilterSubcategoryId(value);
    doFetch({
      categoryId: filterCategoryId || undefined,
      subcategoryId: value || undefined,
      month: view === 'calendar' ? currentMonth.month() + 1 : undefined,
      year: view === 'calendar' ? currentMonth.year() : undefined,
    });
  };

  const handleViewToggle = ({ nextView }: { nextView: 'calendar' | 'list' }) => {
    setView(nextView);
    doFetch({
      categoryId: filterCategoryId || undefined,
      subcategoryId: filterSubcategoryId || undefined,
      month: nextView === 'calendar' ? currentMonth.month() + 1 : undefined,
      year: nextView === 'calendar' ? currentMonth.year() : undefined,
    });
  };

  const categoryColorMap: Record<number, string> = Object.fromEntries(
    categories.map((c, i) => [c.id, getCategoryColor({ index: i })])
  );

  const filterCategoryObj = categories.find((c) => c.id === filterCategoryId) ?? null;
  const filterSubcategories = filterCategoryObj?.subcategories ?? [];

  // Calendar grid
  const startOfGrid = currentMonth.startOf('month').startOf('week');
  const endOfGrid = currentMonth.endOf('month').endOf('week');
  const days: Dayjs[] = [];
  let d = startOfGrid;
  while (d.isBefore(endOfGrid) || d.isSame(endOfGrid, 'day')) {
    days.push(d);
    d = d.add(1, 'day');
  }

  const eventsByDate: Record<string, CalendarEvent[]> = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    return map;
  }, [events]);

  const selectedEvents = (eventsByDate[selectedDate] ?? []).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));

  // List view: group by date
  const listSections = useMemo(() => {
    const sorted = [...events].sort((a, b) => {
      const dd = a.date.localeCompare(b.date);
      return dd !== 0 ? dd : (a.time ?? '').localeCompare(b.time ?? '');
    });
    const groups: Record<string, CalendarEvent[]> = {};
    for (const ev of sorted) {
      if (!groups[ev.date]) groups[ev.date] = [];
      groups[ev.date].push(ev);
    }
    return Object.entries(groups);
  }, [events]);

  const handleSave = async ({ data }: { data: EventPayload }) => {
    if (editingEvent) {
      await updateEvent({ id: editingEvent.id, data });
    } else {
      await createEvent({ data });
    }
  };

  const handleDelete = async ({ event }: { event: CalendarEvent }) => {
    if (!(await confirm({ message: `Delete "${event.title}"?`, variant: 'danger', confirmLabel: 'Delete' }))) return;
    await deleteEvent({ id: event.id });
  };

  const today = toDateStr({ d: dayjs() });

  return (
    <PageContainer>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Events</h2>
        <div className={styles.pageHeaderActions}>
          <button className={styles.manageCatBtn} onClick={() => setShowManageCat(true)}>
            Manage Categories
          </button>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewToggleBtn} ${view === 'calendar' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => handleViewToggle({ nextView: 'calendar' })}
              title="Calendar view"
            >
              <CalendarMonthIcon fontSize="small" />
            </button>
            <button
              className={`${styles.viewToggleBtn} ${view === 'list' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => handleViewToggle({ nextView: 'list' })}
              title="List view"
            >
              <ListIcon fontSize="small" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterRow}>
        <select
          className={styles.filterSelect}
          value={filterCategoryId}
          onChange={(e) => handleFilterCategory({ value: e.target.value ? Number(e.target.value) : '' })}
        >
          <option value="">All categories</option>
          {categories.map((c, i) => (
            <option key={c.id} value={c.id} style={{ color: getCategoryColor({ index: i }) }}>
              {c.name}
            </option>
          ))}
        </select>
        {filterSubcategories.length > 0 && (
          <select
            className={styles.filterSelect}
            value={filterSubcategoryId}
            onChange={(e) => handleFilterSubcategory({ value: e.target.value ? Number(e.target.value) : '' })}
          >
            <option value="">All subcategories</option>
            {filterSubcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        <button
          className={styles.addEventHeaderBtn}
          onClick={() => {
            setEditingEvent(null);
            setShowAddEdit(true);
          }}
        >
          + Add Event
        </button>
      </div>

      {view === 'calendar' ? (
        <div className={styles.calendarLayout}>
          {/* Calendar */}
          <div className={styles.calendarPanel}>
            <div className={styles.monthNav}>
              <IconButton onClick={() => loadMonth({ month: currentMonth.subtract(1, 'month') })}>
                <ChevronLeftIcon />
              </IconButton>
              <span className={styles.monthLabel}>{currentMonth.format('MMMM YYYY')}</span>
              <IconButton onClick={() => loadMonth({ month: currentMonth.add(1, 'month') })}>
                <ChevronRightIcon />
              </IconButton>
            </div>

            <div className={styles.calendarGrid}>
              {DAY_HEADERS.map((h) => (
                <div key={h} className={styles.dayHeader}>
                  {h}
                </div>
              ))}
              {days.map((day) => {
                const dateStr = toDateStr({ d: day });
                const isCurrentMonth = day.month() === currentMonth.month();
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === today;
                const dayEvents = eventsByDate[dateStr] ?? [];

                return (
                  <div
                    key={dateStr}
                    className={[
                      styles.dayCell,
                      !isCurrentMonth ? styles.dayCellOther : '',
                      isSelected ? styles.dayCellSelected : '',
                      isToday ? styles.dayCellToday : '',
                    ].join(' ')}
                    onClick={() => setSelectedDate(dateStr)}
                  >
                    <span className={styles.dayNum}>{day.date()}</span>
                    {dayEvents.length > 0 && (
                      <div className={styles.eventDots}>
                        {dayEvents.slice(0, 3).map((ev) => (
                          <span
                            key={ev.id}
                            className={styles.eventDot}
                            style={{ backgroundColor: categoryColorMap[ev.categoryId] ?? '#2196F3' }}
                          />
                        ))}
                        {dayEvents.length > 3 && <span className={styles.eventDotMore}>+{dayEvents.length - 3}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {loading && <p className={styles.loadingText}>Loading…</p>}
          </div>

          {/* Day Panel */}
          <div className={styles.dayPanel}>
            <div className={styles.dayPanelHeader}>
              <span className={styles.dayPanelDate}>{dayjs(selectedDate).format('dddd, MMMM D')}</span>
              <button
                className={styles.addEventBtn}
                onClick={() => {
                  setEditingEvent(null);
                  setShowAddEdit(true);
                }}
              >
                + Add Event
              </button>
            </div>

            {selectedEvents.length === 0 ? (
              <p className={styles.noEvents}>No events on this day</p>
            ) : (
              <div className={styles.eventList}>
                {selectedEvents.map((ev) => {
                  const color = categoryColorMap[ev.categoryId] ?? '#2196F3';
                  return (
                    <div key={ev.id} className={styles.eventItem} style={{ borderLeftColor: color }}>
                      <div className={styles.eventItemMain}>
                        <div className={styles.eventItemTop}>
                          <span className={styles.eventItemTitle}>{ev.title}</span>
                          <div className={styles.eventItemActions}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingEvent(ev);
                                setShowAddEdit(true);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete({ event: ev })}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </div>
                        </div>
                        {ev.time && <span className={styles.eventItemTime}>{formatTime({ timeStr: ev.time })}</span>}
                        <div className={styles.eventItemMeta}>
                          <span className={styles.catTag} style={{ backgroundColor: color + '22', color }}>
                            {ev.categoryName}
                          </span>
                          {ev.subcategoryName && <span className={styles.subCatTag}>{ev.subcategoryName}</span>}
                        </div>
                        {ev.description && <p className={styles.eventItemDesc}>{ev.description}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        // List view
        <div className={styles.listView}>
          {loading && <p className={styles.loadingText}>Loading…</p>}
          {!loading && listSections.length === 0 && <p className={styles.noEvents}>No events found</p>}
          {listSections.map(([date, evs]) => (
            <div key={date} className={styles.listGroup}>
              <div className={styles.listGroupHeader}>{dayjs(date).format('dddd, MMMM D, YYYY')}</div>
              {evs.map((ev) => {
                const color = categoryColorMap[ev.categoryId] ?? '#2196F3';
                return (
                  <div key={ev.id} className={styles.listEventItem} style={{ borderLeftColor: color }}>
                    <div className={styles.listEventMain}>
                      <div className={styles.listEventTop}>
                        <span className={styles.eventItemTitle}>{ev.title}</span>
                        <div className={styles.eventItemActions}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingEvent(ev);
                              setShowAddEdit(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete({ event: ev })}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </div>
                      </div>
                      {ev.time && <span className={styles.eventItemTime}>{formatTime({ timeStr: ev.time })}</span>}
                      <div className={styles.eventItemMeta}>
                        <span className={styles.catTag} style={{ backgroundColor: color + '22', color }}>
                          {ev.categoryName}
                        </span>
                        {ev.subcategoryName && <span className={styles.subCatTag}>{ev.subcategoryName}</span>}
                      </div>
                      {ev.description && <p className={styles.eventItemDesc}>{ev.description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {showAddEdit && (
        <AddEditModal
          event={editingEvent}
          defaultDate={selectedDate}
          categories={categories}
          onSave={handleSave}
          onClose={() => {
            setShowAddEdit(false);
            setEditingEvent(null);
          }}
        />
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
      {eventsConfirmElement}
    </PageContainer>
  );
}

export default Events;
