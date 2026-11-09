import { useEffect, useState } from 'react';

import { ladeMorphologie } from '@/lib/morphologie';
import type { MorphologieDatei } from '@/lib/morphologieTypen';

export interface MorphologieStand {
  laedt: boolean;
  fehler: boolean;
  datei: MorphologieDatei | null;
}

const LEER: MorphologieStand = { laedt: false, fehler: false, datei: null };

export function useMorphologieSurah(surah: number, aktiv: boolean): MorphologieStand {
  const sollLaden = aktiv && surah >= 1;
  const [stand, setStand] = useState<MorphologieStand>(LEER);
  const [ladeSchluessel, setLadeSchluessel] = useState<{ surah: number; aktiv: boolean }>({
    surah,
    aktiv: sollLaden,
  });

  if (ladeSchluessel.surah !== surah || ladeSchluessel.aktiv !== sollLaden) {
    setLadeSchluessel({ surah, aktiv: sollLaden });
    if (sollLaden) {
      setStand({ laedt: true, fehler: false, datei: null });
    }
  }

  useEffect(() => {
    if (!sollLaden) return;
    let abgebrochen = false;
    void ladeMorphologie(surah)
      .then((datei) => {
        if (!abgebrochen) setStand({ laedt: false, fehler: false, datei });
      })
      .catch(() => {
        if (!abgebrochen) setStand({ laedt: false, fehler: true, datei: null });
      });
    return () => {
      abgebrochen = true;
    };
  }, [surah, sollLaden]);

  if (!sollLaden) return LEER;
  return stand;
}
