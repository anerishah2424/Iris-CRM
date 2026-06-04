# Project Iris - Comprehensive Technical Context

This document is a highly detailed, comprehensive guide to Project Iris. It covers system architecture, data models, API endpoints, role permissions, and a granular breakdown of every page and the technical operations triggered by user interactions. This document is designed to provide a complete understanding of the application from scratch.

---

## 1. System Architecture & Tech Stack

Project Iris is built on a distributed, multi-service architecture designed to handle data analysis, enterprise account management, and AI orchestration.

### 1.1 Core Components

#### 1.1.1 Frontend (`iris-frontend`)
- **Technology**: React 18, TypeScript, Vite (build tool), TailwindCSS (styling), Lucide React (icons), Framer Motion (animations), React Router (routing), React Query (data fetching).
- **Role**: Serves as the user interface. It is a Single Page Application (SPA) that manages its own state and communicates with backend services via HTTP requests.
- **Design Philosophy**: High aesthetics, dark modes, glassmorphism, and dynamic animations to provide a premium user experience.

#### 1.1.2 Backend (`iris-backend`)
- **Technology**: Python 3.x, Flask (web framework), SQLAlchemy (ORM), Flask-JWT-Extended (authentication), Pandas & NumPy (data processing), SentenceTransformers (NLP).
- **Role**: Handles core business logic, database management, authentication, and heavy data processing tasks like text clustering.
- **Database**: SQLite for development (`iris_dev.db`), with configurations available for PostgreSQL in production.

#### 1.1.3 Agent Server (`agent_server`)
- **Technology**: Python, Flask, Google Generative AI (Gemini SDK), Node.js (`render.js`).
- **Role**: Operates on port 5001 to isolate AI agent workloads from the core backend. It handles automated proposal generation and company-specific market research.

---

## 2. Roles & Permissions (Access Control)

The system enforces Role-Based Access Control (RBAC) via JWT claims and backend middleware to ensure data security and scoping.

### 2.1 Matrix Manager (Admin)
- **Scope**: Global access across all geographical zones.
- **Capabilities**:
  - Can view and manage accounts in all zones.
  - Can perform destructive actions like deleting accounts (soft delete).
  - Access to dedicated Admin panels (User Management, Zone Management, Release Management).
  - Can view aggregate data for the entire organization.

### 2.2 Sales Manager (Standard User)
- **Scope**: Restricted to a specific assigned `zone_id`.
- **Capabilities**:
  - Can only view and manage accounts within their assigned zone.
  - Can create and update accounts.
  - Cannot delete accounts (backend checks role and returns 403 Forbidden).
  - Dashboard metrics are scoped to show only data relevant to their zone.

---

## 3. Page-by-Page Breakdown & Click Flows

This section describes every page in the application, what can be seen, and the exact technical process triggered by user actions (clicks).

### 3.1 Login Page (`/login`)
- **What can be seen**: A clean, centered login card with the Project Iris logo, input fields for username/email and password, a "Remember Me" checkbox, and a "Login" button.
- **Functionality**:
  - **Action**: User enters credentials and clicks "Login".
  - **Frontend Process**: Validates that fields are not empty. Sends a `POST` request to `/api/auth/login` with JSON body `{username, password}`.
  - **Backend Process**: Queries the `users` table. Verifies the password using `bcrypt.check_password_hash()`. If valid, generates Access and Refresh JWT tokens containing the user's role and zone.
  - **Resolution**: Frontend stores the tokens in the application state (managed by `useAuthStore`) and redirects to the dashboard.

### 3.2 Dashboard (`/dashboard`)
- **What can be seen**: 
  - **9 KPI Cards**: Showing Total Accounts, Critical Clients, At-Risk Clients, Open Tickets, Renewals Due 30d, Avg Health Score, Upsell Opportunities, Release Matches, and a PRISM shortcut.
  - **Accounts Needing Attention Table**: A table showing accounts with Critical or At-Risk status, featuring a health ring and status badge.
  - **Intelligence Feed**: Split into Critical Alerts (event-driven) and Recent Interactions (logs).
- **Functionality**:
  - **Action**: User clicks a KPI Card (e.g., "Critical Clients").
  - **Frontend Process**: Navigates to `/accounts?health_status=Critical`, passing the filter in the URL.
  - **Action**: User clicks the "Refresh" button in the header.
  - **Frontend Process**: Triggers a refetch of all active React Query hooks for the dashboard, causing the UI to show loading skeletons and then update with fresh data.

### 3.3 Accounts Page (`/accounts`)
- **What can be seen**: 
  - A filter bar with search input and dropdowns for Health Status, Industry, Zone (for admins), and State.
  - A table listing accounts with columns for name, industry, zone, health score (visual ring), status, VAD Company, Sales Manager, and SI Partner.
  - "Export CSV" and "Add Account" buttons.
