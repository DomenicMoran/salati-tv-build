import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  AUDIO_PROGRESS_STORAGE_KEY,
  flushAudioProgressNow,
  loadAudioProgressEntry,
  podcastProgressId,
  quranListenProgressId,
  saveAudioProgress,
} from '@/lib/audioProgress';

describe('audioProgress (TV)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('speichert Podcast-Position unter Mobile-Key', async () => {
    const id = podcastProgressId(7);
    await saveAudioProgress({
      kind: 'podcast',
      id,
      positionSec: 120,
      durationSec: 600,
      meta: { episodeNo: 7 },
    });
    await flushAudioProgressNow();
    const entry = await loadAudioProgressEntry(id);
    expect(entry?.positionSec).toBe(120);
    const raw = await AsyncStorage.getItem(AUDIO_PROGRESS_STORAGE_KEY);
    expect(raw).toContain('podcast:7');
  });

  it('speichert Koran-Lesen mit Vers-Metadaten', async () => {
    const id = quranListenProgressId(2, 'ar.alafasy');
    await saveAudioProgress({
      kind: 'quran-listen',
      id,
      positionSec: 9,
      durationSec: 40,
      meta: { surah: 2, ayah: 5, reciter: 'ar.alafasy' },
    });
    const entry = await loadAudioProgressEntry(id);
    expect(entry?.meta?.ayah).toBe(5);
  });
});
