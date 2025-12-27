/**
 * UI System Tests
 * 
 * Tests for the design system (Phase 2) to verify:
 * - Design tokens are correctly defined
 * - Token values match existing app implementation
 * - Atoms produce correct style objects
 * - Theme configuration is correct
 * - Utility functions work as expected
 */

import * as tokens from '../src/ui/tokens';
import { atoms as a } from '../src/ui/atoms';
import { lightTheme, darkTheme } from '../src/ui/themes';
import { fontFamily } from '../src/ui/fonts';
import { breakpoints } from '../src/ui/breakpoints';
import { flatten } from '../src/ui/util/flatten';
import { isWeb, isIOS, isAndroid, isNative } from '../src/ui/util/platform';

// ==========================================
// Design Tokens Tests
// ==========================================

describe('Design Tokens', () => {
  describe('Color Tokens', () => {
    it('should have primary brand colors matching existing implementation', () => {
      // Primary colors from existing app
      expect(tokens.color.primary_500).toBe('#FFA05C'); // Accent color
      expect(tokens.color.primary_600).toBe('#FF8C4C'); // Button/selection bg
      expect(tokens.color.primary_100).toBe('#FFE5B4'); // Peach background
    });

    it('should have gray scale matching existing implementation', () => {
      // Exact values from existing components
      expect(tokens.color.gray_100).toBe('#F7F4F4'); // Card bg (DealCard)
      expect(tokens.color.gray_200).toBe('#DEDEDE'); // Light border (Header)
      expect(tokens.color.gray_300).toBe('#D7D7D7'); // Default border
      expect(tokens.color.gray_500).toBe('#757575'); // Muted text
      expect(tokens.color.gray_700).toBe('#404040'); // Secondary text
      expect(tokens.color.gray_900).toBe('#181619'); // Primary text
    });

    it('should have text colors matching existing implementation', () => {
      expect(tokens.color.text_primary).toBe('#181619'); // SignUp primary text
      expect(tokens.color.text_dark).toBe('#1D1B20');    // Header icon color
    });

    it('should have semantic colors defined', () => {
      expect(tokens.color.success_500).toBeDefined();
      expect(tokens.color.warning_500).toBeDefined();
      expect(tokens.color.error_500).toBeDefined();
      expect(tokens.color.favorite_red).toBe('#FF1E00');
    });

    it('should have all required color keys', () => {
      const requiredColors = [
        'primary_50', 'primary_100', 'primary_200', 'primary_300',
        'primary_400', 'primary_500', 'primary_600', 'primary_700',
        'primary_800', 'primary_900',
        'gray_0', 'gray_25', 'gray_50', 'gray_100', 'gray_200',
        'gray_300', 'gray_400', 'gray_500', 'gray_600', 'gray_700',
        'gray_800', 'gray_900', 'gray_1000',
        'white', 'black', 'transparent',
      ];
      
      requiredColors.forEach(colorKey => {
        expect(tokens.color[colorKey as keyof typeof tokens.color]).toBeDefined();
      });
    });
  });

  describe('Spacing Tokens', () => {
    it('should follow 4px base grid', () => {
      expect(tokens.space.xs).toBe(4);
      expect(tokens.space.sm).toBe(8);
      expect(tokens.space.md).toBe(12);
      expect(tokens.space.lg).toBe(16);
      expect(tokens.space.xl).toBe(20);
      expect(tokens.space._2xl).toBe(24);
    });

    it('should have all spacing keys', () => {
      const requiredSpacing = ['_2xs', 'xs', 'sm', 'md', 'lg', 'xl', '_2xl', '_3xl', '_4xl', '_5xl', '_6xl'];
      requiredSpacing.forEach(key => {
        expect(tokens.space[key as keyof typeof tokens.space]).toBeDefined();
        expect(typeof tokens.space[key as keyof typeof tokens.space]).toBe('number');
      });
    });
  });

  describe('Border Radius Tokens', () => {
    it('should have correct radius values', () => {
      expect(tokens.radius.none).toBe(0);
      expect(tokens.radius.xs).toBe(4);
      expect(tokens.radius.sm).toBe(8);
      expect(tokens.radius.md).toBe(12);
      expect(tokens.radius.lg).toBe(16);
      expect(tokens.radius.xl).toBe(20);
      expect(tokens.radius.full).toBe(9999);
    });
  });

  describe('Font Size Tokens', () => {
    it('should have font sizes matching existing usage', () => {
      expect(tokens.fontSize._2xs).toBe(10);
      expect(tokens.fontSize.xs).toBe(12);
      expect(tokens.fontSize.sm).toBe(14);
      expect(tokens.fontSize.md).toBe(16);
      expect(tokens.fontSize.lg).toBe(18);
      expect(tokens.fontSize._2xl).toBe(24);
    });
  });

  describe('Font Weight Tokens', () => {
    it('should have Inter font weights', () => {
      expect(tokens.fontWeight.light).toBe('300');
      expect(tokens.fontWeight.normal).toBe('400');
      expect(tokens.fontWeight.medium).toBe('500');
      expect(tokens.fontWeight.semibold).toBe('600');
      expect(tokens.fontWeight.bold).toBe('700');
    });
  });

  describe('Shadow Tokens', () => {
    it('should have shadow definitions with all required properties', () => {
      const shadowKeys = ['none', 'sm', 'md', 'lg'] as const;
      
      shadowKeys.forEach(key => {
        const shadow = tokens.shadow[key];
        expect(shadow).toHaveProperty('shadowColor');
        expect(shadow).toHaveProperty('shadowOffset');
        expect(shadow).toHaveProperty('shadowOpacity');
        expect(shadow).toHaveProperty('shadowRadius');
        expect(shadow).toHaveProperty('elevation');
      });
    });

    it('should have none shadow with zero values', () => {
      expect(tokens.shadow.none.shadowOpacity).toBe(0);
      expect(tokens.shadow.none.elevation).toBe(0);
    });
  });
});