- **Functionality**:
  - **Action**: User types in the search bar.
  - **Frontend Process**: Debounces the input (300ms delay) and updates the URL search params. This triggers a refetch of the accounts list with the search query.
  - **Action**: User clicks "Delete" on an account row.
  - **Frontend Process**: Shows a native confirmation dialog. If confirmed, sends a `DELETE` request to `/api/accounts/<id>`.
  - **Backend Process**: Checks if the user is a `matrix_manager`. If so, updates the account record's status to deleted (soft delete) in the DB.

### 3.4 Account Detail Page (`/accounts/:id`)
- **What can be seen**: 
  - **Header**: Account name, status badge, and health score ring.
  - **Tabs**: Overview, Products, Tickets, Renewals, and Visits.
  - **Action Buttons**: Edit Account, Generate Proposal, and Latest Info.
- **Functionality**:
  - **Action**: User clicks "Latest Info".
  - **Frontend Process**: Calls `/latest_info` on the Agent Server (Port 5001).
  - **Backend Process**: Invokes `market_research_agent.py` to fetch external intelligence via Gemini API and returns structured JSON.
  - **Resolution**: Frontend displays a modal with recent news, risks, and talking points.

### 3.5 PRISM Prioritization Page (`/prism/prioritization`)
- **What can be seen**: 
  - **Upload State**: A drag-and-drop area for Excel files and a cluster sensitivity slider.
  - **Analysis State**: A table listing discovered topics with counts. Rows are expandable to show raw quotes.
  - **Ledger Sidebar**: A list of selected items for ranking, with sliders for Revenue and Effort.
  - **Results State**: A ranked table with calculated scores (Demand, Impact, etc.) and recommendations.
- **Functionality**:
  - **Action**: User uploads files and clicks "Run Intelligence Analysis".
  - **Backend Process**: Reads files with Pandas. Infers columns. Generates embeddings with SentenceTransformers. Clusters vectors. Saves session as a pickle file.
  - **Action**: User clicks "Run Prioritization".
  - **Backend Process**: Loads session. Calculates metrics. Applies weighted formula. Returns ranked list.

### 3.6 PRISM Market Research Page (`/prism/market-research`)
- **What can be seen**: 
  - A loading sequence showing simulated steps (e.g., "Analyzing Industry Trends...").
  - A large report table generated from AI analysis with links to sources.
  - An expandable section showing the raw response stream in a code block.
- **Functionality**:
  - **Action**: Page loads with tasks passed from the prioritization page.
  - **Frontend Process**: Automatically calls `/api/market-research` with the tasks.
  - **Backend Process**: Sends a detailed prompt to the Perplexity API asking for market data on the specific features. Returns a markdown response.

### 3.7 Renewals Page (`/renewals`)
- **What can be seen**: A list of upcoming license, AMC, and warranty renewals with days remaining and status badges.
- **Functionality**:
  - **Action**: User filters by date range or renewal type.
  - **Backend Process**: Queries the `renewals` table for records matching the filters and date constraints.

### 3.8 Tickets Page (`/tickets`)
- **What can be seen**: Support tickets categorized by status and priority, displayed in a grid or list view.
- **Functionality**:
  - **Action**: User clicks a ticket to update its status.
  - **Frontend Process**: Sends a `PATCH` request to `/api/tickets/<id>` with the new status.
  - **Backend Process**: Updates the record and logs the activity for the dashboard feed.

### 3.9 Releases Page (`/releases`)
- **What can be seen**: A list of software releases and the accounts they match based on installed versions.
- **Functionality**:
  - **Action**: User clicks "Match" to see which accounts need the update.
  - **Backend Process**: Compares `installed_version` in `InstalledProduct` with the new release version.

### 3.10 Admin: User Management (`/admin/users`)
- **What can be seen**: A list of system users, their roles, and zones. Only accessible to `matrix_manager`.
- **Functionality**:
  - **Action**: Admin creates a new user.
  - **Backend Process**: Hashes the password using Bcrypt and saves the record in the `users` table.

---

## 4. Detailed Data Models

In this section, we break down the core data models used in the system, explaining the purpose of each field and its data type.

### 4.1 Account Model (`Account`)
Represents a client or prospect company.
- `account_id` (Integer, Primary Key): Unique identifier for the account.
- `account_name` (String, Required): The name of the company.
- `industry` (String): The primary industry sector (e.g., Banking, Healthcare).
- `sub_industry` (String): More specific sub-sector.
- `city` (String): City location.
- `state` (String): State location (mapped to zones).
- `zone_id` (Integer, Foreign Key): Links to the `Zone` model.
- `si_id` (Integer, Foreign Key): Links to the `SIPartner` model (System Integrator).
- `sales_manager_id` (Integer, Foreign Key): Links to the `User` model who manages this account.
- `account_type` (String): Either 'existing' or 'prospect'.
- `health_score` (Integer): A calculated score from 0 to 100 indicating account health.
- `health_status` (String): Derived from score ('Healthy', 'At-Risk', 'Critical').
- `vad_company` (String): Value Added Distributor company name.
- `created_at` (DateTime): Timestamp of creation.
- `updated_at` (DateTime): Timestamp of last update.

