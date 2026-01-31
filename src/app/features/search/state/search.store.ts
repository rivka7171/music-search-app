import { DestroyRef, Injectable, Signal, computed, effect, inject, signal } from '@angular/core';
import { toObservable, toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, Observable } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  switchMap,
  tap,
  filter
} from 'rxjs/operators';
import { MusicItem } from '../../../core/models/music-item';
import { ItunesService } from '../../../core/services/itunes.service';
import { SearchHistoryService } from '../../../core/services/search-history.service';

type SearchType = 'song' | 'album' | 'both';
type UiState = 'idle' | 'loading' | 'error' | 'empty' | 'ready';
type SortKey = 'none' | 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc';
type SearchRequest = {
  query: string;
  type: SearchType;
  offset: number;
  append: boolean;
};

@Injectable({ providedIn: 'root' })
export class SearchStore {
  private readonly itunes = inject(ItunesService);
  private readonly historyService = inject(SearchHistoryService);
  private readonly destroyRef = inject(DestroyRef);

  readonly query = signal<string>('');
  readonly searchType = signal<SearchType>('song');
  readonly loading = signal<boolean>(false);
  readonly loadingMore = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly errorMessageSecondary = signal<string | null>(null);
  readonly items = signal<MusicItem[]>([]);
  readonly sortKey = signal<SortKey>('none');
  readonly pageSize = signal<number>(25);
  readonly offset = signal<number>(0);
  readonly canLoadMore = signal<boolean>(true);
  readonly lastBatchSize = signal<number>(0);

  readonly filteredItems = computed(() => this.sortItems(this.items(), this.sortKey()));
  readonly resultsCount = computed(() => this.items().length);
  readonly hasResults = computed(() => this.items().length > 0);
  readonly hasError = computed(() => Boolean(this.errorMessage()));
  readonly lastQueryKey = computed(() => `${this.query().trim()}|${this.searchType()}`);
  readonly isEmpty = computed(() => {
    const trimmed = this.query().trim();
    return Boolean(trimmed) && !this.loading() && !this.errorMessage() && this.items().length === 0;
  });
  readonly isInitialLoading = computed(() => this.loading() && this.offset() === 0);
  readonly isLoadingMore = computed(() => this.loadingMore());
  readonly uiState: Signal<UiState> = computed(() => {
    const trimmed = this.query().trim();
    if (!trimmed) {
      return 'idle';
    }
    if (this.isInitialLoading()) {
      return 'loading';
    }
    if (this.errorMessage()) {
      return 'error';
    }
    if (this.items().length === 0) {
      return 'empty';
    }
    return 'ready';
  });
  readonly showLoadMoreButton = computed(
    () => this.uiState() === 'ready' && this.canLoadMore()
  );

  readonly historyItems = this.historyService.history();

  private readonly debouncedQuery = toSignal(
    toObservable(this.query).pipe(
      map((value) => value.trim()),
      debounceTime(500),
      distinctUntilChanged()
    ),
    { initialValue: '' }
  );
  private readonly searchRequest = signal<SearchRequest | null>(null);

