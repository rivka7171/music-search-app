import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MusicItem } from '../models/music-item';
import { LocalizationService } from './localization.service';

interface ItunesSearchResponse {
  resultCount: number;
  results: ItunesResult[];
}

interface ItunesResult {
  wrapperType?: string;
  kind?: string;
  trackId?: number;
  trackName?: string;
  collectionId?: number;
  collectionName?: string;
  collectionType?: string;
  trackCount?: number;
  artistName?: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
  artworkUrl30?: string;
  releaseDate?: string;
  collectionReleaseDate?: string;
  primaryGenreName?: string;
  shortDescription?: string;
  longDescription?: string;
  description?: string;
  previewUrl?: string;
}

export interface ItunesSearchMeta {
  items: MusicItem[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ItunesService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiBase;
  private readonly localization = inject(LocalizationService);

  searchSongs(query: string, limit = 25, offset = 0): Observable<MusicItem[]> {
    return this.search(query, 'song', limit, offset);
  }

  searchAlbums(query: string, limit = 25, offset = 0): Observable<MusicItem[]> {
    return this.search(query, 'album', limit, offset);
  }

  searchSongsWithMeta(query: string, limit = 25, offset = 0): Observable<ItunesSearchMeta> {
    return this.searchWithMeta(query, 'song', limit, offset);
  }

  searchAlbumsWithMeta(query: string, limit = 25, offset = 0): Observable<ItunesSearchMeta> {
    return this.searchWithMeta(query, 'album', limit, offset);
  }

  getDetails(id: number): Observable<MusicItem | null> {
    const url = this.buildUrl('/lookup', { id: id.toString() });
    return this.http
      .jsonp<ItunesSearchResponse>(url, 'callback')
      .pipe(map((response) => this.transformResults(response)[0] ?? null));
  }

  search(
    query: string,
    entity: 'song' | 'album',
    limit = 25,
    offset = 0
  ): Observable<MusicItem[]> {
    return this.searchWithMeta(query, entity, limit, offset).pipe(map((response) => response.items));
  }

  private searchWithMeta(
    query: string,
    entity: 'song' | 'album',
    limit = 25,
    offset = 0
  ): Observable<ItunesSearchMeta> {
    const url = this.buildUrl('/search', {
      term: query,
      entity,
      limit: limit.toString(),
      offset: offset.toString()
    });
    return this.http
      .jsonp<ItunesSearchResponse>(url, 'callback')
      .pipe(
        map((response) => ({
          items: this.transformResults(response, entity),
          total: response.resultCount ?? 0
        }))
      );
  }

  private transformResults(
    response: ItunesSearchResponse,
    expected: 'song' | 'album' | 'any' = 'any'
  ): MusicItem[] {
    const filtered =
      expected === 'album'
        ? response.results.filter(
            (result) =>
              result.wrapperType === 'collection' &&
              result.collectionType === 'Album' &&
              (result.trackCount ?? 0) >= 6
          )
        : response.results;

    return filtered
      .map((result) => this.mapResult(result, expected))
      .filter((item): item is MusicItem => item !== null);
  }

  private mapResult(
    result: ItunesResult,
    expected: 'song' | 'album' | 'any'
  ): MusicItem | null {
    if (expected === 'album') {
      return this.mapAlbumResult(result);
    }
    if (expected === 'song') {
      return this.mapSongResult(result);
    }
    return this.mapSongResult(result) ?? this.mapAlbumResult(result);
  }

  private mapAlbumResult(result: ItunesResult): MusicItem | null {
    const isAlbum =
      result.wrapperType === 'collection' &&
      result.collectionType === 'Album' &&
      typeof result.collectionId === 'number' &&
      Boolean(result.collectionName);

    if (!isAlbum) {
      return null;
    }

    const imageUrl = this.upscaleArtwork(
      result.artworkUrl100 ?? result.artworkUrl60 ?? result.artworkUrl30
    );

    return {
      id: result.collectionId!,
      name: result.collectionName!,
      type: 'album',
      artist: this.localization.getHebrewArtistName(result.artistName) ?? 'אמן לא ידוע',
      description: result.longDescription ?? result.shortDescription ?? result.description,
      imageUrl,
      releaseDate: result.collectionReleaseDate ?? result.releaseDate ?? '',
      collectionName: result.collectionName,
      genre: this.localization.getHebrewGenre(result.primaryGenreName)
    };
  }

  private mapSongResult(result: ItunesResult): MusicItem | null {
    const isSong =
      result.wrapperType === 'track' &&
      typeof result.trackId === 'number' &&
      Boolean(result.trackName);

    if (!isSong) {
      return null;
    }

    const imageUrl = this.upscaleArtwork(
      result.artworkUrl100 ?? result.artworkUrl60 ?? result.artworkUrl30
    );

    return {
      id: result.trackId!,
      name: result.trackName!,
      type: 'song',
      artist: this.localization.getHebrewArtistName(result.artistName) ?? 'אמן לא ידוע',
      description: result.longDescription ?? result.shortDescription ?? result.description,
      imageUrl,
      releaseDate: result.releaseDate ?? '',
      collectionName: result.collectionName,
      genre: this.localization.getHebrewGenre(result.primaryGenreName),
      previewUrl: result.previewUrl
    };
  }

  private upscaleArtwork(url?: string): string {
    if (!url) {
      return '';
    }

    return url.replace('100x100', '500x500');
  }

  private buildUrl(path: string, params: Record<string, string>): string {
    const search = new URLSearchParams(params);
    return `${this.apiBase}${path}?${search.toString()}`;
  }
}