### 4.2 User Model (`User`)
Represents a user of the Project Iris system.
- `user_id` (Integer, Primary Key): Unique identifier.
- `username` (String, Unique, Required): Login username.
- `email` (String, Unique, Required): Login email.
- `password_hash` (String, Required): Bcrypt hash of the password.
- `full_name` (String): User's display name.
- `role` (String): 'matrix_manager' or 'Sales_manager'.
- `zone_id` (Integer, Foreign Key): The zone this user is assigned to (nullable for admins).
- `is_active` (Boolean): Flag to enable/disable account.
- `last_login` (DateTime): Timestamp of last successful login.

### 4.3 Ticket Model (`Ticket`)
Represents support tickets raised by or for accounts.
- `ticket_id` (Integer, Primary Key): Unique identifier.
- `account_id` (Integer, Foreign Key): The account associated with the ticket.
- `title` (String, Required): Summary of the issue.
- `description` (Text): Detailed description.
- `priority` (String): 'Low', 'Medium', 'High', 'Critical'.
- `status` (String): 'Open', 'In Progress', 'Resolved', 'Closed'.
- `created_at` (DateTime): Timestamp of creation.
- `updated_at` (DateTime): Timestamp of last update.

### 4.4 Product Model (`Product`)
The catalog of products available or installed.
- `product_id` (Integer, Primary Key): Unique identifier.
- `sap_code` (String, Unique): SAP system code.
- `product_name` (String, Required): Name of the product.
- `domain` (String): Product domain (e.g., Telecom, Security).
- `status` (String): 'Active', 'EOL' (End of Life).

### 4.5 Renewal Model (`Renewal`)
Tracks maintenance, license, and warranty renewals.
- `renewal_id` (Integer, Primary Key): Unique identifier.
- `account_id` (Integer, Foreign Key): The account associated.
- `renewal_type` (String): 'License', 'AMC', 'Warranty'.
- `expiry_date` (Date): Date of expiry.
- `renewal_status` (String): 'Upcoming', 'Due Soon', 'Overdue', 'Renewed'.

### 4.6 Release Model (`Release`)
Tracks software releases for products.
- `release_id` (Integer, Primary Key): Unique identifier.
- `version` (String): Version number.
- `release_date` (Date): Date of release.
- `description` (Text): Release notes.

---

## 5. API Reference with Payloads

### 5.1 Authentication

#### `POST /api/auth/login`
- **Description**: Authenticates a user and returns tokens.
- **Request Body**:
  ```json
  {
    "username": "user1",
    "password": "password123"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "access_token": "eyJhbGci...",
    "refresh_token": "eyJhbGci...",
    "user": {
      "user_id": 1,
      "username": "user1",
      "role": "Sales_manager",
      "zone_id": 2
    }
  }
  ```

### 5.2 PRISM Operations

#### `POST /api/analyze`
- **Description**: Processes feedback files and returns clusters.
- **Request**: Multipart/Form-Data
  - `files`: File objects (Excel).
  - `min_size`: Integer (Cluster sensitivity).
- **Response** (200 OK):
  ```json
  {
    "session_id": "uuid-string",
    "chart_data": [
      {
        "task": "Mobile App Crash",
        "count": 15,
        "cluster_id": 1,
        "sub_queries": [
          {"feedback_raw": "The app crashes on login", "count": 1}
        ]
      }
    ]
  }
  ```

#### `POST /api/prioritize`
- **Description**: Calculates priority scores for selected items.
- **Request Body**:
  ```json
  {
    "selected_items": [
      {
        "feedback_raw": "The app crashes on login",
        "task": "Mobile App Crash",
        "cluster_id": 1
      }
    ],
    "manual_inputs": {
      "task_0": {"revenue": 0.8, "effort": 0.3}
    },
    "session_id": "uuid-string"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "prioritized_tasks": [
      {
        "task": "Mobile App Crash",
        "priority_score": 0.85,
        "Demand": 0.9,
        "Impact": 0.8,
        "Confidence": 0.7,
        "Urgency": 0.6,
        "Effort": "Low",
        "Revenue": 0.8
      }
    ]
  }
  ```

---

## 6. Tech Stack Deep Dive

### 6.1 Frontend Libraries
- **React Query**: Used for fetching, caching, and updating asynchronous state. It handles background refetching and provides hooks like `useQuery` and `useMutation`.
- **Framer Motion**: Enables smooth animations for page transitions and interactive elements like cards and progress bars.
- **Lucide React**: A clean icon library used across the interface for consistency.

### 6.2 Backend Libraries
- **SentenceTransformers**: Specifically the `all-MiniLM-L6-v2` model is used to generate embeddings. It is lightweight and fast, making it ideal for real-time clustering on CPU.
- **Pandas**: Used for efficient tabular data manipulation, especially when reading and joining data from multiple uploaded Excel files.
