/**
 * Characterization Tests for adminService
 *
 * These tests capture the exact behavior of the adminService as a regression guard.
 * They lock report transforms, status transitions, and admin-check paths before
 * service decomposition.
 *
 * Behaviors captured:
 * - isAdmin: Admin check path with authentication
 * - logAction: Side effects (logging)
 * - getReports: Report retrieval and transformation
 * - updateReportStatus: Status transitions (pending/review)
 * - dismissReport: Resolution with 'keep' action
 * - resolveReportWithAction: Resolution with moderation actions
 * - mapResolutionAction: Resolution action mapping
 * - Report status transitions (pending → review → resolved)
 * - User moderation actions (warn/ban/suspend)
 */

import {
  mockSupabase,
  configureMockAuth,
  mockUser,
} from '../../test-utils/mocks/supabaseMock';
import {
  adminService,
  Report,
  ReportCounts,
  Deal,
  UserProfile,
  AppAnalytics,
} from '../adminService';

// Type for mock query builder
type MockQueryBuilder = ReturnType<typeof mockSupabase.from>;

describe('adminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configureMockAuth(mockUser);
  });

  // =============================================================================
  // isAdmin Tests
  // =============================================================================

  describe('isAdmin', () => {
    it('should return true for admin user', async () => {
      const mockQueryBuilder = createChainableMock();
      mockQueryBuilder.single.mockResolvedValue({
        data: { is_admin: true },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const result = await adminService.isAdmin();

      expect(result).toBe(true);
    });

    it('should return false for non-admin user', async () => {
      const mockQueryBuilder = createChainableMock();
      mockQueryBuilder.single.mockResolvedValue({
        data: { is_admin: false },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const result = await adminService.isAdmin();

      expect(result).toBe(false);
    });

    it('should return false when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await adminService.isAdmin();

      expect(result).toBe(false);
    });

    it('should return false when database query fails', async () => {
      const mockQueryBuilder = createChainableMock();
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      mockSupabase.from.mockReturnValue(mockQueryBuilder);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await adminService.isAdmin();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error checking admin status:', expect.anything());
      consoleSpy.mockRestore();
    });

    it('should return false when is_admin is null', async () => {
      const mockQueryBuilder = createChainableMock();
      mockQueryBuilder.single.mockResolvedValue({
        data: { is_admin: null },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const result = await adminService.isAdmin();

      expect(result).toBe(false);
    });

    it('should query user table with correct user ID', async () => {
      const mockQueryBuilder = createChainableMock();
      mockQueryBuilder.single.mockResolvedValue({
        data: { is_admin: true },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      await adminService.isAdmin();

      expect(mockSupabase.from).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('is_admin');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    });
  });

  // =============================================================================
  // logAction Tests
  // =============================================================================

  describe('logAction', () => {
    it('should log action to admin_action_log table', async () => {
      const mockQueryBuilder = createChainableMock();
      setMockData(mockQueryBuilder, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      await adminService.logAction('test_action', 'report', 'target-123', { extra: 'data' });

      expect(mockSupabase.from).toHaveBeenCalledWith('admin_action_log');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        admin_user_id: mockUser.id,
        action_type: 'test_action',
        target_type: 'report',
        target_id: 'target-123',
        action_details: { extra: 'data' },
      });
    });

    it('should use empty object for action_details when not provided', async () => {
      const mockQueryBuilder = createChainableMock();
      setMockData(mockQueryBuilder, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      await adminService.logAction('test_action', 'user', 'user-123');

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({ action_details: {} })
      );
    });

    it('should log error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await adminService.logAction('test_action', 'report', 'target-123');

      expect(consoleSpy).toHaveBeenCalledWith('Error logging admin action:', expect.anything());
      consoleSpy.mockRestore();
    });

    it('should log error when insert fails', async () => {
      const mockQueryBuilder = createChainableMock();
      setMockData(mockQueryBuilder, null, { message: 'Insert failed' });
      mockSupabase.from.mockReturnValue(mockQueryBuilder);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await adminService.logAction('test_action', 'report', 'target-123');

      expect(consoleSpy).toHaveBeenCalledWith('Error logging admin action:', expect.anything());
      consoleSpy.mockRestore();
    });
  });

  // =============================================================================
  // getReports Tests
  // =============================================================================

  describe('getReports', () => {
    describe('when no reports exist', () => {
      it('should return empty array', async () => {
        const mockQueryBuilder = createChainableMock();
        setMockData(mockQueryBuilder, []);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await adminService.getReports();

        expect(result).toEqual([]);
      });
    });

    describe('when query fails', () => {
      it('should return empty array and log error', async () => {
        const mockQueryBuilder = createChainableMock();
        setMockData(mockQueryBuilder, null, { message: 'Query failed' });
        mockSupabase.from.mockReturnValue(mockQueryBuilder);
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const result = await adminService.getReports();

        expect(result).toEqual([]);
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching reports:', expect.anything());
        consoleSpy.mockRestore();
      });
    });

    describe('report transformation', () => {
      it('should transform nested deal data to flat structure', async () => {
        const mockQueryBuilder = createChainableMock();
        setMockData(mockQueryBuilder, [createMockDbReport()]);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await adminService.getReports();

        expect(result[0].deal).toEqual({
          title: 'Test Deal',
          description: 'Test Description',
          image_url: 'medium-url',
          restaurant_name: 'Test Restaurant',
          restaurant_address: '123 Test St',
        });
      });

      it('should preserve original report fields', async () => {
        const mockQueryBuilder = createChainableMock();
        const dbReport = createMockDbReport();
        setMockData(mockQueryBuilder, [dbReport]);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await adminService.getReports();

        expect(result[0].report_id).toBe('report-123');
        expect(result[0].status).toBe('pending');
        expect(result[0].reason_code).toBeDefined();
        expect(result[0].reporter).toBeDefined();
        expect(result[0].uploader).toBeDefined();
      });

      it('should use Unknown for missing title', async () => {
        const mockQueryBuilder = createChainableMock();
        const dbReport = createMockDbReport({
          deal: { deal_template: { title: null } },
        });
        setMockData(mockQueryBuilder, [dbReport]);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await adminService.getReports();

        expect(result[0].deal?.title).toBe('Unknown');
      });

      it('should use empty string for missing description', async () => {
        const mockQueryBuilder = createChainableMock();
        const dbReport = createMockDbReport({
          deal: { deal_template: { description: null } },
        });
        setMockData(mockQueryBuilder, [dbReport]);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await adminService.getReports();

        expect(result[0].deal?.description).toBe('');
      });

      it('should use Unknown for missing restaurant name', async () => {
        const mockQueryBuilder = createChainableMock();
        const dbReport = createMockDbReport({
          deal: { deal_template: { restaurant: null } },
        });
        setMockData(mockQueryBuilder, [dbReport]);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await adminService.getReports();

        expect(result[0].deal?.restaurant_name).toBe('Unknown');
      });
    });

    describe('image URL extraction', () => {
      it('should prefer medium variant for image_url', async () => {
        const mockQueryBuilder = createChainableMock();
        const dbReport = createMockDbReport({
          deal: {
            deal_template: {
              image_metadata: {
                variants: { small: 'small', medium: 'medium', large: 'large', original: 'original' },
              },
            },
          },
        });
        setMockData(mockQueryBuilder, [dbReport]);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await adminService.getReports();

        expect(result[0].deal?.image_url).toBe('medium');
      });

      it('should fallback to large when no medium', async () => {
        const mockQueryBuilder = createChainableMock();
        const dbReport = createMockDbReport({
          deal: {
            deal_template: {
              image_metadata: {
                variants: { small: 'small', large: 'large', original: 'original' },
              },
            },
          },
        });
        setMockData(mockQueryBuilder, [dbReport]);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await adminService.getReports();

        expect(result[0].deal?.image_url).toBe('large');
      });

      it('should fallback to original when no medium or large', async () => {
        const mockQueryBuilder = createChainableMock();
        const dbReport = createMockDbReport({
          deal: {
            deal_template: {
              image_metadata: {
                variants: { small: 'small', original: 'original' },
              },
            },
          },
        });
        setMockData(mockQueryBuilder, [dbReport]);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await adminService.getReports();

        expect(result[0].deal?.image_url).toBe('original');
      });

      it('should fallback to small when no medium, large, or original', async () => {
        const mockQueryBuilder = createChainableMock();
        const dbReport = createMockDbReport({
          deal: {
            deal_template: {
              image_metadata: {
                variants: { small: 'small' },
              },
            },
          },
        });
        setMockData(mockQueryBuilder, [dbReport]);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await adminService.getReports();

        expect(result[0].deal?.image_url).toBe('small');
      });

      it('should return null for image_url when no variants', async () => {
        const mockQueryBuilder = createChainableMock();
        const dbReport = createMockDbReport({
          deal: {
            deal_template: {
              image_metadata: null,
            },
          },
        });
        setMockData(mockQueryBuilder, [dbReport]);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await adminService.getReports();

        expect(result[0].deal?.image_url).toBeNull();
      });
    });

    describe('status filtering', () => {
      it('should filter by status when provided', async () => {
        const mockQueryBuilder = createChainableMock();
        setMockData(mockQueryBuilder, []);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        await adminService.getReports('pending');

        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'pending');
      });

      it('should not filter by status when not provided', async () => {
        const mockQueryBuilder = createChainableMock();
        setMockData(mockQueryBuilder, []);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        await adminService.getReports();

        // eq should not be called for status filtering
        // (it may be called for other purposes, so we check the call args)
        const eqCalls = mockQueryBuilder.eq.mock.calls;
        const statusCall = eqCalls.find((call: any) => call[0] === 'status');
        expect(statusCall).toBeUndefined();
      });
    });
  });

  // =============================================================================
  // updateReportStatus Tests
  // =============================================================================

  describe('updateReportStatus', () => {
    it('should update status to pending', async () => {
      const mockQueryBuilder = createChainableMock();
      setMockData(mockQueryBuilder, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const result = await adminService.updateReportStatus('report-123', 'pending');

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_report');
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({
        status: 'pending',
        resolved_by: null,
        resolution_action: null,
      });
    });

    it('should update status to review', async () => {
      const mockQueryBuilder = createChainableMock();
      setMockData(mockQueryBuilder, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const result = await adminService.updateReportStatus('report-123', 'review');

      expect(result.success).toBe(true);
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({
        status: 'review',
        resolved_by: null,
        resolution_action: null,
      });
    });

    it('should clear resolved_by and resolution_action on status change', async () => {
      const mockQueryBuilder = createChainableMock();
      setMockData(mockQueryBuilder, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      await adminService.updateReportStatus('report-123', 'pending');

      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          resolved_by: null,
          resolution_action: null,
        })
      );
    });

    it('should return error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await adminService.updateReportStatus('report-123', 'review');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });

    it('should return error when update fails', async () => {
      const mockQueryBuilder = createChainableMock();
      setMockData(mockQueryBuilder, null, { message: 'Update failed' });
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const result = await adminService.updateReportStatus('report-123', 'review');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });

    it('should log action after successful update', async () => {
      let logActionCalled = false;
      const mockQueryBuilder = createChainableMock();
      setMockData(mockQueryBuilder, null);
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'admin_action_log') {
          logActionCalled = true;
        }
        return mockQueryBuilder;
      });

      await adminService.updateReportStatus('report-123', 'review');

      expect(logActionCalled).toBe(true);
    });
  });

  // =============================================================================
  // getReportCounts Tests
  // =============================================================================

  describe('getReportCounts', () => {
    it('should return correct counts from parallel queries', async () => {
      const mockQueryBuilder = createChainableMock();
      // Mock thenable behavior for count queries
      let callIndex = 0;
      const counts = [10, 5, 3, 2]; // total, pending, review, resolved
      Object.defineProperty(mockQueryBuilder, 'then', {
        value: (resolve: (value: unknown) => void) => {
          const result = { count: counts[callIndex++], data: null, error: null };
          return Promise.resolve(result).then(resolve);
        },
        writable: true,
        configurable: true,
      });
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const result = await adminService.getReportCounts();

      expect(result).toEqual({
        total: 10,
        pending: 5,
        review: 3,
        resolved: 2,
      });
    });

    it('should return zeros when query fails', async () => {
      const mockQueryBuilder = createChainableMock();
      setMockData(mockQueryBuilder, null, { message: 'Query failed' });
      mockSupabase.from.mockReturnValue(mockQueryBuilder);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await adminService.getReportCounts();

      expect(result).toEqual({
        total: 0,
        pending: 0,
        review: 0,
        resolved: 0,
      });
      consoleSpy.mockRestore();
    });

    it('should handle null counts', async () => {
      const mockQueryBuilder = createChainableMock();
      Object.defineProperty(mockQueryBuilder, 'then', {
        value: (resolve: (value: unknown) => void) => {
          return Promise.resolve({ count: null, data: null, error: null }).then(resolve);
        },
        writable: true,
        configurable: true,
      });
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const result = await adminService.getReportCounts();

      expect(result).toEqual({
        total: 0,
        pending: 0,
        review: 0,
        resolved: 0,
      });
    });

    it('should snapshot ReportCounts shape', async () => {
      const counts: ReportCounts = {
        total: 100,
        pending: 50,
        review: 30,
        resolved: 20,
      };

      expect(counts).toMatchSnapshot();
    });
  });

  // =============================================================================
  // dismissReport Tests
  // =============================================================================

  describe('dismissReport', () => {
    it('should set status to resolved with keep action', async () => {
      const mockQueryBuilder = createChainableMock();
      setMockData(mockQueryBuilder, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const result = await adminService.dismissReport('report-123');

      expect(result.success).toBe(true);
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({
        status: 'resolved',
        resolution_action: 'keep',
        resolved_by: mockUser.id,
      });
    });

    it('should set resolved_by to current user', async () => {
      const mockQueryBuilder = createChainableMock();
      setMockData(mockQueryBuilder, null);
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      await adminService.dismissReport('report-123');

      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({ resolved_by: mockUser.id })
      );
    });

    it('should return error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await adminService.dismissReport('report-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });

    it('should log dismissal action', async () => {
      let actionLogged = false;
      const mockQueryBuilder = createChainableMock();
      setMockData(mockQueryBuilder, null);
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'admin_action_log') {
          actionLogged = true;
        }
        return mockQueryBuilder;
      });

      await adminService.dismissReport('report-123');

      expect(actionLogged).toBe(true);
    });
  });

  // =============================================================================
  // resolveReportWithAction Tests
  // =============================================================================

  describe('resolveReportWithAction', () => {
    describe('resolution action mapping', () => {
      it('should map delete_deal to remove', async () => {
        const mockQueryBuilder = createChainableMock();
        setupMocksForResolve(mockQueryBuilder);

        await adminService.resolveReportWithAction(
          'report-123',
          'delete_deal',
          'deal-123'
        );

        expect(mockQueryBuilder.update).toHaveBeenCalledWith(
          expect.objectContaining({ resolution_action: 'remove' })
        );
      });

      it('should map warn_user to warn_uploader', async () => {
        const mockQueryBuilder = createChainableMock();
        setupMocksForResolve(mockQueryBuilder);

        await adminService.resolveReportWithAction(
          'report-123',
          'warn_user',
          undefined,
          'user-123'
        );

        expect(mockQueryBuilder.update).toHaveBeenCalledWith(
          expect.objectContaining({ resolution_action: 'warn_uploader' })
        );
      });

      it('should map ban_user to ban_uploader', async () => {
        const mockQueryBuilder = createChainableMock();
        setupMocksForResolve(mockQueryBuilder);

        await adminService.resolveReportWithAction(
          'report-123',
          'ban_user',
          undefined,
          'user-123',
          'Violation'
        );

        expect(mockQueryBuilder.update).toHaveBeenCalledWith(
          expect.objectContaining({ resolution_action: 'ban_uploader' })
        );
      });

      it('should map suspend_user to ban_uploader', async () => {
        const mockQueryBuilder = createChainableMock();
        setupMocksForResolve(mockQueryBuilder);

        await adminService.resolveReportWithAction(
          'report-123',
          'suspend_user',
          undefined,
          'user-123',
          'Temporary violation',
          7
        );

        expect(mockQueryBuilder.update).toHaveBeenCalledWith(
          expect.objectContaining({ resolution_action: 'ban_uploader' })
        );
      });
    });

    describe('validation', () => {
      it('should require dealId for delete_deal action', async () => {
        const mockQueryBuilder = createChainableMock();
        setupMocksForResolve(mockQueryBuilder);

        const result = await adminService.resolveReportWithAction(
          'report-123',
          'delete_deal'
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe('Missing deal ID for delete action');
      });

      it('should require userId for warn_user action', async () => {
        const mockQueryBuilder = createChainableMock();
        setupMocksForResolve(mockQueryBuilder);

        const result = await adminService.resolveReportWithAction(
          'report-123',
          'warn_user'
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe('Missing user ID for warn action');
      });

      it('should require userId for ban_user action', async () => {
        const mockQueryBuilder = createChainableMock();
        setupMocksForResolve(mockQueryBuilder);

        const result = await adminService.resolveReportWithAction(
          'report-123',
          'ban_user'
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe('Missing user ID for ban action');
      });

      it('should require userId for suspend_user action', async () => {
        const mockQueryBuilder = createChainableMock();
        setupMocksForResolve(mockQueryBuilder);

        const result = await adminService.resolveReportWithAction(
          'report-123',
          'suspend_user'
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe('Missing user ID for suspension');
      });

      it('should require suspensionDays for suspend_user action', async () => {
        const mockQueryBuilder = createChainableMock();
        setupMocksForResolve(mockQueryBuilder);

        const result = await adminService.resolveReportWithAction(
          'report-123',
          'suspend_user',
          undefined,
          'user-123'
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe('Suspension days are required');
      });
    });

    describe('status updates', () => {
      it('should set status to resolved', async () => {
        const mockQueryBuilder = createChainableMock();
        setupMocksForResolve(mockQueryBuilder);

        await adminService.resolveReportWithAction(
          'report-123',
          'delete_deal',
          'deal-123'
        );

        expect(mockQueryBuilder.update).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'resolved' })
        );
      });

      it('should set resolved_by to current user', async () => {
        const mockQueryBuilder = createChainableMock();
        setupMocksForResolve(mockQueryBuilder);

        await adminService.resolveReportWithAction(
          'report-123',
          'delete_deal',
          'deal-123'
        );

        expect(mockQueryBuilder.update).toHaveBeenCalledWith(
          expect.objectContaining({ resolved_by: mockUser.id })
        );
      });
    });

    it('should return error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await adminService.resolveReportWithAction(
        'report-123',
        'delete_deal',
        'deal-123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });
  });

  // =============================================================================
  // Status Transition Tests
  // =============================================================================

  describe('status transitions', () => {
    describe('valid transitions', () => {
      it('should allow pending → review', async () => {
        const mockQueryBuilder = createChainableMock();
        setMockData(mockQueryBuilder, null);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await adminService.updateReportStatus('report-123', 'review');

        expect(result.success).toBe(true);
      });

      it('should allow review → pending', async () => {
        const mockQueryBuilder = createChainableMock();
        setMockData(mockQueryBuilder, null);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await adminService.updateReportStatus('report-123', 'pending');

        expect(result.success).toBe(true);
      });

      it('should allow pending → resolved (via dismissReport)', async () => {
        const mockQueryBuilder = createChainableMock();
        setMockData(mockQueryBuilder, null);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await adminService.dismissReport('report-123');

        expect(result.success).toBe(true);
      });

      it('should allow review → resolved (via resolveReportWithAction)', async () => {
        const mockQueryBuilder = createChainableMock();
        setupMocksForResolve(mockQueryBuilder);

        const result = await adminService.resolveReportWithAction(
          'report-123',
          'delete_deal',
          'deal-123'
        );

        expect(result.success).toBe(true);
      });
    });
  });

  // =============================================================================
  // User Moderation Tests
  // =============================================================================

  describe('user moderation actions', () => {
    describe('warnUser', () => {
      it('should increment warning count via RPC', async () => {
        mockSupabase.rpc.mockResolvedValue({ error: null });

        const result = await adminService.warnUser('user-123');

        expect(result.success).toBe(true);
        expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_warning_count', { user_id: 'user-123' });
      });

      it('should fallback to manual increment when RPC fails', async () => {
        mockSupabase.rpc.mockResolvedValue({ error: { message: 'RPC not found' } });
        const mockQueryBuilder = createChainableMock();
        mockQueryBuilder.single.mockResolvedValue({
          data: { warning_count: 2 },
          error: null,
        });
        setMockData(mockQueryBuilder, null);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await adminService.warnUser('user-123');

        expect(result.success).toBe(true);
        expect(mockQueryBuilder.update).toHaveBeenCalledWith({ warning_count: 3 });
      });
    });

    describe('banUser', () => {
      it('should set is_banned to true', async () => {
        const mockQueryBuilder = createChainableMock();
        setMockData(mockQueryBuilder, null);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await adminService.banUser('user-123', 'Violation');

        expect(result.success).toBe(true);
        expect(mockQueryBuilder.update).toHaveBeenCalledWith({
          is_banned: true,
          ban_reason: 'Violation',
        });
      });

      it('should set ban_reason to null when not provided', async () => {
        const mockQueryBuilder = createChainableMock();
        setMockData(mockQueryBuilder, null);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        await adminService.banUser('user-123');

        expect(mockQueryBuilder.update).toHaveBeenCalledWith({
          is_banned: true,
          ban_reason: null,
        });
      });
    });

    describe('unbanUser', () => {
      it('should clear ban status', async () => {
        const mockQueryBuilder = createChainableMock();
        setMockData(mockQueryBuilder, null);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await adminService.unbanUser('user-123');

        expect(result.success).toBe(true);
        expect(mockQueryBuilder.update).toHaveBeenCalledWith({
          is_banned: false,
          ban_reason: null,
        });
      });
    });

    describe('suspendUser', () => {
      beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-02-12T12:00:00Z'));
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should set suspension fields', async () => {
        const mockQueryBuilder = createChainableMock();
        setMockData(mockQueryBuilder, null);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await adminService.suspendUser('user-123', 7, 'Temporary violation');

        expect(result.success).toBe(true);
        expect(mockQueryBuilder.update).toHaveBeenCalledWith({
          is_suspended: true,
          suspension_until: expect.any(String),
          suspended_reason: 'Temporary violation',
        });
      });

      it('should calculate suspension_until based on days', async () => {
        const mockQueryBuilder = createChainableMock();
        setMockData(mockQueryBuilder, null);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        await adminService.suspendUser('user-123', 7);

        const updateCall = mockQueryBuilder.update.mock.calls[0][0];
        const suspensionDate = new Date(updateCall.suspension_until);
        const expectedDate = new Date('2026-02-19T12:00:00Z');
        expect(suspensionDate.toISOString()).toBe(expectedDate.toISOString());
      });
    });

    describe('unsuspendUser', () => {
      it('should clear suspension fields', async () => {
        const mockQueryBuilder = createChainableMock();
        setMockData(mockQueryBuilder, null);
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await adminService.unsuspendUser('user-123');

        expect(result.success).toBe(true);
        expect(mockQueryBuilder.update).toHaveBeenCalledWith({
          is_suspended: false,
          suspension_until: null,
          suspended_reason: null,
        });
      });
    });

    describe('deleteUser', () => {
      it('should invoke edge function', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({ error: null });

        const result = await adminService.deleteUser('user-123');

        expect(result.success).toBe(true);
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('delete-auth-user', {
          body: { userId: 'user-123' },
        });
      });

      it('should return error when edge function fails', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({
          error: { message: 'Edge function failed' },
        });

        const result = await adminService.deleteUser('user-123');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Edge function failed');
      });
    });
  });

  // =============================================================================
  // Interface Snapshots
  // =============================================================================

  describe('interface snapshots', () => {
    it('should snapshot Report interface', () => {
      const report: Report = {
        report_id: 'report-001',
        deal_id: 'deal-001',
        reporter_user_id: 'user-reporter',
        uploader_user_id: 'user-uploader',
        reason_code_id: 'reason-001',
        reason_text: 'Additional details',
        status: 'pending',
        created_at: '2026-02-10T10:00:00Z',
        updated_at: '2026-02-10T10:00:00Z',
        resolved_by: null,
        resolution_action: null,
        deal: {
          title: 'Test Deal',
          description: 'Deal description',
          image_url: 'https://example.com/image.jpg',
          restaurant_name: 'Test Restaurant',
          restaurant_address: '123 Test St',
        },
        reporter: {
          display_name: 'Reporter Name',
          profile_photo: 'https://example.com/reporter.jpg',
        },
        uploader: {
          display_name: 'Uploader Name',
          profile_photo: null,
        },
        reason_code: {
          reason_code: 'SPAM',
          description: 'Spam or misleading content',
        },
      };

      expect(report).toMatchSnapshot();
    });

    it('should snapshot UserProfile interface', () => {
      const user: UserProfile = {
        user_id: 'user-001',
        display_name: 'Test User',
        email: 'test@example.com',
        profile_photo: 'https://example.com/photo.jpg',
        location_city: 'San Francisco',
        is_admin: false,
        is_banned: false,
        is_suspended: false,
        suspension_until: null,
        ban_reason: null,
        suspended_reason: null,
        warning_count: 0,
        created_at: '2026-01-01T00:00:00Z',
      };

      expect(user).toMatchSnapshot();
    });

    it('should snapshot Deal interface', () => {
      const deal: Deal = {
        deal_instance_id: 'deal-instance-001',
        deal_template_id: 'deal-template-001',
        title: 'Amazing Deal',
        description: 'Get 50% off!',
        image_url: 'https://example.com/deal.jpg',
        expiration_date: '2026-03-01T00:00:00Z',
        restaurant_name: 'Great Restaurant',
        restaurant_address: '456 Main St',
        uploader_user_id: 'user-001',
        category_name: 'Happy Hour',
        cuisine_name: 'Italian',
        created_at: '2026-02-01T00:00:00Z',
      };

      expect(deal).toMatchSnapshot();
    });

    it('should snapshot AppAnalytics interface', () => {
      const analytics: AppAnalytics = {
        totalUsers: 1000,
        totalDeals: 500,
        totalReports: 50,
        pendingReports: 10,
        mostActiveUsers: [
          { user_id: 'user-1', display_name: 'Active User 1', deal_count: 25 },
          { user_id: 'user-2', display_name: 'Active User 2', deal_count: 20 },
        ],
        mostPopularDeals: [
          { deal_instance_id: 'deal-1', title: 'Popular Deal 1', interaction_count: 100 },
          { deal_instance_id: 'deal-2', title: 'Popular Deal 2', interaction_count: 80 },
        ],
        recentSignups: 50,
        dealsThisWeek: 30,
      };

      expect(analytics).toMatchSnapshot();
    });
  });
});

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Creates a chainable mock for Supabase query builder
 */
