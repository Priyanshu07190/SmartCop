# 🚔 SmartCop - Intelligent Police Management System

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-teal.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)

> A modern, intelligent police management system built with React, TypeScript, and Supabase. Streamline FIR management, evidence handling, and police operations with a beautiful, responsive interface.

## ✨ Features

- 📝 **FIR Management** - Create, edit, and manage First Information Reports
- 🔍 **Evidence Handling** - Upload and manage digital evidence with secure storage
- 🌐 **Multi-language Support** - Integrated with Bhashini for language translation
- 👮 **Officer Dashboard** - Comprehensive dashboard for police officers
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- 🔐 **Secure Authentication** - Role-based access control with Supabase Auth
- ☁️ **Cloud Storage** - Secure file uploads with Supabase Storage
- 🎨 **Modern UI** - Clean, intuitive interface built with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe JavaScript for better development experience
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **React Router** - Client-side routing for single-page application

### Backend & Services
- **Supabase** - Backend-as-a-Service for authentication, database, and storage
- **PostgreSQL** - Robust relational database (via Supabase)
- **Supabase Storage** - Secure file storage for evidence and documents
- **Bhashini API** - Government translation service for multi-language support

### Development Tools
- **ESLint** - Code linting for consistent code quality
- **PostCSS** - CSS processing and optimization
- **VS Code** - Recommended development environment

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 16 or higher)
  ```bash
  # Check your Node.js version
  node --version
  ```
  
- **npm** or **yarn** package manager
  ```bash
  # Check npm version
  npm --version
  
  # Or check yarn version
  yarn --version
  ```

- **Git** for version control
  ```bash
  # Check Git version
  git --version
  ```

## 🚀 Quick Start

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/Priyanshu07190/SmartCop.git

# Navigate to the project directory
cd SmartCop
```

### 2. Install Dependencies

```bash
# Navigate to the project folder
cd project

# Using npm
npm install

# Or using yarn
yarn install
```

### 3. Environment Setup

Create a `.env` file in the project directory and add your configuration:

```bash
# Copy the example environment file
cp .env.example .env
```

Add the following environment variables to your `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Bhashini API (Optional - for translation features)
VITE_BHASHINI_API_KEY=your_bhashini_api_key
VITE_BHASHINI_USER_ID=your_bhashini_user_id

