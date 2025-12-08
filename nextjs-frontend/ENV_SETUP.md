# Firebase Environment Setup

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "sql-workspace")
4. Disable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Authentication

1. In your Firebase project, go to **Build** > **Authentication**
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle "Enable" on
   - Click "Save"
5. Enable **Google**:
   - Click on "Google"
   - Toggle "Enable" on
   - Add your project support email
   - Click "Save"

## 3. Get Your Firebase Config

1. Go to **Project Settings** (gear icon next to "Project Overview")
2. Scroll down to "Your apps"
3. Click the web icon (`</>`) to add a web app
4. Register your app with a nickname (e.g., "sql-workspace-web")
5. Copy the `firebaseConfig` object

## 4. Create Environment File

Create a file named `.env.local` in the `nextjs-frontend` folder with:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Replace the values with your actual Firebase config.

## 5. Restart the Development Server

After creating `.env.local`, restart the Next.js development server:

```bash
cd nextjs-frontend
npm run dev
```

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Make sure your `.env.local` file exists and has the correct values
- Restart the development server after creating/updating `.env.local`

### Google Sign-In Not Working
- Make sure Google provider is enabled in Firebase Console
- Add your domain to authorized domains:
  - Go to Authentication > Settings > Authorized domains
  - Add `localhost` for development

### "auth/popup-closed-by-user"
- This happens when the user closes the Google sign-in popup
- Not an error, just a cancelled sign-in attempt

## Production Deployment

For production, add these environment variables to your hosting platform:
- Vercel: Settings > Environment Variables
- Netlify: Site settings > Environment variables
- Railway: Variables tab

Make sure to also add your production domain to Firebase's authorized domains!
