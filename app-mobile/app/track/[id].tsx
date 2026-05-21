import { ScrollView, View, Pressable, Linking, Share, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ChevronLeft, Phone, MessageCircle, Share2 } from 'lucide-react-native';
import { Display, Body, Kicker, Card, PrimaryButton, GhostButton, Stack, Pill, Row } from '../../src/components/UI';
import { C, F, SPACE } from '../../src/lib/colors';
import { getCaseStatus, getOrgBySlug } from '../../src/lib/queries';
import { DEFAULT_ORG_SLUG, supabase } from '../../src/lib/supabase';

const STATUS_NARRATIVE: Record<string, { kicker: string; title: string; accent: 'rust'|'amber'|'moss'|'sky' }> = {
  critical:           { kicker: 'Just received', title: 'A volunteer is being dispatched.',       accent: 'rust'  },
  'in-rescue':        { kicker: 'On the way',    title: 'A rescuer is heading there now.',        accent: 'amber' },
  recovering:         { kicker: 'In our care',   title: 'Resting. Healing. Eating well.',         accent: 'moss'  },
  released:           { kicker: 'Released',      title: 'Back to sky. Thank you for spotting her.', accent: 'sky' },
  'closed-unrescued': { kicker: 'Closed',        title: 'We couldn\'t find them in time.',        accent: 'rust'  },
};

export default function TrackScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const c   = useQuery({ queryKey: ['case', id], queryFn: () => getCaseStatus(id!), enabled: !!id, refetchInterval: 60_000 });
  const org = useQuery({ queryKey: ['org', DEFAULT_ORG_SLUG], queryFn: () => getOrgBySlug(DEFAULT_ORG_SLUG) });

  // Realtime: status changes ping the tracker immediately. Polling stays as a
  // fallback (slow network, websocket dropped).
  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`case:${id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cases', filter: `id=eq.${id}` },
        () => qc.invalidateQueries({ queryKey: ['case', id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, qc]);

  const narrative = c.data ? STATUS_NARRATIVE[c.data.status] : null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }}
      contentContainerStyle={{ paddingTop: insets.top + SPACE[3], padding: SPACE[5], paddingBottom: SPACE[12] }}>
      <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACE[4] }}>
        <ChevronLeft size={20} color={C.inkSoft} />
        <Body small soft>Back</Body>
      </Pressable>

      {c.isLoading && <Body small muted>Loading…</Body>}
      {c.isError && <Body small style={{ color: C.rust }}>Couldn't load. {(c.error as Error)?.message}</Body>}

      {c.data && narrative && (
        <>
          <Card accent={narrative.accent}>
            <Kicker>{narrative.kicker} · {c.data.short_id}</Kicker>
            {c.data.first_photo_url ? (
              <Image
                source={{ uri: c.data.first_photo_url }}
                style={{ width: '100%', aspectRatio: 16/10, borderRadius: 14, marginTop: SPACE[3], backgroundColor: C.cream }}
              />
            ) : (
              <Body style={{ fontSize: 64, marginTop: SPACE[2] }}>{c.data.species_emoji ?? '🪶'}</Body>
            )}
            <Display size="xl" accent={narrative.accent} style={{ marginTop: SPACE[3] }}>{narrative.title}</Display>
            <Body soft style={{ marginTop: SPACE[3] }}>
              {c.data.species_name ?? c.data.threat_summary ?? 'Case'} · reported {new Date(c.data.received_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.
            </Body>
            <Pill accent={narrative.accent} style={{ marginTop: SPACE[3] }}>{c.data.status.replace('-', ' ')}</Pill>
          </Card>

          <Card style={{ marginTop: SPACE[4] }}>
            <Kicker>Where</Kicker>
            <Display size="md" style={{ marginTop: 4 }}>{c.data.area ?? '—'}</Display>
            <Body small soft style={{ marginTop: SPACE[2] }}>{c.data.threat_summary}</Body>
          </Card>

          <Stack gap={SPACE[2]} style={{ marginTop: SPACE[5] }}>
            {org.data?.helpline_e164 && (
              <PrimaryButton onPress={() => Linking.openURL(`tel:${org.data!.helpline_e164}`)}>
                <Phone size={16} color={C.paper} /> Call the team
              </PrimaryButton>
            )}
            {org.data?.helpline_e164 && (
              <GhostButton onPress={() => Linking.openURL(`https://wa.me/${org.data!.helpline_e164!.replace(/\D/g, '')}?text=Update on ${c.data!.short_id}?`)}>
                <MessageCircle size={14} color={C.ink} /> WhatsApp for update
              </GhostButton>
            )}
            <GhostButton
              onPress={() => Share.share({
                message: `I reported a rescue with Karuna — ${c.data!.species_name ?? c.data!.threat_summary ?? 'a bird in trouble'} (${c.data!.short_id}). Status: ${c.data!.status.replace('-', ' ')}.`,
                title: `Karuna rescue ${c.data!.short_id}`,
              })}
            >
              <Share2 size={14} color={C.ink} /> Share with a neighbour
            </GhostButton>
          </Stack>

          <Card style={{ marginTop: SPACE[5] }}>
            <Kicker>What happens next</Kicker>
            <Body small soft style={{ marginTop: SPACE[3], lineHeight: 22 }}>
              The coordinator triages within minutes. A volunteer is dispatched. Vet review on arrival. Recovery in our rehab center
              (most birds: 2–6 weeks). A release back to a quieter spot.
              {'\n\n'}You can call us anytime. We'll never not pick up.
            </Body>
          </Card>

          <Body small muted style={{ marginTop: SPACE[5], textAlign: 'center', fontFamily: F.displayItalic, fontStyle: 'italic' }}>
            Thank you. Most people scroll past.
          </Body>
        </>
      )}
    </ScrollView>
  );
}