# Application Configuration
VITE_APP_NAME=SmartCop
VITE_APP_VERSION=1.0.0
```

### 4. Supabase Setup

#### 4.1 Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and create a free account
2. Click "New Project" and fill in the details:
   - **Name**: SmartCop
   - **Database Password**: Choose a strong password
   - **Region**: Select the closest region to your users

#### 4.2 Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the **Project URL** and **anon/public** key
3. Add them to your `.env` file

#### 4.3 Set Up Database Tables

Run the following SQL commands in the Supabase SQL Editor:

```sql
-- Create FIR table
CREATE TABLE firs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fir_number VARCHAR UNIQUE NOT NULL,
  complainant_name VARCHAR NOT NULL,
  complainant_phone VARCHAR,
  incident_date TIMESTAMPTZ NOT NULL,
  incident_location TEXT NOT NULL,
  incident_description TEXT NOT NULL,
  officer_id UUID REFERENCES auth.users(id),
  status VARCHAR DEFAULT 'open' CHECK (status IN ('open', 'under_investigation', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Evidence table
CREATE TABLE evidence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fir_id UUID REFERENCES firs(id) ON DELETE CASCADE,
  file_path VARCHAR NOT NULL,
  file_url VARCHAR NOT NULL,
  file_name VARCHAR NOT NULL,
  file_type VARCHAR NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Officers table
CREATE TABLE officers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  badge_number VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  rank VARCHAR NOT NULL,
  station VARCHAR NOT NULL,
  phone VARCHAR,
  email VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4.4 Set Up Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket named `evidence`
3. Set the bucket to **Private** for security
4. Add the following RLS policy for the bucket:

```sql
-- Allow authenticated users to upload evidence
CREATE POLICY "Users can upload evidence" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'evidence' AND 
    auth.role() = 'authenticated'
  );

-- Allow users to view their own evidence
CREATE POLICY "Users can view own evidence" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'evidence' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

#### 4.5 Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE firs ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Officers can manage FIRs" ON firs
  FOR ALL USING (auth.uid() = officer_id);

CREATE POLICY "Officers can manage evidence" ON evidence
  FOR ALL USING (auth.uid() = uploaded_by);

CREATE POLICY "Officers can view their profile" ON officers
  FOR ALL USING (auth.uid() = user_id);
```

### 5. Run the Application

```bash
# Navigate to project folder (if not already there)
cd project

# Start the development server
npm run dev

# Or using yarn
yarn dev
```

The application will start at `http://localhost:5173`

### 6. Build for Production

```bash
# Create a production build
npm run build

# Preview the production build locally
npm run preview
```

## 📁 Project Structure

```
smartcop/
├── 📄 README.md                # Project documentation
├── 📁 project/                 # Main application code
│   ├── 📁 public/              # Static assets
│   │   ├── image.png
│   │   └── ...
│   ├── 📁 src/                 # Source code
│   │   ├── 📁 components/      # React components
│   │   │   ├── AuthPage.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── EvidenceManager.tsx
│   │   │   ├── FIRDrafting.tsx
│   │   │   ├── LegalChatbot.tsx
│   │   │   ├── PredictivePolicing.tsx
│   │   │   ├── SettingsPanel.tsx
│   │   │   ├── Timeline.tsx
│   │   │   └── TranscriptionView.tsx
│   │   ├── 📁 services/        # API services
│   │   │   ├── bhashiniService.ts
│   │   │   ├── openRouterService.ts
│   │   │   ├── pdfService.ts
│   │   │   └── supabaseService.ts
│   │   ├── 📁 types/           # TypeScript type definitions
│   │   │   └── speech.d.ts
│   │   ├── 📁 utils/           # Utility functions
│   │   │   └── activityLogger.ts
│   │   ├── App.tsx             # Main App component
│   │   ├── main.tsx            # Application entry point
│   │   ├── index.css           # Global styles
│   │   └── vite-env.d.ts       # Vite environment types
│   ├── 📄 package.json         # Dependencies and scripts
│   ├── 📄 tsconfig.json        # TypeScript configuration
│   ├── 📄 vite.config.ts       # Vite configuration
│   ├── 📄 tailwind.config.js   # Tailwind CSS configuration
│   ├── 📄 postcss.config.js    # PostCSS configuration
│   └── 📄 eslint.config.js     # ESLint configuration
└── 📁 supabase/               # Database migrations
    └── 📁 migrations/
        ├── 20250727183459_teal_cave.sql
        └── 20250727221423_azure_fire.sql
```

## 🔧 Configuration

### Tailwind CSS Configuration

The project uses Tailwind CSS for styling. Configuration can be found in `project/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    },
  },
  plugins: [],
}
```

### Vite Configuration

Build tool configuration in `project/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

## 📚 API Documentation

### Supabase Service Functions

#### Authentication
```typescript
// Sign up a new officer
const { data, error } = await supabase.auth.signUp({
  email: 'officer@police.gov',
  password: 'securePassword'
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'officer@police.gov',
  password: 'securePassword'
})

// Sign out
const { error } = await supabase.auth.signOut()
```

#### FIR Management
```typescript
// Create a new FIR
const { data, error } = await supabase
  .from('firs')
  .insert({
    fir_number: 'FIR-2024-001',
    complainant_name: 'John Doe',
    incident_description: 'Theft of mobile phone',
    incident_location: 'Main Market',
    incident_date: new Date().toISOString(),
    officer_id: user.id
  })

// Fetch FIRs
const { data, error } = await supabase
  .from('firs')
  .select('*')
  .eq('officer_id', user.id)
```

#### Evidence Upload
```typescript
// Upload evidence file
const { data, error } = await supabase.storage
  .from('evidence')
  .upload(`${userId}/${fileName}`, file)

// Get public URL
const { data } = supabase.storage
  .from('evidence')
  .getPublicUrl(filePath)
```

## 🧪 Testing

### Running Tests

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

Example test for a component:

```typescript
import { render, screen } from '@testing-library/react'
import { FIRDrafting } from './FIRDrafting'

test('renders FIR drafting form', () => {
  render(<FIRDrafting />)
  const heading = screen.getByText(/draft fir/i)
  expect(heading).toBeInTheDocument()
})
```

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Set the root directory to `project`
4. Add environment variables in Vercel dashboard
5. Deploy with automatic builds

### Deploy to Netlify

1. Build the project: `npm run build`
2. Upload the `project/dist` folder to [Netlify](https://netlify.com)
3. Configure environment variables
4. Set up continuous deployment

### Deploy to Custom Server

```bash
# Navigate to project directory
cd project

# Build for production
npm run build

# Copy dist folder to your server
scp -r dist/ user@yourserver:/var/www/smartcop/

# Configure nginx or apache to serve the files
```

## 🛡️ Security

### Environment Variables
- Never commit `.env` files to version control
- Use different keys for development and production
- Regularly rotate API keys

### Supabase Security
- Enable Row Level Security (RLS) on all tables
- Use appropriate policies for data access
- Keep the service role key secure (server-side only)

### File Uploads
- Validate file types and sizes
- Scan uploaded files for malware
- Use signed URLs for private files

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
   ```bash
   # Click the Fork button on GitHub
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add tests for new features
   - Update documentation

4. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```

5. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Provide a clear description of changes
   - Link to any related issues

### Code Style Guidelines

- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep components small and focused

## 🐛 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Supabase Connection Issues
- Check your `.env` file for correct URLs and keys
- Verify your Supabase project is active
- Check network connectivity

#### CORS Errors
- Ensure your domain is added to Supabase allowed origins
- Check API endpoint URLs

#### File Upload Issues
- Verify storage bucket permissions
- Check file size limits
- Ensure proper RLS policies

### Getting Help

1. Check the [Issues](https://github.com/Priyanshu07190/SmartCop/issues) page
2. Search existing discussions
3. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Environment details
   - Error messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 SmartCop

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 👥 Authors

- **Priyanshu** - *Initial work* - [Priyanshu07190](https://github.com/Priyanshu07190)

See also the list of [contributors](https://github.com/Priyanshu07190/SmartCop/contributors) who participated in this project.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the amazing backend services
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
- [React](https://reactjs.org) team for the incredible library
- [Vite](https://vitejs.dev) for the lightning-fast build tool
- Government of India's [Bhashini](https://bhashini.gov.in) for translation services

---

<div align="center">
  <p>Made with ❤️ for the Police Department</p>
  <p>
    <a href="#-smartcop---intelligent-police-management-system">Back to top</a>
  </p>
</div>
