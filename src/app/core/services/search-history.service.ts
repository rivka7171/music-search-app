import { computed, Injectable, signal, Signal } from '@angular/core';

export interface SearchHistoryItem {
  term: string;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class SearchHistoryService {
  private readonly storageKey = 'itunes.searchHistory';
  private readonly itemsSignal = signal<SearchHistoryItem[]>(this.load());

  readonly items = computed(() => this.itemsSignal());

  history(): Signal<SearchHistoryItem[]> {
    return this.items;
  }

  add(term: string): void {
    const trimmed = term.trim();
    if (!trimmed) {
      return;
    }

    const normalized = trimmed.toLowerCase();
    const filtered = this.itemsSignal().filter(
      (item) => item.term.toLowerCase() !== normalized
    );

    const updated = [{ term: trimmed, timestamp: Date.now() }, ...filtered].slice(0, 5);
    this.itemsSignal.set(updated);
    this.save(updated);
  }

  clear(): void {
    this.itemsSignal.set([]);
    this.save([]);
  }

  formatRelativeTime(timestamp: number): string {
    const diffMs = Date.now() - timestamp;
    const seconds = Math.floor(diffMs / 1000);

    if (seconds < 45) {
      return 'עכשיו';
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `לפני ${minutes} דקות`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `לפני ${hours} שעות`;
    }

    const days = Math.floor(hours / 24);
    return `לפני ${days} ימים`;
  }

  private load(): SearchHistoryItem[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as SearchHistoryItem[];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter((item) => typeof item?.term === 'string');
    } catch {
      return [];
    }
  }

  private save(items: SearchHistoryItem[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }
}
