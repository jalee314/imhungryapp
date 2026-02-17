/**
 * @file useProfileModals — Logout and delete-account modal state & handlers.
 */

import { useState } from 'react';
import { handleUserLogout, handleAccountDeletion } from '../../../services/profileActionsService';
import { showDeleteAccountConfirmation } from '../../../services/profileUtilsService';
import type { ProfileModalState, ProfileModalHandlers } from '../types';

// ============================================================================
// Hook
// ============================================================================

export interface UseProfileModalsParams {
  navigation: any;
  profile: any | null;
}

export function useProfileModals({
  navigation,
  profile,
}: UseProfileModalsParams): ProfileModalState & ProfileModalHandlers {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const openLogoutModal = () => setShowLogoutModal(true);
  const closeLogoutModal = () => setShowLogoutModal(false);
  const confirmLogout = async () => {
    closeLogoutModal();
    await handleUserLogout();
  };

  const openDeleteModal = () => setShowDeleteModal(true);
  const closeDeleteModal = () => setShowDeleteModal(false);
  const confirmDeleteAccount = async () => {
    showDeleteAccountConfirmation(async () => {
      closeDeleteModal();
      const success = await handleAccountDeletion(profile);
      if (success) navigation.navigate('LogIn');
    }, closeDeleteModal);
  };

  return {
    showLogoutModal,
    showDeleteModal,
    openLogoutModal,
    closeLogoutModal,
    confirmLogout,
    openDeleteModal,
    closeDeleteModal,
    confirmDeleteAccount,
  };
}
