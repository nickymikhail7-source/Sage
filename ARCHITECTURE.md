# Sage Architecture

## Folder Structure
- `src/app`: Next.js App Router pages and layouts.
- `src/components`: Reusable UI components (Sidebar, VoiceOrb).
- `src/db`: Database schema and client connection.
- `src/lib`: Utility functions and shared helpers.
- `src/actions`: Server actions for data mutation.

## Database Schema (Drizzle ORM)

### Users (`users`)
- `id`: UUID (Primary Key)
- `email`: String (Unique)
- `name`: String
- `createdAt`: Timestamp

### Email Accounts (`email_accounts`)
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key -> users.id)
- `provider`: String (e.g., 'gmail')
- `emailAddress`: String
- `accessToken`: String
- `refreshToken`: String
- `expiresAt`: Timestamp

## Styling System
- **Framework**: Tailwind CSS
- **Theme**: Dark Mode (`bg-zinc-950`)
- **Key Effects**: Glassmorphism (`backdrop-blur-lg`, `bg-white/5`), Glows (`shadow-[0_0_30px_theme(colors.purple.500)]`)
