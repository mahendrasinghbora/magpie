# Google Drive Backup Setup

Follow these steps to enable the Google Drive backup feature in Magpie.

## 1. Enable Google Drive API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project from the dropdown
3. Navigate to **APIs & Services** → **Library**
4. Search for "Google Drive API"
5. Click on it and press **Enable**

## 2. Update OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Click **Edit App**
3. Go to the **Scopes** section
4. Click **Add or Remove Scopes**
5. Add the following scope:
   - `https://www.googleapis.com/auth/drive.file`
6. Save changes

## 3. Verify Authorized Domains (if needed)

1. Go to **APIs & Services** → **Credentials**
2. Find and edit your **OAuth 2.0 Client ID** (Web client)
3. Ensure your app domain is listed in:
   - **Authorized JavaScript origins** (e.g., `https://your-app.web.app`)
   - **Authorized redirect URIs** (e.g., `https://your-app.web.app/__/auth/handler`)

## Notes

- **Testing Mode**: If your OAuth consent screen is in "Testing" mode, only users you've added as test users can use the Drive backup feature.
- **Production**: For public release, you'll need to submit your app for verification by Google to remove the "unverified app" warning.
- **Scope**: The `drive.file` scope only allows access to files created by the app, not the user's entire Drive.

## How the Backup Works

- Backups are stored in a folder called "Magpie Backups" in the user's Google Drive
- Files are named `magpie-backup-YYYY-MM-DD.json`
- Auto-backup triggers when the app opens if > 24 hours since last backup
- Users can also manually backup from Settings → Backup
