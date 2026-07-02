import React, { ReactElement, useEffect, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteConfirmationModal from 'components/DeleteConfirmationModal/DeleteConfirmationModal';
import EmptyState from 'components/EmptyState/EmptyState';
import LoadingSpinner from 'components/LoadingSpinner/LoadingSpinner';
import PageContainer from 'components/PageContainer/PageContainer';
import usePeople, { PersonCategory, PersonIdea, TrackedPerson } from 'hooks/usePeople.hook';
import styles from './People.module.scss';

const ALL_PAGES = ['irrigation', 'people', 'todo', 'events', 'devices', 'admin'] as const;

type IdeaFormState = { title: string; notes: string; categoryId: number | ''; subcategoryId: number | '' };
const emptyIdeaForm: IdeaFormState = { title: '', notes: '', categoryId: '', subcategoryId: '' };

function People(): ReactElement {
  const {
    people, categories, ideas, loading,
    fetchPeople, addPerson, deletePerson,
    fetchCategories, fetchIdeas, clearPerson,
    createCategory, createSubcategory, updateCategory,
    updateSubcategory, deleteSubcategory, deleteCategory,
    createIdea, updateIdea, deleteIdea,
  } = usePeople();

  const [selectedPersonId, setSelectedPersonId] = useState<number | undefined>();
  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>();
  const [activeSubcategoryId, setActiveSubcategoryId] = useState<number | undefined>();

  // Add person dialog
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');

  // Delete person
  const [personToDelete, setPersonToDelete] = useState<TrackedPerson | undefined>();

  // Idea dialog
  const [showIdeaDialog, setShowIdeaDialog] = useState(false);
  const [editingIdea, setEditingIdea] = useState<PersonIdea | undefined>();
  const [ideaForm, setIdeaForm] = useState<IdeaFormState>(emptyIdeaForm);

  // Delete idea
  const [ideaToDelete, setIdeaToDelete] = useState<PersonIdea | undefined>();

  // Manage categories dialog
  const [showManage, setShowManage] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | undefined>();

  useEffect(() => {
    fetchPeople();
  }, []);

  useEffect(() => {
    if (selectedPersonId !== undefined) {
      fetchCategories(selectedPersonId);
      fetchIdeas(selectedPersonId);
      setActiveCategoryId(undefined);
      setActiveSubcategoryId(undefined);
    } else {
      clearPerson();
    }
  }, [selectedPersonId]);

  const selectedPerson = people.find((p) => p.id === selectedPersonId) ?? null;
  const subcategories = categories.find((c) => c.id === activeCategoryId)?.subcategories ?? [];

  const handleSelectPerson = (person: TrackedPerson): void => {
    setSelectedPersonId((prev) => (prev === person.id ? undefined : person.id));
  };

  const handleAddPerson = async (): Promise<void> => {
    if (!newPersonName.trim()) return;
    await addPerson(newPersonName.trim());
    setNewPersonName('');
    setShowAddPerson(false);
  };

  const handleDeletePerson = async (): Promise<void> => {
    if (!personToDelete) return;
    await deletePerson(personToDelete.id);
    if (selectedPersonId === personToDelete.id) setSelectedPersonId(undefined);
    setPersonToDelete(undefined);
  };

  const handleSelectCategory = (id: number): void => {
    const next = activeCategoryId === id ? undefined : id;
    setActiveCategoryId(next);
    setActiveSubcategoryId(undefined);
    if (selectedPersonId !== undefined) fetchIdeas(selectedPersonId, next);
  };

  const handleSelectSubcategory = (id: number): void => {
    const next = activeSubcategoryId === id ? undefined : id;
    setActiveSubcategoryId(next);
    if (selectedPersonId !== undefined) fetchIdeas(selectedPersonId, activeCategoryId, next);
  };

  const clearFilter = (): void => {
    setActiveCategoryId(undefined);
    setActiveSubcategoryId(undefined);
    if (selectedPersonId !== undefined) fetchIdeas(selectedPersonId);
  };

  const openAddIdea = (): void => {
    setEditingIdea(undefined);
    setIdeaForm(emptyIdeaForm);
    setShowIdeaDialog(true);
  };

  const openEditIdea = (idea: PersonIdea): void => {
    setEditingIdea(idea);
    setIdeaForm({
      title: idea.title,
      notes: idea.notes ?? '',
      categoryId: idea.categoryId,
      subcategoryId: idea.subcategoryId ?? '',
    });
    setShowIdeaDialog(true);
  };

  const handleSaveIdea = async (): Promise<void> => {
    if (!selectedPersonId || !ideaForm.title.trim() || ideaForm.categoryId === '') return;
    const data = {
      title: ideaForm.title.trim(),
      notes: ideaForm.notes.trim() || undefined,
      categoryId: ideaForm.categoryId as number,
      subcategoryId: ideaForm.subcategoryId !== '' ? (ideaForm.subcategoryId as number) : undefined,
    };
    if (editingIdea) {
      await updateIdea(selectedPersonId, editingIdea.id, data);
      fetchIdeas(selectedPersonId, activeCategoryId, activeSubcategoryId);
    } else {
      await createIdea(selectedPersonId, data);
      fetchIdeas(selectedPersonId, activeCategoryId, activeSubcategoryId);
    }
    setShowIdeaDialog(false);
  };

  const handleDeleteIdea = async (): Promise<void> => {
    if (!ideaToDelete || !selectedPersonId) return;
    await deleteIdea(selectedPersonId, ideaToDelete.id);
    setIdeaToDelete(undefined);
  };

  const handleAddCategory = async (): Promise<void> => {
    if (!newCategoryName.trim() || !selectedPersonId) return;
    await createCategory(selectedPersonId, newCategoryName.trim(), []);
    setNewCategoryName('');
  };

  const handleAddSubcategory = async (categoryId: number): Promise<void> => {
    if (!newSubcategoryName.trim() || !selectedPersonId) return;
    await createSubcategory(selectedPersonId, categoryId, newSubcategoryName.trim());
    setNewSubcategoryName('');
  };

  const currentSubcategories = ideaForm.categoryId !== ''
    ? (categories.find((c) => c.id === ideaForm.categoryId)?.subcategories ?? [])
    : [];

  return (
    <PageContainer>
      {/* Person selector */}
      <div className={styles.personBar}>
        {people.map((person) => (
          <div key={person.id} className={styles.personChipWrap}>
            <button
              type="button"
              className={`${styles.personChip} ${selectedPersonId === person.id ? styles.personChipActive : ''}`}
              onClick={() => handleSelectPerson(person)}
            >
              {person.name}
            </button>
            <Tooltip title={`Remove ${person.name}`}>
              <IconButton size="small" className={styles.personDeleteBtn} onClick={() => setPersonToDelete(person)}>
                <DeleteIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </div>
        ))}
        <button type="button" className={styles.addPersonChip} onClick={() => setShowAddPerson(true)}>
          <AddIcon fontSize="small" />
          Add person
        </button>
      </div>

      {selectedPerson === null ? (
        <EmptyState icon={PeopleIcon} title="Select a person" subtitle="Choose someone above or add a new person" />
      ) : (
        <>
          {/* Category filter */}
          {categories.length > 0 && (
            <div className={styles.filterBar}>
              <div className={styles.filterRow}>
                <button
                  type="button"
                  className={`${styles.filterChip} ${!activeCategoryId ? styles.filterChipActive : ''}`}
                  onClick={clearFilter}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`${styles.filterChip} ${activeCategoryId === cat.id ? styles.filterChipActive : ''}`}
                    onClick={() => handleSelectCategory(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              {subcategories.length > 0 && (
                <div className={`${styles.filterRow} ${styles.filterRowBorder}`}>
                  <button
                    type="button"
                    className={`${styles.filterChip} ${!activeSubcategoryId ? styles.filterChipActive : ''}`}
                    onClick={() => { setActiveSubcategoryId(undefined); if (selectedPersonId !== undefined) fetchIdeas(selectedPersonId, activeCategoryId); }}
                  >
                    All
                  </button>
                  {subcategories.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      className={`${styles.filterChip} ${activeSubcategoryId === sub.id ? styles.filterChipActive : ''}`}
                      onClick={() => handleSelectSubcategory(sub.id)}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ideas list */}
          {loading ? (
            <LoadingSpinner />
          ) : ideas.length === 0 ? (
            <EmptyState icon={PeopleIcon} title="No ideas yet" subtitle="Add one below" />
          ) : (
            <div className={styles.list}>
              {ideas.map((idea) => (
                <div key={idea.id} className={styles.card}>
                  <div className={styles.cardMain}>
                    <p className={styles.ideaTitle}>{idea.title}</p>
                    <div className={styles.badgeRow}>
                      <span className={styles.badge}>{idea.categoryName}</span>
                      {idea.subcategoryName && <span className={`${styles.badge} ${styles.badgeSub}`}>{idea.subcategoryName}</span>}
                    </div>
                    {idea.notes && <p className={styles.ideaNotes}>{idea.notes}</p>}
                  </div>
                  <div className={styles.cardActions}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEditIdea(idea)}>
                        <EditIcon fontSize="small" className={styles.editIcon} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => setIdeaToDelete(idea)}>
                        <DeleteIcon fontSize="small" className={styles.deleteIcon} />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action row */}
          <div className={styles.actionRow}>
            <button type="button" className={styles.addBtn} onClick={openAddIdea}>
              <AddIcon className={styles.addIcon} />
              Add Idea
            </button>
            <Tooltip title="Manage categories">
              <button type="button" className={styles.manageBtn} onClick={() => setShowManage(true)}>
                <SettingsIcon className={styles.manageIcon} />
              </button>
            </Tooltip>
          </div>
        </>
      )}

      {/* Add person dialog */}
      <Dialog open={showAddPerson} onClose={() => setShowAddPerson(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add Person</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Name"
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddPerson(); }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <button type="button" className={styles.dialogCancel} onClick={() => setShowAddPerson(false)}>Cancel</button>
          <button type="button" className={styles.dialogSave} onClick={handleAddPerson}>Add</button>
        </DialogActions>
      </Dialog>

      {/* Add/edit idea dialog */}
      <Dialog open={showIdeaDialog} onClose={() => setShowIdeaDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingIdea ? 'Edit Idea' : 'Add Idea'}</DialogTitle>
        <DialogContent className={styles.dialogForm}>
          <TextField
            autoFocus
            fullWidth
            label="Title"
            value={ideaForm.title}
            onChange={(e) => setIdeaForm((f) => ({ ...f, title: e.target.value }))}
            sx={{ mt: 1 }}
          />
          <Select
            fullWidth
            displayEmpty
            value={ideaForm.categoryId}
            onChange={(e) => setIdeaForm((f) => ({ ...f, categoryId: e.target.value as number | '', subcategoryId: '' }))}
            sx={{ mt: 2 }}
          >
            <MenuItem value="" disabled>Select category</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
            ))}
          </Select>
          {currentSubcategories.length > 0 && (
            <Select
              fullWidth
              displayEmpty
              value={ideaForm.subcategoryId}
              onChange={(e) => setIdeaForm((f) => ({ ...f, subcategoryId: e.target.value as number | '' }))}
              sx={{ mt: 2 }}
            >
              <MenuItem value="">No subcategory</MenuItem>
              {currentSubcategories.map((sub) => (
                <MenuItem key={sub.id} value={sub.id}>{sub.name}</MenuItem>
              ))}
            </Select>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (optional)"
            value={ideaForm.notes}
            onChange={(e) => setIdeaForm((f) => ({ ...f, notes: e.target.value }))}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <button type="button" className={styles.dialogCancel} onClick={() => setShowIdeaDialog(false)}>Cancel</button>
          <button type="button" className={styles.dialogSave} onClick={handleSaveIdea}>Save</button>
        </DialogActions>
      </Dialog>

      {/* Manage categories dialog */}
      <Dialog open={showManage} onClose={() => setShowManage(false)} fullWidth maxWidth="sm">
        <DialogTitle>Manage Categories</DialogTitle>
        <DialogContent>
          <div className={styles.manageList}>
            {categories.map((cat) => (
              <div key={cat.id} className={styles.manageCategory}>
                <div className={styles.manageCategoryHeader}>
                  <span className={styles.manageCategoryName}>{cat.name}</span>
                  <IconButton
                    size="small"
                    onClick={() => setExpandedCategoryId((prev) => (prev === cat.id ? undefined : cat.id))}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => selectedPersonId && deleteCategory(selectedPersonId, cat.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </div>
                {cat.subcategories.map((sub) => (
                  <div key={sub.id} className={styles.manageSubcategory}>
                    <span>{sub.name}</span>
                    <IconButton size="small" onClick={() => selectedPersonId && deleteSubcategory(selectedPersonId, sub.id)}>
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  </div>
                ))}
                {expandedCategoryId === cat.id && (
                  <div className={styles.manageAddSub}>
                    <TextField
                      size="small"
                      placeholder="Subcategory name"
                      value={newSubcategoryName}
                      onChange={(e) => setNewSubcategoryName(e.target.value)}
                    />
                    <button type="button" className={styles.dialogSave} onClick={() => handleAddSubcategory(cat.id)}>Add</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className={styles.manageAddCategory}>
            <TextField
              size="small"
              fullWidth
              placeholder="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <button type="button" className={styles.dialogSave} onClick={handleAddCategory}>Add</button>
          </div>
        </DialogContent>
        <DialogActions>
          <button type="button" className={styles.dialogSave} onClick={() => setShowManage(false)}>Done</button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmationModal
        open={!!personToDelete}
        title="Remove Person"
        message={`Remove "${personToDelete?.name}" and all their data? This cannot be undone.`}
        onCancel={() => setPersonToDelete(undefined)}
        onConfirm={handleDeletePerson}
      />
      <DeleteConfirmationModal
        open={!!ideaToDelete}
        title="Delete Idea"
        message={`Delete "${ideaToDelete?.title}"?`}
        onCancel={() => setIdeaToDelete(undefined)}
        onConfirm={handleDeleteIdea}
      />
    </PageContainer>
  );
}

export default People;