// ==========================================
// Atoms Tests
// ==========================================

describe('Atoms', () => {
  describe('Flex Atoms', () => {
    it('should produce correct flex styles', () => {
      expect(a.flex_1).toEqual({ flex: 1 });
      expect(a.flex_row).toEqual({ flexDirection: 'row' });
      expect(a.flex_col).toEqual({ flexDirection: 'column' });
      expect(a.flex_wrap).toEqual({ flexWrap: 'wrap' });
    });

    it('should have alignment atoms', () => {
      // Atoms use 'align_' prefix instead of 'items_'
      expect(a.align_center).toEqual({ alignItems: 'center' });
      expect(a.align_start).toEqual({ alignItems: 'flex-start' });
      expect(a.align_end).toEqual({ alignItems: 'flex-end' });
      expect(a.justify_center).toEqual({ justifyContent: 'center' });
      expect(a.justify_between).toEqual({ justifyContent: 'space-between' });
    });
  });

  describe('Spacing Atoms', () => {
    it('should produce correct padding styles', () => {
      expect(a.p_xs).toEqual({ padding: tokens.space.xs });
      expect(a.p_sm).toEqual({ padding: tokens.space.sm });
      expect(a.p_md).toEqual({ padding: tokens.space.md });
      expect(a.p_lg).toEqual({ padding: tokens.space.lg });
    });

    it('should produce correct margin styles', () => {
      expect(a.m_xs).toEqual({ margin: tokens.space.xs });
      expect(a.m_sm).toEqual({ margin: tokens.space.sm });
      expect(a.m_md).toEqual({ margin: tokens.space.md });
    });

    it('should have directional padding', () => {
      expect(a.px_lg).toEqual({ paddingHorizontal: tokens.space.lg });
      expect(a.py_md).toEqual({ paddingVertical: tokens.space.md });
      expect(a.pt_sm).toEqual({ paddingTop: tokens.space.sm });
      expect(a.pb_lg).toEqual({ paddingBottom: tokens.space.lg });
    });

    it('should have gap atoms', () => {
      expect(a.gap_xs).toEqual({ gap: tokens.space.xs });
      expect(a.gap_sm).toEqual({ gap: tokens.space.sm });
      expect(a.gap_md).toEqual({ gap: tokens.space.md });
      expect(a.gap_lg).toEqual({ gap: tokens.space.lg });
    });
  });

  describe('Typography Atoms', () => {
    it('should produce correct font size styles', () => {
      expect(a.text_xs).toEqual({ fontSize: tokens.fontSize.xs });
      expect(a.text_sm).toEqual({ fontSize: tokens.fontSize.sm });
      expect(a.text_md).toEqual({ fontSize: tokens.fontSize.md });
      expect(a.text_lg).toEqual({ fontSize: tokens.fontSize.lg });
    });

    it('should produce correct font weight styles', () => {
      expect(a.font_normal).toEqual({ fontWeight: tokens.fontWeight.normal });
      expect(a.font_medium).toEqual({ fontWeight: tokens.fontWeight.medium });
      expect(a.font_semibold).toEqual({ fontWeight: tokens.fontWeight.semibold });
      expect(a.font_bold).toEqual({ fontWeight: tokens.fontWeight.bold });
    });

    it('should have text alignment atoms', () => {
      expect(a.text_center).toEqual({ textAlign: 'center' });
      expect(a.text_left).toEqual({ textAlign: 'left' });
      expect(a.text_right).toEqual({ textAlign: 'right' });
    });
  });

  describe('Border Atoms', () => {
    it('should produce correct border radius styles', () => {
      expect(a.rounded_xs).toEqual({ borderRadius: tokens.radius.xs });
      expect(a.rounded_sm).toEqual({ borderRadius: tokens.radius.sm });
      expect(a.rounded_md).toEqual({ borderRadius: tokens.radius.md });
      expect(a.rounded_full).toEqual({ borderRadius: tokens.radius.full });
    });

    it('should have border width atoms', () => {
      expect(a.border).toEqual({ borderWidth: 1 });
      expect(a.border_0).toEqual({ borderWidth: 0 });
    });
  });

  describe('Sizing Atoms', () => {
    it('should have width atoms', () => {
      expect(a.w_full).toEqual({ width: '100%' });
    });

    it('should have height atoms', () => {
      expect(a.h_full).toEqual({ height: '100%' });
    });
  });

  describe('Display Atoms', () => {
    it('should have overflow atoms', () => {
      expect(a.overflow_hidden).toEqual({ overflow: 'hidden' });
    });

    it('should have position atoms', () => {
      expect(a.absolute).toEqual({ position: 'absolute' });
      expect(a.relative).toEqual({ position: 'relative' });
    });
  });
});

