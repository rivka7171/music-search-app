import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges
} from '@angular/core';

@Directive({
  selector: '[appInfiniteScrollTrigger]',
  standalone: true
})
export class InfiniteScrollTriggerDirective implements AfterViewInit, OnDestroy, OnChanges {
  @Input() enabled = true;
  @Input() loading = false;
  @Input() threshold = 0;
  @Input() rootMargin = '300px';
  @Output() reached = new EventEmitter<void>();

  private observer?: IntersectionObserver;
  private pendingEmit = false;

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) {
          return;
        }

        // Guard against duplicate loads.
        if (!this.enabled || this.loading || this.pendingEmit) {
          return;
        }

        this.pendingEmit = true;
        this.reached.emit();
      },
      {
        root: null,
        rootMargin: this.rootMargin,
        threshold: this.threshold
      }
    );

    this.observer.observe(this.host.nativeElement);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['loading'] && !this.loading) {
      // Ready to emit again once loading finished.
      this.pendingEmit = false;
    }

    if (changes['enabled'] && this.enabled) {
      // New search or re-enabled: allow emitting again.
      this.pendingEmit = false;
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
