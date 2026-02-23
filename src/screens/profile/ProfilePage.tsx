/**
 * @file ProfilePage — Thin navigation wrapper that delegates to the
 * decomposed ProfileContainer from the profile feature module.
 *
 * Preserves the default export and navigation registration expected by
 * TabStacks.tsx and the rest of the app.
 */

import React from 'react';

import ProfileContainer from '../../features/profile/ProfileContainer';

const ProfilePage: React.FC = () => <ProfileContainer />;

export default ProfilePage;