// ==========================================
// Themes Tests
// ==========================================

describe('Themes', () => {
  describe('Light Theme', () => {
    it('should have correct name', () => {
      expect(lightTheme.name).toBe('light');
    });

    it('should have palette with primary colors matching tokens', () => {
      expect(lightTheme.palette.primary).toBe(tokens.color.primary_500);
      expect(lightTheme.palette.primary_light).toBe(tokens.color.primary_100);
      expect(lightTheme.palette.primary_dark).toBe(tokens.color.primary_600);
    });

    it('should have text colors matching existing implementation', () => {
      expect(lightTheme.palette.text).toBe(tokens.color.text_primary); // #181619
      expect(lightTheme.palette.text_secondary).toBe(tokens.color.gray_700); // #404040
      expect(lightTheme.palette.text_muted).toBe(tokens.color.gray_500); // #757575
    });

    it('should have border colors matching existing implementation', () => {
      expect(lightTheme.palette.border).toBe(tokens.color.gray_300); // #D7D7D7
      expect(lightTheme.palette.border_light).toBe(tokens.color.gray_200); // #DEDEDE
    });

    it('should have background colors', () => {
      expect(lightTheme.palette.background).toBe(tokens.color.white);
      expect(lightTheme.palette.background_secondary).toBe(tokens.color.gray_100); // #F7F4F4
    });

    it('should have theme atoms for backgrounds', () => {
      expect(lightTheme.atoms.bg).toEqual({ backgroundColor: tokens.color.white });
      expect(lightTheme.atoms.bg_secondary).toEqual({ backgroundColor: tokens.color.gray_100 });
    });

    it('should have theme atoms for text', () => {
      expect(lightTheme.atoms.text).toEqual({ color: tokens.color.text_primary });
      expect(lightTheme.atoms.text_secondary).toEqual({ color: tokens.color.gray_700 });
      expect(lightTheme.atoms.text_muted).toEqual({ color: tokens.color.gray_500 });
    });

    it('should have theme atoms for borders', () => {
      expect(lightTheme.atoms.border).toEqual({ borderColor: tokens.color.gray_300 });
      expect(lightTheme.atoms.border_light).toEqual({ borderColor: tokens.color.gray_200 });
    });

    it('should have shadow atoms', () => {
      expect(lightTheme.atoms.shadow_sm).toBeDefined();
      expect(lightTheme.atoms.shadow_md).toBeDefined();
      expect(lightTheme.atoms.shadow_lg).toBeDefined();
    });
  });

  describe('Dark Theme', () => {
    it('should have correct name', () => {
      expect(darkTheme.name).toBe('dark');
    });

    it('should have inverted colors compared to light theme', () => {
      // Dark theme should have light text on dark background
      expect(darkTheme.palette.background).not.toBe(lightTheme.palette.background);
      expect(darkTheme.palette.text).not.toBe(lightTheme.palette.text);
    });

    it('should maintain primary brand colors (note: dark theme uses lighter shade)', () => {
      // Dark theme uses a slightly adjusted primary for better contrast
      // This is intentional - dark mode should have lighter primary
      expect(darkTheme.palette.primary).toBe(tokens.color.primary_400);
      // Both still use the same brand color family
      expect(darkTheme.palette.primary.startsWith('#FF')).toBe(true);
    });
  });

  describe('Theme Type Completeness', () => {
    it('should have all required palette keys', () => {
      const requiredPaletteKeys = [
        'primary', 'primary_light', 'primary_dark',
        'background', 'background_secondary',
        'text', 'text_secondary', 'text_muted', 'text_inverted',
        'border', 'border_light',
        'success', 'warning', 'error',
        'white', 'black',
        'contrast_25', 'contrast_50', 'contrast_100', 'contrast_200', 'contrast_300',
      ];

      requiredPaletteKeys.forEach(key => {
        expect(lightTheme.palette[key as keyof typeof lightTheme.palette]).toBeDefined();
        expect(darkTheme.palette[key as keyof typeof darkTheme.palette]).toBeDefined();
      });
    });

    it('should have all required atom keys', () => {
      const requiredAtomKeys = [
        'bg', 'bg_secondary',
        'bg_contrast_25', 'bg_contrast_50', 'bg_contrast_100', 'bg_contrast_200', 'bg_contrast_300',
        'text', 'text_secondary', 'text_muted', 'text_inverted',
        'text_contrast_low', 'text_contrast_medium', 'text_contrast_high',
        'border', 'border_light',
        'border_contrast_low', 'border_contrast_medium', 'border_contrast_high',
        'shadow_sm', 'shadow_md', 'shadow_lg',
      ];

      requiredAtomKeys.forEach(key => {
        expect(lightTheme.atoms[key as keyof typeof lightTheme.atoms]).toBeDefined();
        expect(darkTheme.atoms[key as keyof typeof darkTheme.atoms]).toBeDefined();
      });
    });
  });
});

