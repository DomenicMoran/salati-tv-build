import raw from './release-policy.json';

export interface AudiobookReleasePolicy {
  blockedPflichtwissenLocales: string[];
  blockedGrammarLocales: string[];
}

/** Gebündelte Freigabeliste — JSON bleibt editierbar, Typ kommt hierher. */
export const releasePolicy = raw as AudiobookReleasePolicy;
