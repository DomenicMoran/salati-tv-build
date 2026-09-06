import { NativeModules, Platform } from 'react-native';

import { checkExactAlarmPermission } from '@/lib/exactAlarm';

/** Platform.OS ist in RN ein Getter — temporaer per defineProperty ersetzen
 *  (gleiches Muster wie apps/mobile/.../exact-alarm.test.ts). */
async function withPlatformOs(os: typeof Platform.OS, fn: () => Promise<void>) {
  const original = Object.getOwnPropertyDescriptor(Platform, 'OS')!;
  Object.defineProperty(Platform, 'OS', { configurable: true, get: () => os });
  try {
    await fn();
  } finally {
    Object.defineProperty(Platform, 'OS', original);
  }
}

describe('checkExactAlarmPermission', () => {
  afterEach(() => {
    delete (NativeModules as Record<string, unknown>).AdhanAlarmScheduler;
  });

  it('liefert null auf iOS/tvOS (Beschraenkung existiert dort nicht)', async () => {
    await withPlatformOs('ios', async () => {
      expect(await checkExactAlarmPermission()).toBeNull();
    });
  });

  it('liefert null auf web', async () => {
    await withPlatformOs('web', async () => {
      expect(await checkExactAlarmPermission()).toBeNull();
    });
  });

  it('liefert null auf android ohne verlinktes natives Modul', async () => {
    await withPlatformOs('android', async () => {
      expect(await checkExactAlarmPermission()).toBeNull();
    });
  });

  it('liefert das native Ergebnis unveraendert, wenn die Berechtigung erteilt ist', async () => {
    (NativeModules as Record<string, unknown>).AdhanAlarmScheduler = {
      canScheduleExactAlarms: jest.fn().mockResolvedValue(true),
    };
    await withPlatformOs('android', async () => {
      expect(await checkExactAlarmPermission()).toBe(true);
    });
  });

  it('liefert das native Ergebnis unveraendert, wenn die Berechtigung verweigert ist', async () => {
    (NativeModules as Record<string, unknown>).AdhanAlarmScheduler = {
      canScheduleExactAlarms: jest.fn().mockResolvedValue(false),
    };
    await withPlatformOs('android', async () => {
      expect(await checkExactAlarmPermission()).toBe(false);
    });
  });

  it('liefert null statt zu werfen, wenn der native Aufruf fehlschlaegt', async () => {
    (NativeModules as Record<string, unknown>).AdhanAlarmScheduler = {
      canScheduleExactAlarms: jest.fn().mockRejectedValue(new Error('boom')),
    };
    await withPlatformOs('android', async () => {
      expect(await checkExactAlarmPermission()).toBeNull();
    });
  });
});
