import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MusicItem } from '../../../core/models/music-item';
import { MusicCardComponent } from '../music-card/music-card.component';

@Component({
  selector: 'app-music-list',
  standalone: true,
  imports: [CommonModule, MusicCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './music-list.component.html',
  styleUrl: './music-list.component.css'
})
export class MusicListComponent {
  @Input({ required: true }) items: MusicItem[] = [];
  @Input({ required: true }) query = '';
  @Input({ required: true }) loading = false;
  @Input() loadingMore = false;
  @Input() error: string | null = null;
}
