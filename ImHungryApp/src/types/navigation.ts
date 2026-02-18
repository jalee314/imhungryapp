export interface FeedTabNavigatorProps {
  initialTab?: 'community' | 'deals' | 'discover';
}

export interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export interface AuthGuardProps {
  children: React.ReactNode;
}
