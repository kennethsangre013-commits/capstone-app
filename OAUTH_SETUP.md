# OAuth Setup Guide

This guide explains how to set up Google and Facebook OAuth authentication for your Ezkiel Cater app.

## Google OAuth Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API

### 2. Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Create credentials for each platform:

#### Web Application
- **Application type**: Web application
- **Authorized redirect URIs**: `https://auth.expo.io/@your-expo-username/ezkiel-cater`

#### Android Application
- **Application type**: Android
- **Package name**: `ezekielcatering.app.com`
- **SHA-1 certificate fingerprint**: Get from `eas credentials`

#### iOS Application
- **Application type**: iOS
- **Bundle ID**: `ezekielcatering.app.com`

### 3. Configure Environment Variables
Add these to your EAS secrets:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID --value "your_expo_client_id"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "your_android_client_id"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "your_ios_client_id"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "your_web_client_id"
```

## Facebook OAuth Setup

### 1. Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add **Facebook Login** product

### 2. Configure Facebook Login
1. Go to **Facebook Login** > **Settings**
2. Add redirect URIs:
   - `https://auth.expo.io/@your-expo-username/ezkiel-cater`
3. Configure **Valid OAuth Redirect URIs**

### 3. Configure Environment Variables
```bash
eas secret:create --scope project --name EXPO_PUBLIC_FACEBOOK_APP_ID --value "your_facebook_app_id"
```

## Local Development

1. Copy `.env.example` to `.env`
2. Fill in your OAuth credentials
3. Run `expo start`

## Production Deployment

Environment variables are automatically loaded from EAS secrets during build.

## Testing OAuth

1. **Google**: Test on both Android and iOS devices
2. **Facebook**: Test in production builds (development builds may have limitations)

## Troubleshooting

### Google Sign-In Issues
- Verify SHA-1 fingerprints match
- Check bundle ID/package name
- Ensure Google+ API is enabled

### Facebook Sign-In Issues
- Verify app is in production mode
- Check redirect URIs
- Ensure Facebook Login product is added

## Security Notes

- Never commit OAuth secrets to git
- Use EAS secrets for production
- Regularly rotate OAuth credentials
- Monitor OAuth usage in respective consoles