function createChainableMock(): MockQueryBuilder {
  const mock = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    gt: jest.fn(),
    gte: jest.fn(),
    lt: jest.fn(),
    lte: jest.fn(),
    like: jest.fn(),
    ilike: jest.fn(),
    is: jest.fn(),
    in: jest.fn(),
    not: jest.fn(),
    or: jest.fn(),
    contains: jest.fn(),
    containedBy: jest.fn(),
    range: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn(),
  };

  // Default thenable behavior
  Object.defineProperty(mock, 'then', {
    value: (resolve: (value: unknown) => void) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
    writable: true,
    configurable: true,
  });

  // Make all methods return the mock itself for chaining
  Object.keys(mock).forEach((key) => {
    if (key !== 'single' && key !== 'maybeSingle' && key !== 'then') {
      (mock[key as keyof typeof mock] as jest.Mock).mockReturnValue(mock);
    }
  });

  return mock as MockQueryBuilder;
}

/**
 * Sets mock data/error on a query builder
 */
function setMockData(
  mock: MockQueryBuilder,
  data: unknown,
  error: { message: string } | null = null
) {
  Object.defineProperty(mock, 'then', {
    value: (resolve: (value: unknown) => void) =>
      Promise.resolve({ data, error }).then(resolve),
    writable: true,
    configurable: true,
  });
}

