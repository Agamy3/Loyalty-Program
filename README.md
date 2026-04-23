# NFC Loyalty Program

A full-stack NFC-based loyalty web application for small businesses (cafés, gyms, etc.), optimized for deployment on Cloudflare Pages using Supabase as the backend.

## 🎯 Core Concept

A single NFC tag per store. When a customer taps:
- First time → creates account
- Returning → opens their loyalty profile
- Customer requests a point
- Staff must approve the point (anti-cheat)

## 🧱 Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Mobile-first design

### Backend (NO custom server)
- Supabase:
  - PostgreSQL database
  - Supabase Auth (OTP via phone)
  - Row Level Security (RLS)

### Deployment
- Cloudflare Pages (static + edge functions)

## 👥 User Roles (RBAC)

### 1. Customer
- Can:
  - Sign up / login
  - View points
  - Request points
- Cannot access admin dashboards

### 2. Store Staff
- Scoped to ONE store
- Can:
  - View pending requests
  - Approve/reject points

### 3. Store Owner (Admin)
- Scoped to ONE store
- Can:
  - Manage staff
  - Configure rewards
  - View analytics
  - Approve points

### 4. Super Admin
- Full platform access
- Can:
  - Create stores
  - Assign store owners
  - View all data

## 📱 NFC Flow

Each store has ONE NFC tag with URL:
```
https://yourdomain.com/store/{storeId}
```

Flow:
- User taps NFC
- Redirects to /store/[storeId]
- If not logged in:
  - Prompt login/signup
- If logged in:
  - Show loyalty dashboard
- Button: "Request Point"
  - Creates pending request in DB

## 🗄️ Database Schema

### Tables:

#### stores
- id (uuid)
- name (text)
- description (text, nullable)
- nfc_url (text, unique)
- created_at (timestamptz)
- updated_at (timestamptz)

#### users
- id (uuid, matches auth.users.id)
- phone (text, unique)
- name (text)
- role (enum: customer, staff, owner, super_admin)
- store_id (uuid, nullable for customers)
- created_at (timestamptz)
- updated_at (timestamptz)

#### points
- id (uuid)
- user_id (uuid)
- store_id (uuid)
- status (enum: pending, approved, rejected)
- requested_at (timestamptz)
- approved_at (timestamptz, nullable)
- approved_by (uuid, nullable)
- notes (text, nullable)

#### rewards
- id (uuid)
- store_id (uuid)
- reward_name (text)
- required_points (integer)
- description (text, nullable)
- is_active (boolean)
- created_at (timestamptz)
- updated_at (timestamptz)

## 🧠 Anti-Cheat Logic

- One request per user per 5 minutes (enforced via RLS policy)
- Points require approval
- Store validation (store_id must match)
- Prevent duplicate submissions

## 🚀 Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your Project URL and Anon Key

### 2. Set Up Database

1. In your Supabase project, go to SQL Editor
2. Run the schema file:
   ```sql
   -- Copy contents of database/schema.sql
   ```
3. Run the RLS policies:
   ```sql
   -- Copy contents of database/rls-policies.sql
   ```

### 3. Configure Authentication

1. In Supabase Dashboard → Authentication → Settings
2. Enable Phone signup
3. Configure SMS provider (Twilio, MessageBird, etc.)
4. Add your phone number to test

### 4. Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Get the Service Role Key from:
Supabase Dashboard → Settings → API → service_role (secret)

### 5. Install Dependencies

```bash
npm install
# or
yarn install
```

### 6. Run Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📱 Routes

### Customer Routes
- `/store/[storeId]` - Customer loyalty page (NFC destination)

### Staff Routes
- `/staff` - Staff dashboard for point approval

### Admin Routes
- `/admin` - Store owner dashboard
- `/super-admin` - Super admin dashboard

## 🔐 Security Features

### Row Level Security (RLS)

The app uses comprehensive RLS policies:

- **Customers**: Can only access their own data
- **Staff**: Can only access data for their store
- **Owners**: Can manage their store only
- **Super Admin**: Can access everything

