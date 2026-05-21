import { ScrollView, View, Pressable, StyleSheet, RefreshControl, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { MapPin, ChevronRight, ArrowRight } from 'lucide-react-native';
import { Display, Body, Kicker, Card, Pill } from '../../src/components/UI';
import { C, F, SPACE } from '../../src/lib/colors';
import { supabase } from '../../src/lib/supabase';
import { listMyReports } from '../../src/lib/queries';
import { useEffect, useState } from 'react';

export default function MyReportsScreen() {
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const q = useQuery({
    queryKey: ['my-reports', userId],
    queryFn: () => listMyReports(userId!),
    enabled: !!userId,
  });

  const accentForStatus = (s: string) =>
    s === 'critical' ? 'rust' : s === 'released' ? 'sky' : s === 'recovering' ? 'moss' : 'amber';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.paper }}
      contentContainerStyle={{ paddingTop: insets.top + SPACE[4], padding: SPACE[5], paddingBottom: SPACE[12] }}
      refreshControl={<RefreshControl refreshing={q.isFetching && !q.isLoading} onRefresh={() => q.refetch()} tintColor={C.inkSoft} />}
    >
      <Kicker>My reports</Kicker>
      <Display size="xl" style={{ marginTop: SPACE[2] }}>
        Birds <Display size="xl" italic accent="rust">you answered for.</Display>
      </Display>

      {!userId && (
        <Pressable onPress={() => router.push('/(tabs)/profile')} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <Card style={{ marginTop: SPACE[5] }}>
            <Body soft>Sign in to see the rescues you've reported and follow their recovery.</Body>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACE[3] }}>
              <Body small style={{ color: C.rust, fontFamily: F.sansMedium }}>Go to Profile</Body>
              <ArrowRight size={14} color={C.rust} />
            </View>
          </Card>
        </Pressable>
      )}

      {q.isLoading && <Body small muted style={{ marginTop: SPACE[6] }}>Loading…</Body>}

      {!q.isLoading && (q.data?.length ?? 0) === 0 && userId && (
        <Card style={{ marginTop: SPACE[5] }}>
          <Display size="md">No reports yet.</Display>
          <Body soft small style={{ marginTop: 6 }}>When you submit a rescue from the Report tab, it'll show up here with live status.</Body>
        </Card>
      )}

      <View style={{ gap: SPACE[3], marginTop: SPACE[5] }}>
        {q.data?.map((c: any) => (
          <Pressable key={c.id} onPress={() => router.push(`/track/${c.id}`)}
            style={({ pressed }) => [S.row, pressed && { backgroundColor: C.cream }]}>
            {c.first_photo_url ? (
              <Image source={{ uri: c.first_photo_url }} style={S.thumb} />
            ) : (
              <View style={S.thumbFallback}>
                <Body style={{ fontSize: 28 }}>{c.species_emoji ?? '🪶'}</Body>
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', gap: SPACE[2], alignItems: 'center', flexWrap: 'wrap' }}>
                <Body small muted style={{ fontFamily: F.sansMedium }}>{c.short_id}</Body>
                <Pill accent={accentForStatus(c.status)}>{c.status.replace('-', ' ')}</Pill>
              </View>
              <Display size="md" style={{ marginTop: 2 }}>{c.species_name ?? c.threat_summary ?? 'Case'}</Display>
              <Body small soft numberOfLines={1} style={{ marginTop: 2 }}>
                <MapPin size={11} color={C.inkMuted} /> {c.area} · {new Date(c.received_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </Body>
            </View>
            <ChevronRight size={18} color={C.inkMuted} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const S = StyleSheet.create({
  row: {
    backgroundColor: C.paper, borderRadius: 16, borderWidth: 1, borderColor: C.hairline,
    padding: SPACE[3], flexDirection: 'row', alignItems: 'center', gap: SPACE[3],
  },
  thumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: C.cream },
  thumbFallback: {
    width: 52, height: 52, borderRadius: 12, backgroundColor: C.cream,
    alignItems: 'center', justifyContent: 'center',
  },
});
