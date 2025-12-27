# Layout Components

Layout components provide consistent structure for screens throughout the app.

## Usage

```tsx
import * as Layout from '#/components/Layout'
import { atoms as a, useTheme } from '#/ui'

function SettingsScreen() {
  const t = useTheme()
  
  return (
    <Layout.Screen>
      {/* Header with back button and title */}
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.TitleText>Settings</Layout.Header.TitleText>
      </Layout.Header.Outer>
      
      {/* Scrollable content */}
      <Layout.Content>
        <Layout.Column gap="md">
          <SettingsItem title="Account" />
          <SettingsItem title="Notifications" />
          <Layout.Divider />
          <SettingsItem title="Privacy" />
        </Layout.Column>
      </Layout.Content>
    </Layout.Screen>
  )
}
```

## Components

### `<Layout.Screen>`
Root container for screens. Handles safe area insets and background color.

Props:
- `safe?: boolean` - Include safe area insets (default: true)
- `style?: ViewStyle` - Additional styles

### `<Layout.Content>`
Main content wrapper. Can be scrollable.

Props:
- `scrollable?: boolean` - Enable scrolling (default: true)
- `padding?: 'none' | 'compact' | 'base' | 'wide'` - Content padding (default: 'base')
- `style?: ViewStyle` - Additional styles

### `<Layout.Header.*>`
Header components using dot notation:

- `Header.Outer` - Container for header items
- `Header.BackButton` - Navigation back button
- `Header.TitleText` - Primary header text
- `Header.SubtitleText` - Secondary header text
- `Header.TitleGroup` - Container for title + subtitle
- `Header.Spacer` - Flexible spacer

### `<Layout.Row>` / `<Layout.Column>`
Flex containers for horizontal/vertical layouts.

Props:
- `gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'` - Gap between items
- `style?: ViewStyle` - Additional styles

### `<Layout.Center>`
Centers children horizontally and vertically.

### `<Layout.Divider>`
Horizontal separator line.

## Pattern: Complex Headers

```tsx
<Layout.Header.Outer>
  <Layout.Header.BackButton />
  <Layout.Header.TitleGroup>
    <Layout.Header.TitleText>Restaurant</Layout.Header.TitleText>
    <Layout.Header.SubtitleText>2.3 miles away</Layout.Header.SubtitleText>
  </Layout.Header.TitleGroup>
  <ShareButton />
</Layout.Header.Outer>
```
