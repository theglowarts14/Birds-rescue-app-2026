import { useEffect, useState } from 'react';
import { ScrollView, View, TextInput, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Phone, LogOut, Heart, MessageCircle, Globe } from 'lucide-react-native';
import { Display, Body, Kicker, Card, PrimaryButton, GhostButton, Stack, Row } from '../../src/components/UI';
import { C, F, RADII, SPACE } from '../../src/lib/colors';
import { supabase, DEFAULT_ORG_SLUG } from '../../src/lib/supabase';
import { getOrgBySlug } from '../../src/lib/queries';
import type { User } from '@supabase/supabase-js';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [phone, setPhone] = useState('+91');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [busy, setBusy] = useState(false);

  const org = useQuery({ queryKey: ['org', DEFAULT_ORG_SLUG], queryFn: () => getOrgBySlug(DEFAULT_ORG_SLUG) });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const sendOtp = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setBusy(false);
    if (error) return Alert.alert('OTP failed', error.message);
    setStep('code');
  };
  const verifyOtp = async () => {
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
    setBusy(false);
    if (error) return Alert.alert('Verify failed', error.message);
    setStep('phone'); setCode('');
  };
  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }}
      contentContainerStyle={{ paddingTop: insets.top + SPACE[4], padding: SPACE[5], paddingBottom: SPACE[12] }}>
      <Kicker>You · {org.data?.public_name ?? org.data?.name ?? 'Karuna'}</Kicker>
      <Display size="xl" style={{ marginTop: SPACE[2] }}>
        Profile <Display size="xl" italic accent="rust">& preferences.</Display>
      </Display>

      {user ? (
        <Card style={{ marginTop: SPACE[6] }}>
          <Kicker>Signed in</Kicker>
          <Display size="md" style={{ marginTop: 4 }}>{user.phone ?? user.email ?? 'Volunteer'}</Display>
          <Body small muted style={{ marginTop: 4, fontFamily: F.sansMedium }}>id: {user.id.slice(0, 8)}…</Body>
          <GhostButton onPress={signOut} style={{ marginTop: SPACE[4] }}>
            <LogOut size={14} color={C.ink} /> Sign out
          </GhostButton>
        </Card>
      ) : (
        <Card style={{ marginTop: SPACE[6] }}>
          <Kicker>Sign in to track rescues</Kicker>
          <Body soft small style={{ marginTop: 6 }}>Phone OTP. Required only to follow your own reports.</Body>
          {step === 'phone' && (
            <Stack gap={SPACE[3]} style={{ marginTop: SPACE[4] }}>
              <TextInput
                value={phone} onChangeText={setPhone}
                keyboardType="phone-pad" placeholder="+91 9XXXXXXXXX"
                placeholderTextColor={C.inkMuted}
                style={{ fontFamily: F.sans, fontSize: 15, color: C.ink, backgroundColor: C.cream, borderRadius: RADII.md, padding: SPACE[3] }}
              />
              <PrimaryButton onPress={sendOtp} loading={busy}>Send OTP</PrimaryButton>
            </Stack>
          )}
          {step === 'code' && (
            <Stack gap={SPACE[3]} style={{ marginTop: SPACE[4] }}>
              <TextInput
                value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad" placeholder="123456"
                placeholderTextColor={C.inkMuted}
                style={{ fontFamily: F.sansMedium, fontSize: 22, color: C.ink, backgroundColor: C.cream, borderRadius: RADII.md, padding: SPACE[3], textAlign: 'center', letterSpacing: 8 }}
                maxLength={6} autoFocus
              />
              <PrimaryButton onPress={verifyOtp} loading={busy} disabled={code.length !== 6}>Verify & continue</PrimaryButton>
              <GhostButton onPress={() => setStep('phone')}>Wrong number?</GhostButton>
            </Stack>
          )}
        </Card>
      )}

      <View style={{ marginTop: SPACE[8] }}>
        <Kicker>Quick actions</Kicker>
        <Stack gap={SPACE[2]} style={{ marginTop: SPACE[3] }}>
          {org.data?.helpline_e164 && (
            <ActionRow icon={<Phone size={18} color={C.rust} />} label="Call helpline" sub={org.data.helpline_e164}
              onPress={() => Linking.openURL(`tel:${org.data!.helpline_e164}`)} />
          )}
          <ActionRow icon={<MessageCircle size={18} color={C.moss} />} label="WhatsApp the team"
            onPress={() => org.data?.helpline_e164 && Linking.openURL(`https://wa.me/${org.data.helpline_e164.replace(/\D/g, '')}`)} />
          <ActionRow icon={<Heart size={18} color={C.amber} />} label="Donate"
            onPress={() => Linking.openURL(`https://karuna.app/${DEFAULT_ORG_SLUG}/donate`)} />
          <ActionRow icon={<Globe size={18} color={C.sky} />} label="Language" sub="English · हिंदी · తెలుగు coming soon" />
        </Stack>
      </View>

      <Body small muted style={{ marginTop: SPACE[10], textAlign: 'center' }}>
        Karuna · v0.1 · {org.data?.tagline ?? 'When wings fall, we answer.'}
      </Body>
    </ScrollView>
  );
}

function ActionRow({ icon, label, sub, onPress }: { icon: React.ReactNode; label: string; sub?: string; onPress?: () => void }) {
  return (
    <GhostButton onPress={onPress} style={{ justifyContent: 'flex-start', paddingHorizontal: SPACE[4] }}>
      <Row style={{ flex: 1 }}>
        {icon}
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <Body style={{ fontFamily: F.sansSemi }}>{label}</Body>
          {sub && <Body small muted>{sub}</Body>}
        </View>
      </Row>
    </GhostButton>
  );
}
