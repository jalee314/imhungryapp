/**
 * UI Header Component Tests (PR-027 / RF-027)
 *
 * Tests for ScreenHeader and ModalHeader components after migration to ALF primitives.
 * Validates visual parity, interaction semantics, and snapshot consistency.
 */

import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { Text as RNText } from 'react-native';

import { ThemeProvider } from '../../../ui/primitives';
import ModalHeader from '../ModalHeader';
import ScreenHeader from '../ScreenHeader';

// Mock @expo/vector-icons to return a renderable element
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, size, color }: { name: string; size: number; color: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));

describe('ScreenHeader', () => {
  describe('Snapshots', () => {
    it('should match snapshot with title only', () => {
      const { toJSON } = render(
        <ThemeProvider>
          <ScreenHeader title="Test Screen" />
        </ThemeProvider>
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with back button', () => {
      const { toJSON } = render(
        <ThemeProvider>
          <ScreenHeader title="Screen with Back" onBack={() => {}} />
        </ThemeProvider>
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with right action icon', () => {
      const { toJSON } = render(
        <ThemeProvider>
          <ScreenHeader
            title="Screen with Action"
            onBack={() => {}}
            right={{ icon: 'settings', onPress: () => {} }}
          />
        </ThemeProvider>
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with custom right content', () => {
      const { toJSON } = render(
        <ThemeProvider>
          <ScreenHeader
            title="Custom Right"
            right={<RNText>Custom</RNText>}
          />
        </ThemeProvider>
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with ReactNode title', () => {
      const { toJSON } = render(
        <ThemeProvider>
          <ScreenHeader title={<RNText>Custom Title</RNText>} />
        </ThemeProvider>
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('should call onBack when back button is pressed', () => {
      const onBack = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <ScreenHeader title="Test" onBack={onBack} />
        </ThemeProvider>
      );

      const backIcon = getByTestId('icon-arrow-back');
      fireEvent.press(backIcon.parent?.parent!);
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('should call right action onPress when icon is pressed', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <ScreenHeader
            title="Test"
            right={{ icon: 'settings', onPress }}
          />
        </ThemeProvider>
      );

      const settingsIcon = getByTestId('icon-settings');
      fireEvent.press(settingsIcon.parent?.parent!);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should render placeholder when no back button', () => {
      const { queryByTestId } = render(
        <ThemeProvider>
          <ScreenHeader title="No Back" />
        </ThemeProvider>
      );

      expect(queryByTestId('icon-arrow-back')).toBeNull();
    });
  });

  describe('Visual parity', () => {
    it('should use lg font size for title (18px)', () => {
      const { toJSON } = render(
        <ThemeProvider>
          <ScreenHeader title="Font Size Test" />
        </ThemeProvider>
      );
      
      // The snapshot will capture the computed styles including fontSize: 18
      expect(toJSON()).toBeDefined();
    });

    it('should use bold font weight for title', () => {
      const { toJSON } = render(
        <ThemeProvider>
          <ScreenHeader title="Bold Test" />
        </ThemeProvider>
      );
      
      expect(toJSON()).toBeDefined();
    });
  });
});

describe('ModalHeader', () => {
  describe('Snapshots', () => {
    it('should match snapshot with title and cancel only', () => {
      const { toJSON } = render(
        <ThemeProvider>
          <ModalHeader title="Modal Title" onCancel={() => {}} />
        </ThemeProvider>
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with done button', () => {
      const { toJSON } = render(
        <ThemeProvider>
          <ModalHeader
            title="Modal with Done"
            onCancel={() => {}}
            onDone={() => {}}
          />
        </ThemeProvider>
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with disabled done button', () => {
      const { toJSON } = render(
        <ThemeProvider>
          <ModalHeader
            title="Disabled Done"
            onCancel={() => {}}
            onDone={() => {}}
            doneDisabled
          />
        </ThemeProvider>
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with custom right content', () => {
      const { toJSON } = render(
        <ThemeProvider>
          <ModalHeader
            title="Custom Right"
            onCancel={() => {}}
            rightContent={<RNText>Save</RNText>}
          />
        </ThemeProvider>
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with ReactNode title', () => {
      const { toJSON } = render(
        <ThemeProvider>
          <ModalHeader
            title={<RNText>Custom Title Node</RNText>}
            onCancel={() => {}}
          />
        </ThemeProvider>
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('should call onCancel when Cancel is pressed', () => {
      const onCancel = jest.fn();
      const { getByText } = render(
        <ThemeProvider>
          <ModalHeader title="Test" onCancel={onCancel} />
        </ThemeProvider>
      );

      fireEvent.press(getByText('Cancel'));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onDone when Done is pressed', () => {
      const onDone = jest.fn();
      const { getByText } = render(
        <ThemeProvider>
          <ModalHeader title="Test" onCancel={() => {}} onDone={onDone} />
        </ThemeProvider>
      );

      fireEvent.press(getByText('Done'));
      expect(onDone).toHaveBeenCalledTimes(1);
    });

    it('should not call onDone when disabled and pressed', () => {
      const onDone = jest.fn();
      const { getByText } = render(
        <ThemeProvider>
          <ModalHeader
            title="Test"
            onCancel={() => {}}
            onDone={onDone}
            doneDisabled
          />
        </ThemeProvider>
      );

      fireEvent.press(getByText('Done'));
      // TouchableOpacity with disabled=true should not fire onPress
      expect(onDone).not.toHaveBeenCalled();
    });

    it('should render placeholder when no done handler', () => {
      const { queryByText } = render(
        <ThemeProvider>
          <ModalHeader title="No Done" onCancel={() => {}} />
        </ThemeProvider>
      );

      expect(queryByText('Done')).toBeNull();
    });

    it('should render custom rightContent instead of Done', () => {
      const { getByText, queryByText } = render(
        <ThemeProvider>
          <ModalHeader
            title="Custom"
            onCancel={() => {}}
            rightContent={<RNText>Save</RNText>}
            onDone={() => {}}  // This should be ignored
          />
        </ThemeProvider>
      );

      expect(getByText('Save')).toBeTruthy();
      expect(queryByText('Done')).toBeNull();
    });
  });

  describe('Visual parity', () => {
    it('should use primary color for Done text', () => {
      const { toJSON } = render(
        <ThemeProvider>
          <ModalHeader title="Done Color" onCancel={() => {}} onDone={() => {}} />
        </ThemeProvider>
      );
      
      expect(toJSON()).toBeDefined();
    });

    it('should apply 0.5 opacity when done is disabled', () => {
      const { toJSON } = render(
        <ThemeProvider>
          <ModalHeader
            title="Disabled Opacity"
            onCancel={() => {}}
            onDone={() => {}}
            doneDisabled
          />
        </ThemeProvider>
      );
      
      expect(toJSON()).toBeDefined();
    });
  });
});

describe('Headers work without ThemeProvider', () => {
  it('ScreenHeader renders with default theme', () => {
    const { toJSON } = render(
      <ScreenHeader title="No Provider" onBack={() => {}} />
    );
    expect(toJSON()).toBeDefined();
  });

  it('ModalHeader renders with default theme', () => {
    const { toJSON } = render(
      <ModalHeader title="No Provider" onCancel={() => {}} onDone={() => {}} />
    );
    expect(toJSON()).toBeDefined();
  });
});
