# ImHungri Admin Panel Guide

## Overview

The ImHungri Admin Panel provides comprehensive tools for managing the app's content, users, and analytics. This guide covers all features and functionality.

## Accessing the Admin Panel

### Hidden Access Method
1. Open the ImHungri app
2. Go to the Login screen (if not already there)
3. Tap the **"Im"** text in **"Welcome back to ImHungri"** **7 times within 5 seconds**
4. You'll be automatically redirected to the admin login screen
5. Enter your admin credentials (email and password)
6. Only users with `is_admin = true` in the database can access the panel

### Security Notes
- The admin panel is only accessible to users with admin privileges
- Non-admin users attempting to log in will be rejected
- The trigger is intentionally hidden in the login screen to prevent unauthorized access attempts

## Features

### 1. Dashboard (Home Screen)

The dashboard provides an overview of app analytics:

**Statistics:**
- Total Users (with recent signup count)
- Total Deals (with deals posted this week)
- Total Reports (with pending reports count)

**Quick Actions:**
- Access to all admin tools
- Content Moderation
- Deal Management
- User Management
- Mass Deal Upload

**Analytics:**
- Most Active Users (Top 5 by deal count)
- Most Popular Deals (Top 5 by upvotes)
- Pull-to-refresh for real-time data

### 2. Content Moderation (Reports)

Manage user reports and take appropriate action:

**Features:**
- View all pending reports
- See report details (deal title, reporter, uploader, reason)
- Review reported content
- Take moderation actions

**Available Actions:**
1. **Dismiss Report** - Mark report as resolved without action
2. **Delete Deal** - Remove the reported deal from the app
3. **Warn User** - Increment user's warning count
4. **Suspend User** - Temporarily suspend user (specify days)
5. **Ban User** - Permanently ban user from the app

**Workflow:**
1. Tap on a report to review details
2. Choose appropriate action based on violation severity
3. Optionally add a reason for ban/suspension
4. Confirm action
5. Report is marked as resolved and logged

### 3. Deal Management

Search, edit, and manage all deals in the app:

**Features:**
- Search deals by title or description
- View deal statistics (upvotes, downvotes, saves, views)
- Edit deal information
- Feature/unfeature deals
- Delete deals

**Editing Deals:**
1. Search for or browse deals
2. Tap on a deal to open edit modal
3. Update title or description
4. Save changes
5. Changes are reflected immediately in the app

**Featuring Deals:**
- Featured deals appear prominently in the feed
- Toggle featured status with one tap
- Track when and by whom deals were featured

**Pin Deals:**
- Use pin order to control deal placement
- Featured deals with pin orders appear first

### 4. User Management

Search and manage user accounts:

**Features:**
- Search users by username or email
- View user profiles and details
- View user status (admin, banned, suspended)
- See warning counts
- Take moderation actions on users

**User Details:**
- Username and email
- Location
- Join date
- Warning count
- Ban/suspension status and reasons

**User Actions:**
1. **Warn User** - Add a warning to user's account
2. **Suspend User** - Temporarily suspend (specify days and reason)
3. **Ban User** - Permanently ban (with reason)
4. **Unban User** - Remove permanent ban
5. **Remove Suspension** - End temporary suspension early
6. **Delete User** - Permanently delete user and all their data

**Suspension System:**
- Specify suspension duration in days
- Optionally provide reason
- Users cannot post while suspended
- Suspension automatically expires after duration

### 5. Mass Deal Upload

Quickly upload multiple deals to the app:

**Features:**
- Reuses the existing deal creation interface
- Upload deals one at a time with full control
- All standard deal creation features available
- Tips and best practices provided

**Best Practices:**
- Use clear, accurate deal titles
- Add high-quality photos when available
- Set accurate expiration dates
- Verify restaurant information
- Include relevant details in description

**After Upload:**
- Deals can be managed from Deal Management screen
- Can be edited, featured, or deleted at any time

## Database Schema Changes

The admin panel introduces several new database fields:

### User Table Additions:
- `is_admin` - Boolean flag for admin access
- `is_banned` - Boolean flag for permanent ban
- `is_suspended` - Boolean flag for temporary suspension
- `suspension_until` - Timestamp for suspension expiration
- `ban_reason` - Text field for ban explanation
- `suspended_reason` - Text field for suspension explanation
- `warning_count` - Integer count of warnings

