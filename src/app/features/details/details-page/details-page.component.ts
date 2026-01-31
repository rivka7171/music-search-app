import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { of } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { ItunesService } from '../../../core/services/itunes.service';
import { MusicItem } from '../../../core/models/music-item';

@Component({
  selector: 'app-details-page',
  standalone: true,
  imports: [CommonModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './details-page.component.html',
  styleUrl: './details-page.component.css'
})
export class DetailsPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly itunes = inject(ItunesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly location = inject(Location);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly currentPreviewId = signal<number | null>(null);
  readonly isPreviewPlaying = signal<boolean>(false);

  private currentAudio: HTMLAudioElement | null = null;

  readonly item = toSignal(
    this.route.paramMap.pipe(
      map((params) => Number(params.get('id'))),
      tap(() => {
        this.loading.set(true);
        this.error.set(null);
      }),
      switchMap((id) => {
        if (!id || Number.isNaN(id)) {
          this.loading.set(false);
          return of(null as MusicItem | null);
        }

        return this.itunes.getDetails(id).pipe(
          catchError(() => {
            this.error.set('אירעה שגיאה בטעינת הנתונים. נסה שוב.');
            return of(null as MusicItem | null);
          }),
          finalize(() => this.loading.set(false))
        );
      })
    ),
    { initialValue: null }
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.stopPreview(true));
  }

  onBack(): void {
    this.location.back();
  }

  togglePreview(item: MusicItem): void {
    if (!item.previewUrl) {
      return;
    }

    const isSameItem = this.currentPreviewId() === item.id;
    if (isSameItem && this.currentAudio) {
      if (this.currentAudio.paused) {
        this.currentAudio.play().then(() => this.isPreviewPlaying.set(true)).catch(() => {
          this.isPreviewPlaying.set(false);
        });
      } else {
        this.currentAudio.pause();
        this.isPreviewPlaying.set(false);
      }
      return;
    }

    this.stopPreview(true);
    const audio = new Audio(item.previewUrl);
    this.currentAudio = audio;
    this.currentPreviewId.set(item.id);
    this.isPreviewPlaying.set(true);

    audio.addEventListener('ended', () => this.stopPreview(true));
    audio.play().catch(() => this.stopPreview(true));
  }

  isSelected(id?: number): boolean {
    return Boolean(id) && this.currentPreviewId() === id;
  }

  private stopPreview(resetTime: boolean): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      if (resetTime) {
        this.currentAudio.currentTime = 0;
      }
      this.currentAudio = null;
    }
    this.currentPreviewId.set(null);
    this.isPreviewPlaying.set(false);
  }
}
