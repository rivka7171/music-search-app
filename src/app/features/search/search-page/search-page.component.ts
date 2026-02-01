import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { startWith } from 'rxjs/operators';
import { MusicListComponent } from '../../../shared/components/music-list/music-list.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { SearchHistoryComponent } from '../../../shared/components/search-history/search-history.component';
import { InfiniteScrollTriggerDirective } from '../../../shared/directives/infinite-scroll-trigger.directive';
import { SearchStore } from '../state/search.store';

@Component({
  selector: 'app-search-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SearchBarComponent,
    SearchHistoryComponent,
    MusicListComponent,
    InfiniteScrollTriggerDirective
  ],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.css'
})
export class SearchPageComponent {
  private readonly store = inject(SearchStore);

  readonly queryControl = new FormControl(this.store.query(), { nonNullable: true });
  private readonly querySignal = toSignal(
    this.queryControl.valueChanges.pipe(startWith(this.queryControl.value)),
    { initialValue: this.queryControl.value }
  );

  readonly vm = computed(() => ({
    items: this.store.filteredItems(),
    resultsCount: this.store.resultsCount(),
    query: this.store.query(),
    uiState: this.store.uiState(),
    errorMessage: this.store.errorMessage(),
    loadMoreErrorMessage: this.store.errorMessageSecondary(),
    loading: this.store.loading(),
    loadingMore: this.store.loadingMore(),
    canLoadMore: this.store.canLoadMore(),
    showLoadMoreButton: this.store.showLoadMoreButton(),
    historyItems: this.store.historyItems(),
    searchType: this.store.searchType(),
    sortKey: this.store.sortKey()
  }));

  readonly searchTypeForUi = computed(() => this.store.searchType());

  constructor() {
    effect(() => {
      this.store.setQuery(this.querySignal());
    });
  }

  setSearchType(type: 'song' | 'album'): void {
    this.store.setSearchType(type);
  }

  setSort(key: string): void {
    const safeKey =
      key === 'none' ||
      key === 'date_desc' ||
      key === 'date_asc' ||
      key === 'name_asc' ||
      key === 'name_desc'
        ? key
        : 'none';
    this.store.setSort(safeKey);
  }

  clearSearch(): void {
    this.queryControl.setValue('');
    this.store.clearResults();
  }

  onHistorySelect(term: string): void {
    this.queryControl.setValue(term);
    this.store.setQuery(term);
    this.store.searchNow();
  }

  onLoadMore(): void {
    this.store.loadMore();
  }

  onLoadMoreRetry(): void {
    this.store.clearLoadMoreError();
    this.store.loadMore();
  }
}
