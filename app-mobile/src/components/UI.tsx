import type { ReactNode } from 'react';
import {
  Text, View, Pressable, StyleSheet, ActivityIndicator,
  type TextProps, type ViewProps, type PressableProps, type ViewStyle, type TextStyle,
} from 'react-native';
import { C, F, RADII, SPACE } from '../lib/colors';

export function Kicker({ children, style, ...p }: TextProps) {
  return (
    <Text style={[styles.kicker, style]} {...p}>
      {typeof children === 'string' ? children.toUpperCase() : children}
    </Text>
  );
}

export function Display({ children, italic, style, accent, size = 'lg', ...p }: TextProps & {
  italic?: boolean; accent?: 'rust' | 'sky' | 'amber' | 'moss'; size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}) {
  const sizes = { sm: 18, md: 22, lg: 28, xl: 36, '2xl': 48 };
  return (
    <Text
      style={[
        {
          fontFamily: italic ? F.displayItalic : F.display,
          fontSize: sizes[size],
          lineHeight: sizes[size] * 1.05,
          letterSpacing: -0.5,
          color: accent ? C[accent] : C.ink,
          fontStyle: italic ? 'italic' : 'normal',
        },
        style,
      ]}
      {...p}
    >
      {children}
    </Text>
  );
}

export function Body({ muted, soft, small, style, ...p }: TextProps & { muted?: boolean; soft?: boolean; small?: boolean }) {
  return (
    <Text
      style={[
        {
          fontFamily: F.sans,
          fontSize: small ? 13 : 15,
          lineHeight: small ? 18 : 22,
          color: muted ? C.inkMuted : soft ? C.inkSoft : C.ink,
        },
        style,
      ]}
      {...p}
    />
  );
}

export function Card({ children, style, accent, ...p }: ViewProps & { accent?: 'rust' | 'amber' | 'moss' | 'sky' }) {
  const accentBg = accent ? { backgroundColor: C[`${accent}Soft` as 'rustSoft' | 'amberSoft' | 'mossSoft' | 'skySoft'], borderColor: C[accent] + '40' } : undefined;
  return <View style={[styles.card, accentBg, style]} {...p}>{children}</View>;
}

export function Pill({ children, accent, style }: { children: ReactNode; accent?: 'rust' | 'amber' | 'moss' | 'sky'; style?: ViewStyle }) {
  const bg = accent ? C[`${accent}Soft` as 'rustSoft' | 'amberSoft' | 'mossSoft' | 'skySoft'] : C.cream;
  const fg = accent ? C[accent] : C.inkSoft;
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      <Text style={{ fontFamily: F.sansMedium, fontSize: 11, letterSpacing: 1.5, color: fg, textTransform: 'uppercase' }}>{children}</Text>
    </View>
  );
}

export function PrimaryButton({ children, loading, style, ...p }: PressableProps & { children: ReactNode; loading?: boolean }) {
  return (
    <Pressable
      android_ripple={{ color: '#0002' }}
      style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.92, transform: [{ translateY: 1 }] }, style as ViewStyle]}
      {...p}
    >
      {loading ? (
        <ActivityIndicator color={C.paper} />
      ) : (
        <Text style={styles.btnPrimaryText}>{children as any}</Text>
      )}
    </Pressable>
  );
}

export function GhostButton({ children, style, ...p }: PressableProps & { children: ReactNode }) {
  return (
    <Pressable
      android_ripple={{ color: '#0001' }}
      style={({ pressed }) => [styles.btnGhost, pressed && { opacity: 0.85 }, style as ViewStyle]}
      {...p}
    >
      <Text style={styles.btnGhostText}>{children as any}</Text>
    </Pressable>
  );
}

export function Row({ children, gap = SPACE[3], style }: { children: ReactNode; gap?: number; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Stack({ children, gap = SPACE[3], style }: { children: ReactNode; gap?: number; style?: ViewStyle }) {
  return <View style={[{ gap }, style]}>{children}</View>;
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: C.hairline, marginVertical: SPACE[3] }} />;
}

const styles = StyleSheet.create({
  kicker: {
    fontFamily: F.sansMedium, fontSize: 11, letterSpacing: 1.8,
    color: C.inkMuted, textTransform: 'uppercase',
  } as TextStyle,
  card: {
    backgroundColor: C.paper, borderRadius: RADII.lg, borderWidth: 1,
    borderColor: C.hairline, padding: SPACE[5],
  } as ViewStyle,
  pill: {
    paddingHorizontal: SPACE[3], paddingVertical: SPACE[1] + 2,
    borderRadius: RADII.pill, alignSelf: 'flex-start',
  } as ViewStyle,
  btnPrimary: {
    backgroundColor: C.rust, borderRadius: RADII.pill,
    paddingHorizontal: SPACE[6], paddingVertical: SPACE[3] + 2, minHeight: 48,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE[2],
    shadowColor: C.rust, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 4,
  } as ViewStyle,
  btnPrimaryText: { color: C.paper, fontFamily: F.sansSemi, fontSize: 15 } as TextStyle,
  btnGhost: {
    backgroundColor: C.cream, borderRadius: RADII.pill,
    paddingHorizontal: SPACE[4] + 2, paddingVertical: SPACE[3], minHeight: 44,
    borderWidth: 1, borderColor: C.hairline,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE[2],
  } as ViewStyle,
  btnGhostText: { color: C.ink, fontFamily: F.sansSemi, fontSize: 14 } as TextStyle,
});
