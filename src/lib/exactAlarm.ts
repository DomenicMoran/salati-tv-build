import { Linking, NativeModules, Platform } from 'react-native';

// JS-Seite der Exact-Alarm-Statusabfrage — analog zu
// apps/mobile/src/features/prayer-times/exact-alarm.ts, hier aber an das
// bereits registrierte `AdhanAlarmScheduler`-Modul angehaengt (s.
// plugins/adhan-native/AdhanAlarmModule.kt) statt an ein eigenes Modul: die
// Zeitplanung und die Statusabfrage betreffen denselben AlarmManager-Aufruf.
//
// DER FUND (Geraetebefund 2026-09-06, Emulator salati_tv_36 / Android 16,
// echtes Android-TV-Image "sdk_google_atv64_x86_64"): trotz
// SCHEDULE_EXACT_ALARM im Manifest (with-adhan-alarm.js) liefert
// `canScheduleExactAlarms()` auf diesem Geraet `false` — Android TV hat
// dieselbe "Alarme & Erinnerungen"-Spezialberechtigung wie ein Handy
// (com.android.tv.settings/.device.apps.specialaccess.AlarmsAndRemindersActivity,
// per Screenshot verifiziert: "Salati TV — Not allowed"). Die Beschraenkung
// aus Android 12/13 gilt hier unveraendert, NICHT nur auf Handys. Ohne die
// Berechtigung faellt der native Alarm (AdhanAlarmScheduler.scheduleNext in
// AdhanAlarmReceiver.kt) auf `setAndAllowWhileIdle` zurueck — gemessen als
// ein volles Stunden-Fenster (`dumpsys alarm`: window=+1h0m0s0ms) statt eines
// exakten Zeitpunkts. Das ist die Kernursache der Verspaetung im
// Hintergrund, nicht nur ein Rand-Detail.
const NATIVE_MODULE_NAME = 'AdhanAlarmScheduler';

interface AdhanAlarmNativeModul {
  canScheduleExactAlarms?: () => Promise<boolean>;
}

/**
 * true/false = Status vom nativen AlarmManager bekannt (nur Android, ab API
 * 31 ueberhaupt relevant). `null` auf iOS/tvOS (kein Aequivalent, s. Memory
 * project_salati_tv_adhan_architektur) oder wenn das native Modul fehlt
 * (kein Build mit dem Plugin) — Aufrufer behandeln `null` als "keine Aussage
 * moeglich", NICHT als "nicht erlaubt".
 */
export async function checkExactAlarmPermission(): Promise<boolean | null> {
  if (Platform.OS !== 'android') return null;
  const native = (NativeModules as Record<string, AdhanAlarmNativeModul | undefined>)[NATIVE_MODULE_NAME];
  if (!native?.canScheduleExactAlarms) return null;
  try {
    return await native.canScheduleExactAlarms();
  } catch {
    return null;
  }
}

/**
 * Oeffnet die System-Seite „Alarme & Erinnerungen" fuer diese App. Wie auf
 * dem Handy (exact-alarm.ts) gibt es dafuer keinen In-App-Dialog: die
 * Berechtigung ist nur ueber die Systemeinstellungen zu erteilen. Auf
 * Android TV fuehrt derselbe Intent zu derselben Spezialberechtigungs-Seite
 * (com.android.tv.settings), nur mit dem TV-Seitenmenue-Layout statt der
 * Handy-Optik — per Emulator bestaetigt.
 */
export async function openExactAlarmSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Linking.sendIntent('android.settings.REQUEST_SCHEDULE_EXACT_ALARM').catch(() => {});
}
