// Push notifications via Expo. Two responsibilities:
//   1. registerForPushAsync() — request permission, obtain an ExponentPushToken,
//      save it to profiles.push_token for the signed-in user. Called on sign-in
//      and on app launch if already signed in.
//   2. setupNotificationHandlers() — install a tap-handler that deep-links
//      tapped notifications to /track/[id]. Installed once at root layout.
//
// Anonymous reporters don't have a profile row, so push doesn't activate for
// them. Sign-in via the Profile tab unlocks status notifications. The Edge
// Function `send-push` looks up profiles.push_token by reporter_id.

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushAsync(): Promise<string | null> {
  if (!Device.isDevice) return null; // simulators can't get tokens

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#c44a1a',
    });
    await Notifications.setNotificationChannelAsync('critical', {
      name: 'Critical rescues',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any).easConfig?.projectId;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return token;
  } catch (e) {
    console.warn('Failed to get push token', e);
    return null;
  }
}

export async function savePushTokenForUser(userId: string, token: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ push_token: token })
    .eq('id', userId);
  if (error) console.warn('savePushTokenForUser failed', error.message);
}

export async function clearPushTokenForUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ push_token: null })
    .eq('id', userId);
  if (error) console.warn('clearPushTokenForUser failed', error.message);
}

/**
 * Convenience: request perms, get token, save for the given user.
 * Returns the token on success, null otherwise. Safe to call repeatedly —
 * Expo returns the same token for a given device unless the app is reinstalled.
 */
export async function registerAndSave(userId: string): Promise<string | null> {
  const token = await registerForPushAsync();
  if (!token) return null;
  await savePushTokenForUser(userId, token);
  return token;
}

/**
 * Install once at root: deep-link tapped notifications to /track/[id].
 * Returns an unsubscribe function.
 */
export function installTapHandler(): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as
      | { case_id?: string; short_id?: string }
      | undefined;
    if (data?.case_id) {
      router.push(`/track/${data.case_id}`);
    }
  });
  return () => sub.remove();
}
