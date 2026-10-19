import Constants from 'expo-constants';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import api from './api';

const LOCATION_TASK = 'ncode-field-location-task';

// Expo Go can't run background location tasks, so there we track only while the app is open.
// ponytail: foreground-only in Expo Go; use a development build for real background tracking.
const inExpoGo = Constants.executionEnvironment === 'storeClient';
let watcher: Location.LocationSubscription | null = null;

async function postPoint(c: Location.LocationObjectCoords) {
  try {
    await api.post('/locations/', { latitude: c.latitude, longitude: c.longitude, accuracy: c.accuracy });
  } catch {
    // Offline or no active session server-side — point is dropped.
  }
}

// Reports a tracking problem to the backend. Requires an active punch-in session server-side,
// so failures (offline, no session) are swallowed silently — same spirit as the GPS point drop below.
async function reportTrackingEvent(eventType: 'LOCATION_UNAVAILABLE' | 'LOCATION_PERMISSION_DENIED', metadata?: object) {
  try {
    await api.post('/tracking/events/', { event_type: eventType, metadata: metadata ?? {} });
  } catch {
    // ignore
  }
}

// Must be defined at module scope — this runs even when the app is backgrounded/killed-and-restarted.
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    const isPermissionError = error.message?.toLowerCase().includes('permission');
    await reportTrackingEvent(
      isPermissionError ? 'LOCATION_PERMISSION_DENIED' : 'LOCATION_UNAVAILABLE',
      { message: error.message, code: error.code },
    );
    return;
  }
  const { locations } = (data as { locations: Location.LocationObject[] }) ?? { locations: [] };
  const latest = locations?.[locations.length - 1];
  if (!latest) return;
  try {
    await api.post('/locations/', {
      latitude: latest.coords.latitude,
      longitude: latest.coords.longitude,
      accuracy: latest.coords.accuracy,
    });
  } catch {
    // Offline or no active session server-side — point is dropped, matching the web client's known limits.
  }
});

export async function requestTrackingPermissions(): Promise<{ granted: boolean; reason?: string }> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return { granted: false, reason: 'Location permission denied.' };

  if (inExpoGo) return { granted: true };

  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== 'granted') {
    return { granted: false, reason: 'Background location permission denied — tracking would stop when the app is minimized.' };
  }
  return { granted: true };
}

export async function startTracking() {
  if (inExpoGo) {
    watcher ??= await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 30000, distanceInterval: 25 },
      (p) => postPoint(p.coords),
    );
    return;
  }
  const already = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (already) return;
  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 30000,
    distanceInterval: 25,
    foregroundService: {
      notificationTitle: 'Attendance tracking active',
      notificationBody: 'Ncode Field is recording your location for your current session.',
    },
  });
}

export async function stopTracking() {
  if (inExpoGo) {
    watcher?.remove();
    watcher = null;
    return;
  }
  const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (started) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
}

export async function isTracking() {
  if (inExpoGo) return watcher !== null;
  return Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
}

export async function getCurrentPoint() {
  const fg = await Location.getForegroundPermissionsAsync();
  if (!fg.granted) {
    await reportTrackingEvent('LOCATION_PERMISSION_DENIED', { status: fg.status });
    throw new Error('Location permission is no longer granted.');
  }
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy };
}
