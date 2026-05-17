// Editorial design tokens — must stay in sync with web app's tailwind.config.js.

export const C = {
  paper:     '#faf6ef',
  cream:     '#f3ede1',
  creamDeep: '#ebe2cf',
  ink:       '#1a1410',
  inkSoft:   '#4a3f35',
  inkMuted:  '#7a6e60',
  rust:      '#c44a1a',
  rustSoft:  'rgba(196, 74, 26, 0.12)',
  moss:      '#4a6b3a',
  mossSoft:  'rgba(74, 107, 58, 0.15)',
  amber:     '#d99845',
  amberSoft: 'rgba(217, 152, 69, 0.15)',
  sky:       '#4a7ba8',
  skySoft:   'rgba(74, 123, 168, 0.15)',
  hairline:  'rgba(26, 20, 16, 0.10)',
} as const;

export const F = {
  display: 'Fraunces_500Medium',
  displayItalic: 'Fraunces_500Medium_Italic',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemi: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
  mono: 'Inter_400Regular',
} as const;

export const RADII = { sm: 8, md: 14, lg: 20, xl: 24, pill: 999 } as const;
export const SPACE = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48 } as const;