### Key Security Policies

1. **Anti-Cheat**: Prevents duplicate point requests within 5 minutes
2. **Store Isolation**: Staff/owners can only see their store data
3. **User Privacy**: Customers only see their own points
4. **Role Validation**: Strict role-based access control

## 🚀 Deployment to Cloudflare Pages

### 1. Build the Project

```bash
npm run build
```

### 2. Deploy to Cloudflare Pages

1. Push your code to GitHub
2. In Cloudflare Dashboard → Pages → Create a project
3. Connect your GitHub repository
4. Build settings:
   - Framework preset: `Next.js`
   - Build command: `npm run build`
   - Build output directory: `.next`

### 3. Set Environment Variables

In Cloudflare Pages → Settings → Environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Deploy

Cloudflare will automatically deploy when you push to GitHub.

## 🏪 Setting Up Your First Store

### 1. Create Super Admin

1. Run this SQL in Supabase to create the first super admin:

```sql
-- Replace with your actual phone number
INSERT INTO users (id, phone, name, role, store_id)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '+1234567890',
  'Super Admin',
  'super_admin',
  NULL
);
```

2. Sign in with that phone number at `/super-admin`

### 2. Create a Store

1. In the Super Admin dashboard, click "Create New Store"
2. Enter store details
3. Note the NFC URL (e.g., "coffee-shop-123")

### 3. Assign Store Owner

1. Click "Assign Store Owner"
2. Select the store
3. Enter owner's phone and name
4. The owner will receive an SMS to set up their account

### 4. Configure NFC Tag

Program your NFC tag with:
```
https://yourdomain.com/store/coffee-shop-123
```

## 📱 Mobile Usage

1. Customer taps NFC tag
2. Lands on store page
3. Enters phone number
4. Receives OTP via SMS
5. Views their loyalty dashboard
6. Requests points
7. Staff approves via staff dashboard

## 🎨 UI/UX Features

- **Mobile-first design** - Optimized for NFC usage
- **Fast loading** - <2 seconds load time
- **Minimal steps** - Quick point requests
- **Clear CTAs** - "Tap to collect points"
- **Loading states** - Smooth user experience
- **Toast notifications** - Action feedback

## 💡 Bonus Features Implemented

- ✅ QR code fallback (same URL works for QR codes)
- ✅ Basic analytics (points per day, visits)
- ✅ Toast notifications for actions
- ✅ Real-time updates
- ✅ Responsive design

## 🔧 Development

### Project Structure

```
├── app/
│   ├── admin/              # Store owner dashboard
│   ├── api/                # API routes
│   ├── staff/              # Staff dashboard
│   ├── store/[storeId]/    # Customer page
│   ├── super-admin/        # Super admin dashboard
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── auth/               # Authentication components
│   └── ui/                 # UI components
├── database/
│   ├── schema.sql          # Database schema
│   └── rls-policies.sql    # Security policies
├── lib/
│   ├── auth.ts             # Auth utilities
│   └── supabase.ts         # Supabase client
└── README.md
```

### Key Files

- `database/schema.sql` - Complete database schema
- `database/rls-policies.sql` - Security policies
- `lib/supabase.ts` - Supabase client with TypeScript types
- `app/layout.tsx` - Root layout with AuthProvider
- `components/auth/AuthProvider.tsx` - Authentication context

## 🐛 Troubleshooting

### Common Issues

1. **SMS not sending**: Check your SMS provider configuration in Supabase
2. **RLS errors**: Ensure all policies are applied correctly
3. **Build errors**: Check environment variables are set
4. **NFC not working**: Ensure URL is correctly programmed

### Debug Mode

Add this to `.env.local` for debugging:
```env
NEXT_PUBLIC_DEBUG=true
```

## 📄 License

MIT License - feel free to use this for your business!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the Supabase documentation
3. Create an issue in the repository

---

**Built with ❤️ for small businesses**
