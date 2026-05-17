import { useState } from 'react';
import { ScrollView, View, TextInput, Pressable, Image, Alert, StyleSheet, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Phone, ChevronLeft, MapPin, Camera, Send } from 'lucide-react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Card, Display, Body, Kicker, PrimaryButton, GhostButton, Stack, Row, Pill } from '../../src/components/UI';
import { C, F, RADII, SPACE } from '../../src/lib/colors';
import { createReport, getOrgBySlug, listFestivalAlerts, uploadReportPhoto } from '../../src/lib/queries';
import { DEFAULT_ORG_SLUG } from '../../src/lib/supabase';

type Kind = 'bird' | 'animal' | 'wildlife';
type Problem = 'injured' | 'stuck' | 'orphaned' | 'cruelty';
type Urgency = 'critical' | 'moderate' | 'low';

const KINDS: { v: Kind; emoji: string; label: string }[] = [
  { v: 'bird', emoji: '🪶', label: 'Bird' },
  { v: 'animal', emoji: '🐾', label: 'Cat / dog / cattle' },
  { v: 'wildlife', emoji: '🦉', label: 'Wildlife' },
];

const PROBLEMS: { v: Problem; emoji: string; label: string }[] = [
  { v: 'injured', emoji: '🩹', label: 'Injured' },
  { v: 'stuck', emoji: '🪤', label: 'Stuck' },
  { v: 'orphaned', emoji: '🥺', label: 'Orphaned baby' },
  { v: 'cruelty', emoji: '🚨', label: 'Cruelty' },
];

const URGENCIES: { v: Urgency; label: string; sub: string; accent: 'rust' | 'amber' | 'moss' }[] = [
  { v: 'critical', label: 'Bleeding / cannot move', sub: 'Help in minutes', accent: 'rust' },
  { v: 'moderate', label: 'Alive, struggling',      sub: 'Help today',     accent: 'amber' },
  { v: 'low',      label: 'Alert, just stuck',      sub: 'Help soon',      accent: 'moss' },
];

