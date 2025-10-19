# Admin Panel Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Apply Database Changes
```bash
cd ImHungryApp
supabase db push
```

### Step 2: Create Your Admin Account
Run this SQL in Supabase SQL Editor (replace with your email):

```sql
UPDATE "user" 
SET is_admin = TRUE 
WHERE email = 'your-email@example.com';
```

Or via Supabase Dashboard:
1. Go to Table Editor → `user` table
2. Find your user by email
3. Set `is_admin` to `true`

### Step 3: Access the Admin Panel
1. Open the ImHungri app
2. Go to the Login screen
3. **Tap the "Im" text in "Welcome back to ImHungri" 7 times within 5 seconds**
4. You'll see the admin login screen
5. Login with your admin credentials
6. Welcome to the admin dashboard! 🎉

## 📱 Admin Panel Features

### From the Dashboard, you can:

**Content Moderation**
- Review user reports
- Delete inappropriate content
- Warn, suspend, or ban users

**Deal Management**
- Search all deals
- Edit deal information
- Feature deals prominently
- Delete deals

**User Management**
- Search users by username/email
- View user profiles
- Manage user accounts (warn/suspend/ban)
- Delete problematic users

**Mass Upload**
- Quickly upload multiple deals
- Use existing deal creation interface

**Analytics**
- View app statistics
- Track most active users
- See most popular deals

## 🔒 Security Features

- ✅ Hidden access (7-tap trigger)
- ✅ Admin-only login
- ✅ Database-level protection
- ✅ Action logging

## 📋 Common Actions

### Moderating a Report
1. Go to "Content Moderation"
2. Tap on a report
3. Choose action:
   - Dismiss (no action)
   - Delete deal
   - Warn user
   - Suspend user (+ days)
   - Ban user

### Featuring a Deal
1. Go to "Deal Management"
2. Search for the deal
3. Tap to edit
4. Tap "Feature" button
5. Deal now appears prominently in feed

### Managing a Problematic User
1. Go to "User Management"
2. Search for user
3. Tap user card
4. Tap "Manage User"
5. Choose action (warn/suspend/ban)

## 🐛 Troubleshooting

**Can't access admin panel?**
- Verify `is_admin = true` in database
- Make sure you're on the Login screen
- Tap only the "Im" text (not the whole title)
- Ensure you tap 7 times within 5 seconds

**Features not working?**
- Ensure database migration was applied
- Check Supabase logs for errors

## 📚 Full Documentation

For complete documentation, see:
- `ADMIN_PANEL_GUIDE.md` - Comprehensive feature guide
- `ADMIN_PANEL_IMPLEMENTATION.md` - Technical details

## 🎯 Pro Tips

1. **Start with Reports**: Check pending reports regularly
2. **Use Warnings First**: Escalate to suspensions/bans gradually
3. **Feature Quality Deals**: Improve user experience by featuring best deals
4. **Monitor Analytics**: Track app growth weekly
5. **Mass Upload**: Use for verified merchant deals

## 🆘 Need Help?

Contact the development team or check the full documentation in the `/docs` folder.

---

**Quick Reference**:
- Access: Tap "Im" text on Login screen 7 times in 5 seconds
- Login: Admin credentials required
- Navigate: Use quick action buttons on dashboard

