import { ScrollView, View, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BookOpen, Bell } from 'lucide-react-native';
import { Display, Body, Kicker, Card } from '../../src/components/UI';
import { C, F, SPACE } from '../../src/lib/colors';
import { listSpecies, listFestivalAlerts } from '../../src/lib/queries';

export default function GuideScreen() {
  const insets = useSafeAreaInsets();
  const species = useQuery({ queryKey: ['species'], queryFn: listSpecies });
  const alerts  = useQuery({ queryKey: ['festivals'], queryFn: listFestivalAlerts });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }}
      contentContainerStyle={{ paddingTop: insets.top + SPACE[4], padding: SPACE[5], paddingBottom: SPACE[12] }}
      refreshControl={
        <RefreshControl
          refreshing={(species.isFetching && !species.isLoading) || (alerts.isFetching && !alerts.isLoading)}
          onRefresh={() => { species.refetch(); alerts.refetch(); }}
          tintColor={C.inkSoft}
        />
      }>
      <Kicker>Field guide</Kicker>
      <Display size="xl" style={{ marginTop: SPACE[2] }}>
        First aid <Display size="xl" italic accent="moss">before help arrives.</Display>
      </Display>
      <Body soft style={{ marginTop: SPACE[3], maxWidth: 480 }}>
        Knowledge from 2,000+ rescues. What to do — and what not to.
      </Body>

      {alerts.data && alerts.data.length > 0 && (
        <View style={{ marginTop: SPACE[6] }}>
          <Kicker style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Bell size={11} color={C.inkMuted} /> Active alerts
          </Kicker>
          <View style={{ gap: SPACE[2], marginTop: SPACE[3] }}>
            {alerts.data.map((f: any) => (
              <Card key={f.id} accent={f.severity === 'critical' ? 'rust' : 'amber'}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACE[2] }}>
                  <AlertTriangle size={14} color={f.severity === 'critical' ? C.rust : C.amber} />
                  <Display size="md">{f.title}</Display>
                </View>
                <Body small soft style={{ marginTop: 6 }}>{f.detail}</Body>
              </Card>
            ))}
          </View>
        </View>
      )}

      <View style={{ marginTop: SPACE[8] }}>
        <Kicker style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <BookOpen size={11} color={C.inkMuted} /> Birds you'll meet first
        </Kicker>
        <View style={{ gap: SPACE[3], marginTop: SPACE[3] }}>
          {!species.isLoading && (species.data?.length ?? 0) === 0 && (
            <Card><Body small soft>Field guide is being prepared. Check back soon.</Body></Card>
          )}
          {species.data?.map((s: any) => (
            <Card key={s.id}>
              <View style={{ flexDirection: 'row', gap: SPACE[3] }}>
                <Body style={{ fontSize: 36 }}>{s.emoji}</Body>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Display size="md" italic>{s.common_name}</Display>
                  <Body small muted style={{ marginTop: 2 }}>{s.habitat}</Body>
                  {s.common_injury && (
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: SPACE[2] }}>
                      <AlertTriangle size={10} color={C.rust} style={{ marginTop: 4 }} />
                      <Body small style={{ color: C.rust, flex: 1, fontFamily: F.sansMedium }}>{s.common_injury}</Body>
                    </View>
                  )}
                  {s.first_aid && <Body small soft style={{ marginTop: SPACE[2] }}>{s.first_aid}</Body>}
                  {s.is_wildlife && (
                    <Body small style={{ color: C.moss, fontFamily: F.sansMedium, marginTop: SPACE[2], fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
                      Wildlife · do not handle barehand
                    </Body>
                  )}
                </View>
              </View>
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