/**
 * Creates a mock database report for testing
 */
function createMockDbReport(overrides: any = {}): any {
  const defaultReport = {
    report_id: 'report-123',
    deal_id: 'deal-123',
    reporter_user_id: 'reporter-123',
    uploader_user_id: 'uploader-123',
    reason_code_id: 'reason-1',
    reason_text: 'Test reason',
    status: 'pending',
    created_at: '2026-02-10T10:00:00Z',
    updated_at: '2026-02-10T10:00:00Z',
    resolved_by: null,
    resolution_action: null,
    deal: {
      deal_id: 'deal-123',
      template_id: 'template-123',
      deal_template: {
        title: 'Test Deal',
        description: 'Test Description',
        restaurant: {
          name: 'Test Restaurant',
          address: '123 Test St',
        },
        image_metadata: {
          variants: {
            small: 'small-url',
            medium: 'medium-url',
            large: 'large-url',
            original: 'original-url',
          },
        },
      },
    },
    reporter: {
      display_name: 'Reporter User',
      profile_photo: 'reporter-photo.jpg',
    },
    uploader: {
      display_name: 'Uploader User',
      profile_photo: null,
    },
    reason_code: {
      reason_code: 'SPAM',
      description: 'Spam content',
    },
    ...overrides,
  };

  // Deep merge deal overrides
  if (overrides.deal) {
    defaultReport.deal = {
      ...defaultReport.deal,
      ...overrides.deal,
      deal_template: {
        ...defaultReport.deal.deal_template,
        ...(overrides.deal.deal_template || {}),
        restaurant: {
          ...defaultReport.deal.deal_template.restaurant,
          ...(overrides.deal?.deal_template?.restaurant || {}),
        },
        image_metadata: overrides.deal?.deal_template?.image_metadata !== undefined
          ? overrides.deal.deal_template.image_metadata
          : defaultReport.deal.deal_template.image_metadata,
      },
    };
  }

  return defaultReport;
}

