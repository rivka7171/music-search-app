import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LocalizationService {
  private readonly genreMap = new Map<string, string>([
    ['pop', 'פופ'],
    ['rock', 'רוק'],
    ['hip-hop/rap', 'היפ הופ/ראפ'],
    ['hip hop/rap', 'היפ הופ/ראפ'],
    ['hip-hop', 'היפ הופ'],
    ['rap', 'ראפ'],
    ['dance', 'דאנס'],
    ['electronic', 'אלקטרוני'],
    ['r&b/soul', 'אר אנד בי/סול'],
    ['r&b', 'אר אנד בי'],
    ['soul', 'סול'],
    ['jazz', 'ג׳אז'],
    ['classical', 'קלאסי'],
    ['country', 'קאנטרי'],
    ['alternative', 'אלטרנטיבי'],
    ['metal', 'מטאל'],
    ['indie', 'אינדי'],
    ['soundtrack', 'פסקול'],
    ['reggae', 'רגאיי'],
    ['latin', 'לטיני'],
    ['folk', 'פולק'],
    ['blues', 'בלוז'],
    ['world', 'עולמי']
  ]);

  private readonly artistMap = new Map<string, string>([
    // Add manual overrides as needed, for example:
    // ['eden harel', 'עדן הראל']
  ]);

  getHebrewGenre(genre?: string): string | undefined {
    if (!genre) {
      return undefined;
    }

    const normalized = genre.trim().toLowerCase();
    return this.genreMap.get(normalized) ?? genre;
  }

  getHebrewArtistName(artist?: string): string | undefined {
    if (!artist) {
      return undefined;
    }

    if (this.containsHebrew(artist)) {
      return artist;
    }

    const normalized = artist.trim().toLowerCase();
    return this.artistMap.get(normalized) ?? artist;
  }

  private containsHebrew(value: string): boolean {
    return /[\u0590-\u05FF]/.test(value);
  }

}
