# Email Configuration Guide

This document explains how to configure Gmail integration for the Documents & Letters module.

## Environment Variables

Add the following variables to your `.env` file in the `backend` directory:

```env
# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Chiro HRMS
```

## Gmail Setup Instructions

### Step 1: Enable 2-Step Verification

1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Navigate to **Security**
3. Under "Signing in to Google", enable **2-Step Verification**
4. Follow the setup process

### Step 2: Generate App Password

1. Go to [Google Account App Passwords](https://myaccount.google.com/apppasswords)
   - Or navigate: Security → 2-Step Verification → App passwords
2. Select app: **Mail**
3. Select device: **Other (Custom name)**
   - Enter: "Chiro HRMS"
4. Click **Generate**
5. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Configure .env File

1. Open `backend/.env` file (create if it doesn't exist)
2. Add the email configuration:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop  # Use the 16-character app password (no spaces)
EMAIL_FROM=your-actual-email@gmail.com
EMAIL_FROM_NAME=Chiro HRMS
```

**Important Notes:**
- Use your **App Password**, NOT your regular Gmail password
- Remove spaces from the app password if it has any
- The `EMAIL_USER` and `EMAIL_FROM` should be the same Gmail address
- `EMAIL_FROM_NAME` is the display name that appears in emails

### Step 4: Test Email Configuration

After starting your backend server, you can test the email configuration by:

1. Generating a document with the "Send via email" option enabled
2. Check the server logs for any email errors
3. Verify the email was received in the employee's inbox

## Troubleshooting

### "Email configuration verification failed"

- Check that 2-Step Verification is enabled on your Google Account
- Verify the app password is correct (no spaces, 16 characters)
- Ensure `EMAIL_USER` matches the Gmail address used to generate the app password

### "Email sending failed"

- Check that the employee's email address is valid
- Verify the PDF file exists at the specified path
- Check server logs for detailed error messages

### "Less secure app access" error

- This should not occur with App Passwords
- Make sure you're using an App Password, not your regular password
- Ensure 2-Step Verification is enabled

## Alternative Email Providers

If you're not using Gmail, adjust the configuration:

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

### Yahoo Mail
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

### Custom SMTP Server
```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587  # or 465 for SSL
EMAIL_SECURE=true  # true for port 465, false for port 587
```

## Security Best Practices

1. **Never commit `.env` file to version control**
2. Use App Passwords instead of regular passwords
3. Rotate App Passwords periodically
4. Use environment-specific configurations for development/production