/**
 * Sets up mocks for resolveReportWithAction tests
 */
function setupMocksForResolve(mockQueryBuilder: MockQueryBuilder) {
  setMockData(mockQueryBuilder, null);

  // Handle different table calls
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === 'user_report') {
      return mockQueryBuilder;
    }
    if (table === 'deal_instance') {
      const dealMock = createChainableMock();
      dealMock.single.mockResolvedValue({
        data: {
          template_id: 'template-123',
          deal_template: { image_metadata_id: 'img-123' },
        },
        error: null,
      });
      setMockData(dealMock, null);
      return dealMock;
    }
    if (table === 'image_metadata') {
      const imageMock = createChainableMock();
      imageMock.single.mockResolvedValue({
        data: { cloudinary_public_id: 'cloudinary-123' },
        error: null,
      });
      setMockData(imageMock, null);
      return imageMock;
    }
    if (table === 'user') {
      const userMock = createChainableMock();
      userMock.single.mockResolvedValue({
        data: { warning_count: 0 },
        error: null,
      });
      setMockData(userMock, null);
      return userMock;
    }
    if (table === 'admin_action_log') {
      const logMock = createChainableMock();
      setMockData(logMock, null);
      return logMock;
    }
    return mockQueryBuilder;
  });

  // Mock functions invoke for Cloudinary
  mockSupabase.functions.invoke.mockResolvedValue({ error: null });

  // Mock RPC for increment_warning_count
  mockSupabase.rpc.mockResolvedValue({ error: null });
}
