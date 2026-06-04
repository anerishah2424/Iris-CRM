# To-Do List Feature

## Overview
Users can now select subtopics from cluster analysis results and create their own custom to-do list. This gives users the flexibility to prioritize which feedback items they want to address.

## Features Implemented

### 1. **Individual Item Selection**
- Each subtopic in the expanded cluster view now has a checkbox
- Click on any subtopic row to select/deselect it
- Selected items are highlighted with an indigo background
- Visual feedback with CheckSquare/Square icons

### 2. **Select All Button**
- Each cluster has a "Select All" button in the expanded view
- Clicking it selects all subtopics from that cluster
- If all items are already selected, it changes to "Deselect All"
- Button text and icon change dynamically based on selection state

### 3. **To-Do List Panel**
- Located on the right side of the screen (responsive layout)
- Shows all selected items grouped by task/topic
- Each item displays:
  - Task category (topic name)
  - Feedback text
  - Number of occurrences
  
### 4. **To-Do List Management**
- **Remove Individual Items**: Hover over any item to reveal a delete button
- **Clear All**: Button at the top of the panel to clear all selected items
- **Item Counter**: Shows total number of items in the to-do list
- **Empty State**: Clean placeholder when no items are selected

### 5. **Visual Design**
- Premium gradient background for the to-do list panel
- Smooth animations when adding/removing items
- Custom scrollbar for long lists
- Responsive grid layout (stacks on smaller screens)

## How to Use

1. **Upload and Analyze** files as usual
2. **Expand a cluster** by clicking on any topic row
3. **Select items**:
   - Click individual subtopic rows to select them, OR
   - Click "Select All" to select all subtopics in that cluster
4. **View your to-do list** in the right panel
5. **Manage items**:
   - Remove individual items by hovering and clicking the trash icon
   - Clear all items with the "Clear All" button

## Technical Implementation

### State Management
- `selectedItems`: Array storing all selected subtopic items
- Each item contains: `feedback_raw`, `task`, `cluster_id`, `count`

### Key Functions
- `toggleSelectItem(item)`: Toggle individual item selection
- `isItemSelected(item)`: Check if an item is selected
- `selectAllFromCluster(clusterData)`: Select/deselect all items in a cluster
- `removeFromTodo(item)`: Remove item from to-do list
- `clearAllTodos()`: Clear all selected items

### UI Components
- Checkboxes with icons from lucide-react: `Square`, `CheckSquare`
- To-do list with `ListTodo` icon
- Delete actions with `Trash2` icon
- Framer Motion animations for smooth transitions

## Responsive Design
- Desktop (XL): Topics table (7 columns) + To-do list (5 columns) side-by-side
- Tablet/Mobile: Stacks vertically for better mobile experience