### Deal Instance Table Additions:
- `is_featured` - Boolean flag for featured deals
- `featured_at` - Timestamp when deal was featured
- `featured_by` - User ID of admin who featured the deal
- `pin_order` - Integer for controlling deal order

### New Tables:
- `admin_action_log` - Logs all admin actions for audit trail
  - `log_id` - Unique identifier
  - `admin_user_id` - Admin who performed action
  - `action_type` - Type of action performed
  - `target_type` - Type of entity acted upon
  - `target_id` - ID of entity acted upon
  - `action_details` - JSON field for additional details
  - `created_at` - Timestamp

## Admin Service Functions

The admin panel uses a centralized service layer (`adminService.ts`) with the following capabilities:

### Authentication:
- `isAdmin()` - Check if current user is admin
- `logAction()` - Log admin actions for audit trail

### Report Management:
- `getReports(status?)` - Fetch reports by status
- `dismissReport(reportId)` - Dismiss a report
- `resolveReportWithAction(...)` - Resolve with specific action

### Deal Management:
- `getDeals(searchQuery?, limit?)` - Search and fetch deals
- `updateDeal(dealId, updates)` - Edit deal information
- `deleteDeal(dealId)` - Remove deal
- `featureDeal(dealId, featured)` - Toggle featured status
- `pinDeal(dealId, pinOrder)` - Set pin order

### User Management:
- `searchUsers(query)` - Search users
- `getUser(userId)` - Get user details
- `warnUser(userId)` - Add warning
- `banUser(userId, reason?)` - Ban user
- `unbanUser(userId)` - Unban user
- `suspendUser(userId, days, reason?)` - Suspend user
- `unsuspendUser(userId)` - Remove suspension
- `deleteUser(userId)` - Delete user account

### Analytics:
- `getAnalytics()` - Fetch comprehensive app analytics

## Security Considerations

1. **Admin Flag Required**: Only users with `is_admin = true` can access any admin features
2. **Hidden Access**: The 7-tap trigger prevents casual discovery
3. **Action Logging**: All admin actions are logged with timestamps and details
4. **Authentication Check**: Admin status is verified on every admin panel load
5. **Database Policies**: Server-side policies prevent banned/suspended users from posting

## Setting Up Admin Users

To create an admin user:

1. **Via Migration** (recommended):
   ```sql
   UPDATE "user" SET is_admin = TRUE WHERE email = 'admin@imhungri.com';
   ```

2. **Via Supabase Dashboard**:
   - Go to Table Editor
   - Open the `user` table
   - Find your user by email
   - Set `is_admin` to `true`

3. **Via SQL Editor**:
   ```sql
   UPDATE "user" 
   SET is_admin = TRUE 
   WHERE user_id = 'your-user-id-here';
   ```

## Applying Database Changes

Run the migration to add admin features:

```bash
# From the project root
cd ImHungryApp
supabase db push

# Or if using remote database
supabase db remote commit
```

## Usage Tips

1. **Content Moderation Priority**: Focus on reports marked as "Inappropriate/offensive" first
2. **Warning System**: Use warnings before suspensions/bans for first-time minor violations
3. **Feature Strategically**: Feature high-quality deals to improve user experience
4. **Mass Upload**: Use mass upload for verified merchant deals or curated promotions
5. **Regular Analytics Review**: Check dashboard weekly to track app growth and engagement

## Troubleshooting

### Can't Access Admin Panel
- Verify `is_admin = true` in database for your user
- Check that you're logged in with the correct account
- Try logging out and back in

### Admin Features Not Working
- Verify database migration was applied successfully
- Check Supabase logs for errors
- Ensure RLS policies allow admin access

### Reports Not Showing
- Check that reports exist in `user_report` table
- Verify status filter (default is "pending")
- Check for database connection issues

## Future Enhancements

Potential additions to the admin panel:
- Bulk deal editing
- Advanced analytics and reporting
- User activity timeline
- Content approval queue
- Automated moderation rules
- Admin role permissions (different admin levels)
- Export data capabilities

## Support

For admin panel issues or questions, contact the development team.

---

Last Updated: October 18, 2025

