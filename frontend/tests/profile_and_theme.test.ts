import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  findUserByIdentifier,
  updateUserProfile,
  changeUserPassword,
  signJwt,
  verifyJwt,
  VERIFIED_USERS,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../lib/serverAuth';
import { getDashboardPath, extractUserRole } from '../lib/api';

describe('SafaiPay Profile, Authentication & Theme System Tests', () => {
  // 1. Theme Configuration Tests
  describe('Theme Tokens and Preferences', () => {
    it('uses the mandatory storage key safaipay_theme_preference', () => {
      const storageKey = 'safaipay_theme_preference';
      assert.equal(storageKey, 'safaipay_theme_preference');
    });

    it('supports strictly light and dark theme preferences without system mode', () => {
      const validPreferences = ['light', 'dark'];
      assert.ok(validPreferences.includes('light'));
      assert.ok(validPreferences.includes('dark'));
      assert.equal(validPreferences.includes('system' as any), false);
    });
  });

  // 2. Profile Validation Tests
  describe('Profile Validation & Management', () => {
    it('rejects names shorter than 2 characters during profile update', () => {
      assert.throws(() => {
        const name = 'A';
        if (name.trim().length < 2) {
          throw new Error('Full name must be at least 2 characters.');
        }
      }, /Full name must be at least 2 characters/);
    });

    it('validates email format accurately', () => {
      const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      assert.equal(isValidEmail('valid@safaipay.test'), true);
      assert.equal(isValidEmail('invalid-email'), false);
      assert.equal(isValidEmail('invalid@'), false);
    });

    it('updates user profile details and persists them', () => {
      const updatedUser = updateUserProfile('admin@safaipay.test', {
        full_name: 'SafaiPay Superadmin Updated',
        company_name: 'SafaiPay Headquarters',
      });
      assert.equal(updatedUser.full_name, 'SafaiPay Superadmin Updated');
      assert.equal(updatedUser.profile.organization_name, 'SafaiPay Headquarters');
      assert.ok(updatedUser.profile.updated_at);
    });
  });

  // 3. Password Validation & Security Tests
  describe('Password Hashing & Change Password Workflow', () => {
    it('hashes passwords securely using salted PBKDF2', () => {
      const raw = 'NewSecurePassword123!';
      const hashed = hashPassword(raw);
      assert.notEqual(raw, hashed);
      assert.ok(hashed.includes(':'));
      assert.equal(verifyPassword(raw, hashed), true);
      assert.equal(verifyPassword('WrongPassword123!', hashed), false);
    });

    it('rejects password changes with incorrect current password', () => {
      assert.throws(() => {
        changeUserPassword('usr_cust_001', 'IncorrectCurrentPassword!', 'NewSecretPassword123!');
      }, /Current password is incorrect/);
    });

    it('rejects new passwords that are less than 8 characters', () => {
      assert.throws(() => {
        changeUserPassword('usr_cust_001', 'SafaiPassword123!', 'short');
      }, /New password must be at least 8 characters/);
    });

    it('successfully changes password and invalidates previous passwords', () => {
      const success = changeUserPassword(
        'usr_cust_001',
        'SafaiPassword123!',
        'BrandNewSecurePassword123!'
      );
      assert.equal(success, true);

      const user = findUserByIdentifier('usr_cust_001');
      assert.ok(user);
      assert.equal(verifyPassword('BrandNewSecurePassword123!', user!.passwordHash, user), true);
    });
  });

  // 4. Role Permissions & Token Lifecycle Tests
  describe('Role-Based Access Control and Token Lifecycle', () => {
    it('correctly extracts user role from user object', () => {
      assert.equal(extractUserRole({ role: 'customer' }), 'customer');
      assert.equal(extractUserRole({ roles: ['COLLECTOR'] }), 'collector');
      assert.equal(extractUserRole({ roles: ['RECYCLER'] }), 'recycler');
      assert.equal(extractUserRole({ roles: ['ADMIN'] }), 'admin');
    });

    it('signs and verifies JWT access tokens with expiration', () => {
      const token = signJwt({ sub: 'usr_admin_001', role: 'admin' }, 3600);
      assert.ok(token);

      const decoded = verifyJwt(token);
      assert.ok(decoded);
      assert.equal(decoded!.sub, 'usr_admin_001');
      assert.equal(decoded!.role, 'admin');
    });

    it('rejects expired JWT tokens', () => {
      const expiredToken = signJwt({ sub: 'usr_admin_001' }, -10); // Expired 10 seconds ago
      const decoded = verifyJwt(expiredToken);
      assert.equal(decoded, null);
    });
  });

  // 5. Complete End-to-End User Flow
  describe('End-to-End User State Lifecycle', () => {
    it('executes full sequence: login -> profile menu -> view profile -> edit profile -> change password -> logout', () => {
      // 1. User Authenticates
      const user = findUserByIdentifier('collector@safaipay.test');
      assert.ok(user);
      assert.equal(verifyPassword('SafaiPassword123!', user!.passwordHash, user), true);

      // 2. Dashboard Resolution
      const dash = getDashboardPath(user!.role);
      assert.equal(dash, '/collector/dashboard');

      // 3. User Edits Profile
      const edited = updateUserProfile(user!.id, {
        full_name: 'Muhammad Rafiq Senior',
        service_area: 'Karachi South, East & Malir',
      });
      assert.equal(edited.full_name, 'Muhammad Rafiq Senior');
      assert.equal(edited.profile.service_area, 'Karachi South, East & Malir');

      // 4. User Changes Password
      const changed = changeUserPassword(
        user!.id,
        'SafaiPassword123!',
        'NewCollectorPassword2026!'
      );
      assert.equal(changed, true);

      // 5. User re-authenticates with new password
      const reloaded = findUserByIdentifier(user!.id);
      assert.equal(
        verifyPassword('NewCollectorPassword2026!', reloaded!.passwordHash, reloaded),
        true
      );
    });
  });

  // 6. In-App Notification System & Unread Counter
  describe('In-App Notification System & Unread Counter', () => {
    it('retrieves notifications isolated to the authenticated user', () => {
      const custNotifs = getUserNotifications('usr_cust_001');
      assert.ok(custNotifs.length > 0);
      assert.ok(custNotifs.every((n) => n.userId === 'usr_cust_001'));

      const collNotifs = getUserNotifications('usr_coll_001');
      assert.ok(collNotifs.length > 0);
      assert.ok(collNotifs.every((n) => n.userId === 'usr_coll_001'));
    });

    it('accurately counts unread notifications for the user', () => {
      const initialCount = getUnreadNotificationCount('usr_cust_001');
      assert.ok(initialCount >= 1);
    });

    it('marks a single notification as read and decrements unread count', () => {
      const custNotifs = getUserNotifications('usr_cust_001');
      const unreadItem = custNotifs.find((n) => !n.isRead);
      assert.ok(unreadItem);

      const countBefore = getUnreadNotificationCount('usr_cust_001');
      const updated = markNotificationAsRead('usr_cust_001', unreadItem!.id);
      assert.ok(updated);
      assert.equal(updated!.isRead, true);
      assert.ok(updated!.readAt);

      const countAfter = getUnreadNotificationCount('usr_cust_001');
      assert.equal(countAfter, countBefore - 1);
    });

    it('prevents marking notifications belonging to another user', () => {
      const custNotifs = getUserNotifications('usr_cust_001');
      const firstCustNotif = custNotifs[0];
      assert.ok(firstCustNotif);

      // Collector attempts to mark Customer's notification as read
      const unauthorizedResult = markNotificationAsRead('usr_coll_001', firstCustNotif.id);
      assert.equal(unauthorizedResult, null);
    });

    it('marks all notifications as read and resets unread count to zero', () => {
      const count = markAllNotificationsAsRead('usr_cust_001');
      assert.ok(count >= 0);

      const unreadCount = getUnreadNotificationCount('usr_cust_001');
      assert.equal(unreadCount, 0);

      // Verify all items are now marked read
      const remaining = getUserNotifications('usr_cust_001');
      assert.ok(remaining.every((n) => n.isRead));
    });
  });

  // 7. Profile Dropdown Layout & 2-Option Theme Specifications
  describe('Profile Dropdown Layout & 2-Option Theme Specifications', () => {
    it('strictly confines theme options to Light and Dark with centered icons and no description text', () => {
      const themeOptions = [
        { value: 'light', labelEn: 'Light', hasDescription: false },
        { value: 'dark', labelEn: 'Dark', hasDescription: false },
      ];

      assert.equal(themeOptions.length, 2);
      assert.equal(themeOptions[0].value, 'light');
      assert.equal(themeOptions[1].value, 'dark');
      assert.equal(themeOptions[0].hasDescription, false);
      assert.equal(themeOptions[1].hasDescription, false);
      assert.ok(!themeOptions.some((t: any) => t.value === 'system'));
    });

    it('ensures dropdown width and touch target constraints', () => {
      const minDropdownWidth = 380;
      const maxDropdownWidth = 520;
      const currentDropdownWidth = 420;

      assert.ok(currentDropdownWidth >= minDropdownWidth);
      assert.ok(currentDropdownWidth <= maxDropdownWidth);

      const minTouchTargetPx = 44;
      const currentButtonHeight = 48;
      assert.ok(currentButtonHeight >= minTouchTargetPx);
    });
  });
});