export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<{ kind?: Kind; problem?: Problem; urgency?: Urgency; area?: string; lat?: number; lng?: number; notes?: string; photoUri?: string }>({});
  const [busy, setBusy] = useState(false);

  const org = useQuery({ queryKey: ['org', DEFAULT_ORG_SLUG], queryFn: () => getOrgBySlug(DEFAULT_ORG_SLUG) });
  const alerts = useQuery({ queryKey: ['festivals'], queryFn: listFestivalAlerts });

  const submit = useMutation({
    mutationFn: async () => {
      const c = await createReport({
        org_id: org.data!.id,
        kind: draft.kind!, problem: draft.problem!, urgency: draft.urgency!,
        area: draft.area, lat: draft.lat, lng: draft.lng, notes: draft.notes,
        reporter_anon: true,
      });
      if (draft.photoUri) {
        try { await uploadReportPhoto(DEFAULT_ORG_SLUG, c.id, draft.photoUri); } catch (e) { console.warn('photo upload failed', e); }
      }
      return c;
    },
    onSuccess: (c) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push(`/track/${c.id}`);
    },
  });

  const advance = (next: Partial<typeof draft>) => {
    Haptics.selectionAsync();
    setDraft({ ...draft, ...next });
    setStep((s) => s + 1);
  };

  const grabLocation = async () => {
    setBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      setDraft((d) => ({
        ...d,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        area: place ? [place.subregion, place.city, place.region].filter(Boolean).join(', ') : d.area,
      }));
    } finally { setBusy(false); }
  };

  const pickPhoto = async (useCamera: boolean) => {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.65, allowsEditing: false })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.65, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled && result.assets[0]) setDraft({ ...draft, photoUri: result.assets[0].uri });
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: C.paper }}>
      <View style={S.header}>
        {step > 0 ? (
          <Pressable onPress={() => setStep((s) => s - 1)} style={S.backBtn}>
            <ChevronLeft size={20} color={C.inkSoft} />
            <Body small soft>Back</Body>
          </Pressable>
        ) : <View style={{ width: 60 }} />}
        <Kicker>Report · {step + 1} of 4</Kicker>
        <Pressable onPress={() => org.data?.helpline_e164 && Linking.openURL(`tel:${org.data.helpline_e164}`)} style={S.callBtn}>
          <Phone size={16} color={C.rust} />
          <Body small style={{ color: C.rust, fontFamily: F.sansSemi }}>Call</Body>
        </Pressable>
      </View>

      <View style={S.progressTrack}>
        <View style={[S.progressFill, { width: `${((step + 1) / 4) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACE[5], paddingBottom: SPACE[12] }}>
        {alerts.data && alerts.data.length > 0 && step === 0 && (
          <Card accent={alerts.data[0].severity === 'critical' ? 'rust' : 'amber'} style={{ marginBottom: SPACE[5] }}>
            <Kicker>Active alert</Kicker>
            <Display size="md" style={{ marginTop: 4 }}>{alerts.data[0].title}</Display>
            <Body soft small style={{ marginTop: 6 }}>{alerts.data[0].detail}</Body>
          </Card>
        )}

        {step === 0 && (
          <>
            <Display size="xl">What did you find?</Display>
            <Stack gap={SPACE[3]} style={{ marginTop: SPACE[6] }}>
              {KINDS.map((k) => (
                <Pressable key={k.v} onPress={() => advance({ kind: k.v })} style={({ pressed }) => [S.choiceRow, pressed && S.choicePressed]}>
                  <Body style={{ fontSize: 32 }}>{k.emoji}</Body>
                  <Display size="md">{k.label}</Display>
                </Pressable>
              ))}
            </Stack>
          </>
        )}

        {step === 1 && (
          <>
            <Display size="xl">What's wrong?</Display>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[3], marginTop: SPACE[6] }}>
              {PROBLEMS.map((p) => (
                <Pressable key={p.v} onPress={() => advance({ problem: p.v })}
                  style={({ pressed }) => [S.choiceTile, pressed && S.choicePressed]}>
                  <Body style={{ fontSize: 32 }}>{p.emoji}</Body>
                  <Display size="md" style={{ marginTop: 8 }}>{p.label}</Display>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Display size="xl">How bad?</Display>
            <Stack gap={SPACE[3]} style={{ marginTop: SPACE[6] }}>
              {URGENCIES.map((u) => (
                <Pressable key={u.v} onPress={() => advance({ urgency: u.v })}
                  style={({ pressed }) => [
                    {
                      backgroundColor: C[`${u.accent}Soft` as const],
                      borderColor: C[u.accent] + '60',
                      borderWidth: 2,
                      borderRadius: RADII.lg,
                      padding: SPACE[5],
                    },
                    pressed && { opacity: 0.9 },
                  ]}>
                  <Display size="md" accent={u.accent}>{u.label}</Display>
                  <Body soft small style={{ marginTop: 4 }}>{u.sub}</Body>
                </Pressable>
              ))}
            </Stack>
          </>
        )}

        {step === 3 && (
          <>
            <Display size="xl">Where & a note</Display>
            <Body soft style={{ marginTop: 8 }}>One photo + the area is all we need. The team will call you back.</Body>

            <Card style={{ marginTop: SPACE[6] }}>
              <Kicker>Photo</Kicker>
              {draft.photoUri ? (
                <View style={{ marginTop: 8 }}>
                  <Image source={{ uri: draft.photoUri }} style={S.photoPreview} />
                  <Row gap={SPACE[2]} style={{ marginTop: SPACE[3] }}>
                    <GhostButton onPress={() => pickPhoto(true)}>Retake</GhostButton>
                    <GhostButton onPress={() => setDraft({ ...draft, photoUri: undefined })}>Remove</GhostButton>
                  </Row>
                </View>
              ) : (
                <Row gap={SPACE[2]} style={{ marginTop: SPACE[3] }}>
                  <Pressable onPress={() => pickPhoto(true)} style={S.photoDrop}>
                    <Camera size={22} color={C.rust} />
                    <Body small style={{ fontFamily: F.sansSemi, marginTop: 6 }}>Take photo</Body>
                  </Pressable>
                  <Pressable onPress={() => pickPhoto(false)} style={S.photoDrop}>
                    <Body small style={{ fontSize: 22 }}>🖼️</Body>
                    <Body small style={{ fontFamily: F.sansSemi, marginTop: 6 }}>From library</Body>
                  </Pressable>
                </Row>
              )}
            </Card>

            <Card style={{ marginTop: SPACE[3] }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Kicker>Location</Kicker>
                <Pressable onPress={grabLocation} disabled={busy}>
                  <Row gap={4}><MapPin size={11} color={C.rust} /><Body small style={{ color: C.rust, fontFamily: F.sansSemi }}>Use GPS</Body></Row>
                </Pressable>
              </Row>
              <TextInput
                value={draft.area ?? ''}
                onChangeText={(v) => setDraft({ ...draft, area: v })}
                placeholder="Banjara Hills, near Road no 3"
                placeholderTextColor={C.inkMuted}
                style={S.input}
              />
              {draft.lat && <Body small muted style={{ marginTop: 4, fontFamily: F.sansMedium }}>📍 {draft.lat.toFixed(4)}, {draft.lng?.toFixed(4)}</Body>}
            </Card>

            <Card style={{ marginTop: SPACE[3] }}>
              <Kicker>A note (optional)</Kicker>
              <TextInput
                value={draft.notes ?? ''}
                onChangeText={(v) => setDraft({ ...draft, notes: v })}
                placeholder="Right wing hanging, manja still on it…"
                placeholderTextColor={C.inkMuted}
                multiline
                style={[S.input, { minHeight: 80, textAlignVertical: 'top' }]}
              />
            </Card>

            <PrimaryButton
              onPress={() => {
                if (!draft.area) { Alert.alert('Where?', 'Add the area so the team can find the bird.'); return; }
                submit.mutate();
              }}
              loading={submit.isPending}
              style={{ marginTop: SPACE[6] }}
            >
              <Send size={16} color={C.paper} /> Send to helpline
            </PrimaryButton>

            <Pill style={{ alignSelf: 'center', marginTop: SPACE[4] }}>Anonymous · no account needed</Pill>

            {submit.isError && (
              <Card accent="rust" style={{ marginTop: SPACE[3] }}>
                <Body small style={{ color: C.rust }}>Couldn't send. {(submit.error as Error)?.message}</Body>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE[4], paddingVertical: SPACE[3], gap: SPACE[3] },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, width: 60 },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 60, justifyContent: 'flex-end' },
  progressTrack: { height: 3, backgroundColor: C.cream, marginHorizontal: SPACE[4], borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: C.rust, borderRadius: 2 },
  choiceRow: { backgroundColor: C.paper, borderRadius: RADII.lg, borderWidth: 1, borderColor: C.hairline, padding: SPACE[5], flexDirection: 'row', alignItems: 'center', gap: SPACE[4] },
  choiceTile: { backgroundColor: C.paper, borderRadius: RADII.lg, borderWidth: 1, borderColor: C.hairline, padding: SPACE[5], flexBasis: '47%', flexGrow: 1 },
  choicePressed: { backgroundColor: C.cream, transform: [{ scale: 0.99 }] },
  input: { fontFamily: F.sans, fontSize: 15, color: C.ink, backgroundColor: C.cream, borderRadius: RADII.md, padding: SPACE[3], marginTop: SPACE[3] },
  photoPreview: { width: '100%', aspectRatio: 4 / 3, borderRadius: RADII.md, backgroundColor: C.cream },
  photoDrop: { flex: 1, backgroundColor: C.cream, borderRadius: RADII.md, borderWidth: 1, borderColor: C.hairline, borderStyle: 'dashed', padding: SPACE[5], alignItems: 'center', justifyContent: 'center', minHeight: 100 },
});
