package de.salatibox.tv.alarm

import android.app.AlarmManager
import android.content.Context
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray

/**
 * JS-Bruecke zum nativen Adhan-Alarm (s. AdhanAlarmReceiver.kt fuer das
 * Warum). JS kennt die Gebetszeiten-Berechnung (Standort, Methode, Madhab,
 * Korrekturen - alles Einstellungen) und die Sound-Wahl je Gebet, nativ kennt
 * nur "wann" und "welche der drei Aufnahmen".
 *
 * Aufrufer: apps/tv/src/lib/azanRuf.ts - dieselbe Datei, die schon den
 * Vordergrund-Pfad (Banner + sofortige Wiedergabe bei offener App) haelt.
 */
class AdhanAlarmModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "AdhanAlarmScheduler"

  /**
   * Uebernimmt den kompletten Plan (naechste ~7 Tage x 5 Gebete) und stellt
   * den naechsten aktiven Alarm. Drei gleich lange Arrays statt einer Liste
   * von Objekten - einfacher ueber die Bridge zu reichen.
   */
  @ReactMethod
  fun setSchedule(timestampsMs: ReadableArray, prayerKeys: ReadableArray, soundKeys: ReadableArray, promise: Promise) {
    try {
      val n = minOf(timestampsMs.size(), prayerKeys.size(), soundKeys.size())
      val ts = ArrayList<Long>(n)
      val pk = ArrayList<String>(n)
      val sk = ArrayList<String>(n)
      for (i in 0 until n) {
        val v = timestampsMs.getDouble(i)
        if (v <= 0) continue
        ts.add(v.toLong())
        pk.add(prayerKeys.getString(i) ?: "")
        sk.add(soundKeys.getString(i) ?: "aus")
      }
      AdhanAlarmScheduler.store(reactContext, ts, pk, sk)
      AdhanAlarmScheduler.scheduleNext(reactContext)
      promise.resolve(ts.size)
    } catch (e: Exception) {
      promise.reject("ERR_ADHAN_ALARM", e)
    }
  }

  @ReactMethod
  fun cancel(promise: Promise) {
    try {
      AdhanAlarmScheduler.cancel(reactContext)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("ERR_ADHAN_ALARM", e)
    }
  }

  /**
   * Status der SCHEDULE_EXACT_ALARM-Berechtigung — s. src/lib/exactAlarm.ts
   * fuer den vollen Root-Cause-Kontext (Geraetebefund 2026-09-06: Android TV
   * verweigert sie GENAUSO wie ein Handy, trotz Manifest-Eintrag). Vor
   * Android 12 (API 31) gibt es die Sonderberechtigung nicht - dort planten
   * exakte Alarme schon immer ohne sie, daher `true`.
   */
  @ReactMethod
  fun canScheduleExactAlarms(promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
        promise.resolve(true)
        return
      }
      val alarmManager = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      promise.resolve(alarmManager.canScheduleExactAlarms())
    } catch (e: Exception) {
      promise.reject("ERR_ADHAN_ALARM", e)
    }
  }
}
