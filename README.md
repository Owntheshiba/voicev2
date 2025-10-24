# Voice Social App

A social voice-based application built with Next.js 14, Farcaster Mini App SDK, and PostgreSQL.

## Features

- 🎤 **Voice Recording & Upload** - Record and share voice messages up to 60 seconds
- 📱 **Voice Feed** - Infinite scroll feed with voice cards
- ❤️ **Like System** - Like voices and earn points
- 💬 **Comments** - Text and voice comments on voices
- 🔔 **Notifications** - Real-time notifications for likes and comments
- 👤 **User Profiles** - Profile pages with voice history and stats
- 🏆 **Leaderboard** - Point-based ranking system
- 🔗 **Farcaster Integration** - Built for Farcaster Mini Apps

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Railway)
- **Storage**: AWS S3 for voice recordings
- **Real-time**: Pusher for notifications
- **Authentication**: Farcaster Mini App SDK
- **UI**: shadcn/ui components

## Point System

- 1 View = 1 point
- 1 Like = 5 points
- 1 Comment = 10 points

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- AWS S3 bucket
- Pusher account
- Farcaster account

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd voice-social-app
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```bash
# Create .env.local file
touch .env.local
```

Fill in your environment variables:
- `DATABASE_URL` - PostgreSQL connection string (Railway will provide this)
- `NEXT_PUBLIC_VIBES_ENGINEERING_PROJECT_ID` - Your Farcaster project ID
- `NEXT_PUBLIC_URL` - Your app URL (e.g., https://your-app.railway.app)

**Note:** AWS S3 and Pusher are optional. The app works with local file storage and polling-based notifications.

4. Set up the database
```bash
pnpm db:push
```

5. Run the development server
```bash
pnpm dev
```

## Database Schema

The app uses the following main models:

- **User** - Farcaster user information
- **Voice** - Voice recordings with metadata
- **Like** - User likes on voices
- **Comment** - Text and voice comments
- **VoiceView** - View tracking for analytics
- **Notification** - User notifications
- **UserPoints** - Point tracking system

## API Endpoints

### Voices
- `GET /api/voices/random` - Get random voices for feed
- `POST /api/voices/upload` - Upload new voice recording
- `POST /api/voices/[id]/like` - Like/unlike a voice
- `POST /api/voices/[id]/view` - Record a view
- `GET /api/voices/[id]/comments` - Get comments for a voice
- `POST /api/voices/[id]/comments` - Add a comment

### Users
- `GET /api/users/[fid]` - Get user profile and stats

### Notifications
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Mark notifications as read

### Leaderboard
- `GET /api/leaderboard` - Get leaderboard data

## Deployment

### Railway (Recommended)

1. Connect your GitHub repository to Railway
2. Add environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Vercel

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details