  constructor() {
    effect(() => {
      this.errorMessage();
      if (this.query().trim() === '') {
        this.clearResults();
      }
    });

    effect(() => {
      const query = this.debouncedQuery();
      this.searchType();
      if (!query) {
        return;
      }
      this.searchNow(true);
    });

    toObservable(this.searchRequest)
      .pipe(
        filter((request): request is SearchRequest => request !== null),
        switchMap((request) => {
          const { query, type, offset, append } = request;
          if (!query) {
            return of([] as MusicItem[]);
          }

          if (append) {
            this.loadingMore.set(true);
            this.errorMessageSecondary.set(null);
          } else {
            this.loading.set(true);
            this.errorMessage.set(null);
          }

          return this.searchByType(query, type, offset).pipe(
            tap((items) => {
              const pageSize = this.pageSize();
              const rawItems = this.dedupeById(items);
              const pageSlice = rawItems.slice(offset, offset + pageSize);
              const batchCount = pageSlice.length;
              this.lastBatchSize.set(batchCount);

              if (append) {
                this.items.set(this.dedupeById([...this.items(), ...pageSlice]));
                this.offset.set(offset + batchCount);
              } else {
                this.items.set(rawItems.slice(0, pageSize));
                this.offset.set(Math.min(pageSize, rawItems.length));
              }

              this.updateCanLoadMore(batchCount, type);

              if (!append && query.length >= 2 && rawItems.length > 0) {
                this.historyService.add(query);
              }
            }),
            catchError(() => {
              if (append) {
                this.errorMessageSecondary.set('לא ניתן לטעון עוד תוצאות כרגע.');
              } else {
                this.items.set([]);
                this.errorMessage.set('אירעה שגיאה בטעינת הנתונים. נסה שוב.');
              }
              return of([] as MusicItem[]);
            }),
            finalize(() => {
              if (append) {
                this.loadingMore.set(false);
              } else {
                this.loading.set(false);
              }
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  setQuery(query: string): void {
    const trimmed = query.trim();
    if (trimmed === this.query()) {
      return;
    }
    this.query.set(trimmed);
  }

  setSearchType(type: SearchType): void {
    this.searchType.set(type);
  }

  setSort(key: SortKey): void {
    this.sortKey.set(key);
  }

  searchNow(reset = true): void {
    if (reset) {
      this.offset.set(0);
      this.items.set([]);
      this.canLoadMore.set(true);
      this.errorMessageSecondary.set(null);
    }

    this.searchRequest.set({
      query: this.query().trim(),
      type: this.searchType(),
      offset: reset ? 0 : this.offset(),
      append: false
    });
  }

  retry(): void {
    if (this.items().length > 0) {
      this.searchRequest.set({
        query: this.query().trim(),
        type: this.searchType(),
        offset: this.offset(),
        append: this.offset() > 0
      });
    } else {
      this.searchNow(true);
    }
  }

  clearError(): void {
    this.errorMessage.set(null);
  }

  clearLoadMoreError(): void {
    this.errorMessageSecondary.set(null);
  }

  clearResults(): void {
    this.items.set([]);
    this.loading.set(false);
    this.errorMessage.set(null);
    this.loadingMore.set(false);
    this.errorMessageSecondary.set(null);
    this.offset.set(0);
    this.canLoadMore.set(true);
  }

  loadMore(): void {
    if (this.loading() || this.loadingMore() || !this.canLoadMore()) {
      return;
    }

    const nextOffset = this.offset();
    this.searchRequest.set({
      query: this.query().trim(),
      type: this.searchType(),
      offset: nextOffset,
      append: true
    });
  }

  private searchByType(query: string, type: SearchType, offset: number): Observable<MusicItem[]> {
    const limit = offset + this.pageSize();

    if (type === 'song') {
      return this.itunes.searchSongs(query, limit, 0);
    }

    if (type === 'album') {
      return this.itunes.searchAlbums(query, limit, 0);
    }

    return forkJoin({
      songs: this.itunes.searchSongs(query, limit, 0),
      albums: this.itunes.searchAlbums(query, limit, 0)
    }).pipe(map(({ songs, albums }) => [...songs, ...albums]));
  }

  private updateCanLoadMore(batchSize: number, type: SearchType): void {
    const expected = type === 'both' ? this.pageSize() * 2 : this.pageSize();
    this.canLoadMore.set(batchSize >= expected);
  }

  private dedupeById(items: MusicItem[]): MusicItem[] {
    const seen = new Set<number>();
    const unique: MusicItem[] = [];
    for (const item of items) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        unique.push(item);
      }
    }
    return unique;
  }

  private sortItems(items: MusicItem[], key: SortKey): MusicItem[] {
    if (key === 'none') {
      return items;
    }

    const sorted = [...items];

    if (key === 'name_asc' || key === 'name_desc') {
      sorted.sort((a, b) => {
        const result = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        return key === 'name_asc' ? result : -result;
      });
      return sorted;
    }

    sorted.sort((a, b) => {
      const aTime = a.releaseDate ? Date.parse(a.releaseDate) : Number.NEGATIVE_INFINITY;
      const bTime = b.releaseDate ? Date.parse(b.releaseDate) : Number.NEGATIVE_INFINITY;
      const result = aTime - bTime;
      return key === 'date_asc' ? result : -result;
    });
    return sorted;
  }
}
