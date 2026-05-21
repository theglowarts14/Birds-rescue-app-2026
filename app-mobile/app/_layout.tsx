import { Stack } from 'expo-router';
import { useFonts, Fraunces_500Medium, Fraunces_500Medium_Italic } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View } from 'react-native';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { C } from '../src/lib/colors';
import { initSentry, Sentry } from '../src/lib/sentry';
import { installTapHandler, registerAndSave } from '../src/lib/push';
import { supabase } from '../src/lib/supabase';

SplashScreen.preventAutoHideAsync();
initSentry();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

function RootLayout() {
  const [loaded] = useFonts({
    Fraunces_500Medium, Fraunces_500Medium_Italic,
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  // Notification tap handler — deep links to /track/[id]
  useEffect(() => {
    const unsubscribe = installTapHandler();
    return unsubscribe;
  }, []);

  // Register push token whenever sign-in happens (and on app launch if already signed in).
  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled || !data.user) return;
      registerAndSave(data.user.id).catch((e) => console.warn('push register failed', e));
    };
    sync();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        registerAndSave(session.user.id).catch((e) => console.warn('push register failed', e));
      }
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  if (!loaded) return <View style={{ flex: 1, backgroundColor: C.paper }} />;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: C.paper },
            animation: 'slide_from_right',
          }}
        />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

export default Sentry.wrap(RootLayout);