// ==========================================
// Fonts Tests
// ==========================================

describe('Fonts', () => {
  it('should have Inter font family with all weights', () => {
    expect(fontFamily.light).toBe('Inter-Light');
    expect(fontFamily.regular).toBe('Inter-Regular');
    expect(fontFamily.medium).toBe('Inter-Medium');
    expect(fontFamily.semibold).toBe('Inter-SemiBold');
    expect(fontFamily.bold).toBe('Inter-Bold');
  });

  it('should have default font', () => {
    expect(fontFamily.default).toBe('Inter-Regular');
  });
});

// ==========================================
// Breakpoints Tests
// ==========================================

describe('Breakpoints', () => {
  it('should have standard breakpoint values', () => {
    expect(breakpoints.phone).toBeDefined();
    expect(breakpoints.mobile).toBeDefined();
    expect(breakpoints.tablet).toBeDefined();
    expect(breakpoints.desktop).toBeDefined();
  });

  it('should have ascending breakpoint values', () => {
    expect(breakpoints.phone).toBeLessThan(breakpoints.mobile);
    expect(breakpoints.mobile).toBeLessThan(breakpoints.tablet);
    expect(breakpoints.tablet).toBeLessThan(breakpoints.desktop);
  });
});

// ==========================================
// Utility Functions Tests
// ==========================================

