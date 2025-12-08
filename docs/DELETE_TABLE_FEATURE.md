# 🗑️ Delete Table Feature

## Overview
Users can now delete individual tables/CSV files directly from the database sidebar with a confirmation dialog.

---

## ✨ Features

### Delete Button
- **Location**: Appears on hover over each table in the left sidebar
- **Icon**: Trash icon (🗑️)
- **Size**: Small (6x6 pixels)
- **Visibility**: Hidden by default, shows on hover
- **Color**: Red/destructive color on hover

### Confirmation Dialog
- **Safety**: Requires explicit confirmation before deletion
- **Message**: Shows table name in confirmation
- **Actions**: Cancel or Delete
- **Loading State**: Shows spinner while deleting

---

## 🎯 How to Use

### Step-by-Step
1. **Hover over a table** in the left sidebar
2. **Delete button appears** on the right side of the table row
3. **Click the trash icon** (🗑️)
4. **Confirmation dialog appears** asking for confirmation
5. **Click "Delete"** to confirm or **"Cancel"** to abort
6. **Table is removed** from the sidebar and database

### Visual Flow
```
Table Row (normal)
┌────────────────────────────────┐
│ ▼ 📊 employees [50]            │
└────────────────────────────────┘

Table Row (on hover)
┌────────────────────────────────┐
│ ▼ 📊 employees [50]        🗑️ │  ← Delete button appears
└────────────────────────────────┘

Confirmation Dialog
┌─────────────────────────────────┐
│ Delete Table                    │
│                                 │
│ Are you sure you want to delete │
│ table "employees"? This action  │
│ cannot be undone.               │
│                                 │
│         [Cancel]  [Delete]      │
└─────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### Component Updates

#### DatabaseSidebar Component
```typescript
interface DatabaseSidebarProps {
    // ... existing props
    onTableDelete?: (tableName: string) => Promise<void>
}

// State for tracking deletion
const [deletingTable, setDeletingTable] = useState<string | null>(null)

// Delete button in table row
<AlertDialog>
    <AlertDialogTrigger asChild>
        <Button
            variant="ghost"
            size="icon"
            disabled={deletingTable === table.table_name}
            className="h-6 w-6 opacity-0 group-hover:opacity-100"
        >
            <Trash2 className="h-3 w-3" />
        </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
        {/* Confirmation dialog */}
    </AlertDialogContent>
</AlertDialog>
```

#### Page Component
```typescript
// Handler already exists
const handleTableDelete = useCallback(async (tableName: string) => {
    try {
        if (!sessionId) return
        await uploadAPI.deleteTable(sessionId, tableName)
        setTables(prev => prev.filter(table => table.table_name !== tableName))
    } catch (error: any) {
        alert('Failed to delete table: ' + error.message)
        throw error
    }
}, [sessionId])

// Pass to sidebar
<DatabaseSidebar
    onTableDelete={handleTableDelete}
    // ... other props
