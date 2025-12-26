# Material Request Tracker

A modern Material Request Tracker for construction projects built with React, TypeScript, Supabase, and AI-powered features.

## Features

- **Material Request Management**: Create, view, edit, and track material requests
- **Status Workflow**: Manage request status (pending → approved/rejected → fulfilled)
- **Multi-tenancy**: Company-based data isolation with Row Level Security
- **AI-Powered Suggestions**: Smart material name autocomplete and priority recommendations
- **Export Functionality**: Export requests to CSV or Excel
- **Real-time Updates**: Optimistic UI updates with React Query
- **Responsive Design**: Modern UI built with shadcn-ui and Tailwind CSS

## Tech Stack

- **Frontend**: React 18+ with TypeScript, Vite
- **UI Components**: shadcn-ui, Tailwind CSS
- **State Management**: React Query (@tanstack/react-query)
- **Form Management**: react-hook-form with Zod validation
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Routing**: React Router
- **AI Integration**: OpenAI API (optional, with fallback heuristics)

## Prerequisites

- Node.js 18+ or Bun
- Supabase account and project
- (Optional) OpenAI API key for AI features

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key  # Optional, for AI features
```

### 3. Database Setup

Run the migration SQL in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Execute the migration

The migration creates:

- `companies` table
- `projects` table
- `user_companies` junction table
- `material_requests` table
- Row Level Security (RLS) policies
- Indexes for performance

### 4. Initial Data Setup

After running the migration, you'll need to:

1. **Create a company**:

   ```sql
   INSERT INTO companies (name) VALUES ('Your Company Name');
   ```

2. **Create a user-company association**:

   ```sql
   -- Replace 'user-uuid' with your auth.users id
   -- Replace 'company-uuid' with the company id from step 1
   INSERT INTO user_companies (user_id, company_id, role)
   VALUES ('user-uuid', 'company-uuid', 'admin');
   ```

3. **(Optional) Create projects**:
   ```sql
   INSERT INTO projects (name, company_id)
   VALUES ('Project Name', 'company-uuid');
   ```

### 5. Run the Development Server

```bash
# Using Bun
bun run dev

# Or using npm
npm run dev
```

The application will be available at `http://localhost:5173`

## Database Schema

### Tables

**companies**

- `id` (UUID, primary key)
- `name` (text)
- `created_at` (timestamp)

**projects**

- `id` (UUID, primary key)
- `name` (text)
- `company_id` (UUID, foreign key)
- `created_at` (timestamp)

**user_companies**

- `user_id` (UUID, foreign key to auth.users)
- `company_id` (UUID, foreign key)
- `role` (text: "admin" | "member")
- Primary key: (user_id, company_id)

**material_requests**

- `id` (UUID, primary key)
- `project_id` (UUID, nullable, foreign key)
- `material_name` (text, required)
- `quantity` (numeric, required)
- `unit` (text, required)
- `status` (text: "pending" | "approved" | "rejected" | "fulfilled")
- `priority` (text: "low" | "medium" | "high" | "urgent")
- `requested_by` (UUID, foreign key to auth.users)
- `requested_at` (timestamp, default now)
- `notes` (text, optional)
- `company_id` (UUID, foreign key)

### Row Level Security (RLS)

- Users can only view material requests from their company
- Users can create requests for their company
- Admins can update any request in their company
- Members can only update their own requests

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn-ui components
│   ├── MaterialRequestTable.tsx
│   ├── MaterialRequestForm.tsx
│   ├── StatusUpdateDialog.tsx
│   └── ErrorBoundary.tsx
├── pages/
│   └── MaterialRequestsPage.tsx
├── hooks/
│   └── useMaterialRequests.ts
├── lib/
│   ├── supabase/
│   │   └── materialRequests.ts
│   ├── ai/
│   │   └── materialSuggestions.ts
│   └── export.ts
├── contexts/
│   └── CompanyContext.tsx
├── types/
│   └── database.ts
└── App.tsx
```

## Key Design Decisions

### Multi-tenancy

- Uses a junction table (`user_companies`) to support users belonging to multiple companies
- RLS policies enforce data isolation at the database level

### Optimistic Updates

- All mutations use React Query optimistic updates for instant UI feedback
- Automatic rollback on error

### AI Integration

- Material suggestions use fuzzy matching with optional OpenAI API integration
- Priority recommendations use heuristics (quantity, material type) with optional AI enhancement
- Graceful fallback when AI API is unavailable

### Form Validation

- Zod schemas ensure type safety and runtime validation
- react-hook-form handles form state and submission

### Error Handling

- ErrorBoundary catches React errors
- User-friendly error messages throughout
- Network error handling with retry logic

## AI Features

The application includes AI-powered features for enhanced user experience:

1. **Material Name Suggestions**

   - Autocomplete with fuzzy matching
   - Optional OpenAI integration for semantic search
   - Learns from past requests

2. **Priority Recommendations**
   - Heuristic-based suggestions (quantity, material type)
   - Optional AI-powered recommendations using OpenAI
   - Context-aware priority suggestions

To enable AI features, set `VITE_OPENAI_API_KEY` in your `.env` file. The app works without it using fallback heuristics.

## Usage

### Creating a Material Request

1. Click "New Request" button
2. Fill in the form:
   - Material name (with AI suggestions)
   - Quantity and unit
   - Priority (with AI recommendation)
   - Project (optional)
   - Notes (optional)
3. Click "Create Request"

### Updating Request Status

1. In the requests table, use the status dropdown
2. Select the new status
3. Confirm in the dialog

### Exporting Data

- Click "Export CSV" or "Export Excel" to download all filtered requests

## Development

### Build for Production

```bash
bun run build
```

### Preview Production Build

```bash
bun run preview
```

### Linting

```bash
bun run lint
```

## Environment Variables

| Variable                                | Description                    | Required |
| --------------------------------------- | ------------------------------ | -------- |
| `VITE_SUPABASE_URL`                     | Supabase project URL           | Yes      |
| `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase anon key              | Yes      |
| `VITE_OPENAI_API_KEY`                   | OpenAI API key for AI features | No       |

## Troubleshooting

### "No company assigned" error

- Ensure you've created a user-company association in the database
- Check that your user ID matches the one in `user_companies` table

### RLS policy errors

- Verify RLS policies are enabled
- Check that your user is associated with a company
- Ensure you're using the correct Supabase keys

### AI features not working

- Check that `VITE_OPENAI_API_KEY` is set (optional)
- The app will use fallback heuristics if AI is unavailable

## License

This project is a take-home assignment submission.