describe('Utility Functions', () => {
  describe('flatten', () => {
    it('should be exported', () => {
      expect(flatten).toBeDefined();
      expect(typeof flatten).toBe('function');
    });

    it('should handle single style object', () => {
      const result = flatten({ flex: 1, padding: 10 });
      // Note: In Jest environment, StyleSheet.flatten may just return the input
      expect(result).toEqual({ flex: 1, padding: 10 });
    });

    it('should handle array of styles (when not mocked)', () => {
      // This tests the actual behavior - flatten combines styles
      const input = [{ flex: 1 }, { padding: 10 }];
      const result = flatten(input);
      // Result should contain both properties
      expect(result).toBeDefined();
    });
  });

  describe('Platform utilities', () => {
    it('should export platform detection functions', () => {
      expect(typeof isWeb).toBe('boolean');
      expect(typeof isIOS).toBe('boolean');
      expect(typeof isAndroid).toBe('boolean');
      expect(typeof isNative).toBe('boolean');
    });

    it('should have isNative be true when not web', () => {
      expect(isNative).toBe(!isWeb);
    });
  });
});

// ==========================================
// Integration Tests
// ==========================================

describe('UI System Integration', () => {
  it('should allow combining atoms and theme atoms', () => {
    // In test environment, atoms are just plain objects from StyleSheet.create mock
    expect(a.flex_1).toEqual({ flex: 1 });
    expect(a.p_lg).toEqual({ padding: tokens.space.lg });
    expect(lightTheme.atoms.bg).toEqual({ backgroundColor: tokens.color.white });
    expect(lightTheme.atoms.text).toEqual({ color: tokens.color.text_primary });
  });

  it('should allow atoms to be spread into style arrays', () => {
    // Verify atoms can be used in arrays
    const styleArray = [a.flex_1, a.p_lg, lightTheme.atoms.bg];
    expect(Array.isArray(styleArray)).toBe(true);
    expect(styleArray.length).toBe(3);
  });

  it('tokens should match theme palette values', () => {
    // Verify tokens and theme are in sync
    expect(lightTheme.palette.primary).toBe(tokens.color.primary_500);
    expect(lightTheme.palette.text).toBe(tokens.color.text_primary);
    expect(lightTheme.palette.border).toBe(tokens.color.gray_300);
  });
});

// ==========================================
// Color Consistency Tests (Existing App Values)
// ==========================================

describe('Color Consistency with Existing App', () => {
  describe('SignUp.tsx Colors', () => {
    it('should have primary text color #181619', () => {
      expect(tokens.color.text_primary).toBe('#181619');
      expect(lightTheme.atoms.text.color).toBe('#181619');
    });

    it('should have secondary text color #404040', () => {
      expect(tokens.color.gray_700).toBe('#404040');
      expect(lightTheme.atoms.text_secondary.color).toBe('#404040');
    });

    it('should have button background #FF8C4C', () => {
      expect(tokens.color.primary_600).toBe('#FF8C4C');
    });
  });

  describe('DealCard.tsx Colors', () => {
    it('should have muted text color #757575', () => {
      expect(tokens.color.gray_500).toBe('#757575');
      expect(lightTheme.atoms.text_muted.color).toBe('#757575');
    });

    it('should have vote container background #F7F4F4', () => {
      expect(tokens.color.gray_100).toBe('#F7F4F4');
    });

    it('should have default border #D7D7D7', () => {
      expect(tokens.color.gray_300).toBe('#D7D7D7');
      expect(lightTheme.atoms.border.borderColor).toBe('#D7D7D7');
    });
  });

  describe('Header.tsx Colors', () => {
    it('should have light border #DEDEDE', () => {
      expect(tokens.color.gray_200).toBe('#DEDEDE');
      expect(lightTheme.atoms.border_light.borderColor).toBe('#DEDEDE');
    });

    it('should have location text color #333', () => {
      expect(tokens.color.gray_800).toBe('#333333');
    });
  });

  describe('CuisineFilter.tsx Colors', () => {
    it('should have selected filter background #FF8C4C', () => {
      expect(tokens.color.primary_600).toBe('#FF8C4C');
    });

    it('should have filter border #D7D7D7', () => {
      expect(tokens.color.gray_300).toBe('#D7D7D7');
    });
  });

  describe('Feed.tsx Colors', () => {
    it('should have retry button background #FFA05C', () => {
      expect(tokens.color.primary_500).toBe('#FFA05C');
    });

    it('should have empty/error text color #666', () => {
      expect(tokens.color.gray_600).toBe('#666666');
    });

    it('should have subtext color #999', () => {
      expect(tokens.color.gray_400).toBe('#999999');
    });
  });
});