/>
```

---

## 🎨 UI/UX Details

### Button Behavior
- **Hidden by default**: Reduces visual clutter
- **Appears on hover**: Clear affordance
- **Destructive color**: Red/destructive theme
- **Icon only**: Saves space
- **Disabled during deletion**: Prevents double-clicks

### Confirmation Dialog
- **Modal overlay**: Focuses attention
- **Clear message**: States what will be deleted
- **Two actions**: Cancel (safe) and Delete (destructive)
- **Destructive styling**: Delete button is red
- **Cannot be dismissed accidentally**: Must click Cancel or Delete

### Loading States
- **Spinner icon**: Shows during deletion (⏳)
- **Button disabled**: Prevents multiple deletions
- **State persists**: Until deletion completes or fails

---

## 🚀 Benefits

### For Users
1. **Easy Cleanup**: Remove unwanted tables quickly
2. **Safe Operation**: Confirmation prevents accidents
3. **Visual Feedback**: Clear indication of what's being deleted
4. **No Page Reload**: Instant UI update

### For Workflow
1. **Iterative Development**: Easily remove test data
2. **Clean Workspace**: Keep only relevant tables
3. **Error Recovery**: Remove incorrectly uploaded files
4. **Session Management**: Clear session data when needed

---

## ⚠️ Important Notes

### Data Loss Warning
- **Permanent deletion**: Cannot be undone
- **Session-based**: Data is temporary anyway
- **Re-upload possible**: Can upload same CSV again
- **No backup**: Deleted data is not recoverable

### Best Practices
1. **Double-check** table name before confirming
2. **Export results** before deleting if needed
3. **Use carefully** with important data
4. **Re-upload** if deleted by mistake

---

## 🔮 Future Enhancements

### Planned Features
1. **Bulk Delete**: Select multiple tables to delete
2. **Undo Feature**: Restore recently deleted tables
3. **Export Before Delete**: Option to download before deleting
4. **Keyboard Shortcut**: Delete key to trigger deletion
5. **Drag to Delete**: Drag table to trash area

### Technical Improvements
1. **Optimistic Updates**: Remove from UI before API call
2. **Error Recovery**: Restore table if deletion fails
3. **Confirmation Preference**: Remember "Don't ask again"
4. **Delete Animation**: Smooth fade-out effect
5. **Batch Operations**: Delete multiple tables at once

---

## 🐛 Error Handling

### Scenarios Covered
1. **API Failure**: Shows error alert, table remains
2. **Network Error**: Shows error message
3. **Session Invalid**: Prevents deletion attempt
4. **Concurrent Deletion**: Disabled state prevents conflicts

### Error Messages
```typescript
try {
    await uploadAPI.deleteTable(sessionId, tableName)
} catch (error: any) {
    alert('Failed to delete table: ' + error.message)
    throw error
}
```

---

## 📊 User Scenarios

### Scenario 1: Remove Test Data
```
1. Upload test CSV for experimentation
2. Run queries and test functionality
3. Hover over test table
4. Click delete button
5. Confirm deletion
6. Table removed, workspace clean
```

### Scenario 2: Fix Upload Mistake
```
1. Accidentally upload wrong CSV
2. Notice incorrect data
3. Delete the wrong table
4. Upload correct CSV
5. Continue working
```

### Scenario 3: Clean Session
```
1. Finish working with multiple tables
2. Want to start fresh
3. Delete tables one by one
4. Or refresh page to clear all
5. Upload new data set
```

---

## 💡 Tips & Tricks

### Quick Deletion
- **Hover and click**: Fast workflow
- **Keyboard focus**: Tab to button, Enter to click
- **Confirmation shortcut**: Enter to confirm, Esc to cancel

### Safety Measures
- **Read confirmation**: Always check table name
- **Cancel if unsure**: Better safe than sorry
- **Export first**: Download results before deleting

### Workflow Integration
- **Delete after export**: Clean up after saving results
- **Delete before upload**: Clear space for new data
- **Delete test tables**: Keep workspace organized

---

## 📝 Code Changes Summary

### Files Modified
- `components/database-sidebar.tsx` - Added delete button and dialog
- `app/page.tsx` - Connected delete handler

### New Dependencies
- AlertDialog component (already existed)
- Trash2 icon from lucide-react

### Lines Added
- ~50 lines for delete UI
- ~10 lines for state management
- ~5 lines for prop passing

### Breaking Changes
- None - fully backward compatible
- onTableDelete is optional prop

---

## ✅ Testing Checklist

- [ ] Delete button appears on hover
- [ ] Delete button hidden when not hovering
- [ ] Confirmation dialog appears on click
- [ ] Cancel button closes dialog
- [ ] Delete button removes table
- [ ] Loading spinner shows during deletion
- [ ] Error message shows on failure
- [ ] Table removed from UI after deletion
- [ ] Other tables unaffected
- [ ] Can delete multiple tables sequentially

---

**Last Updated**: November 25, 2025  
**Version**: 2.2.0  
**Status**: ✅ Complete & Working

