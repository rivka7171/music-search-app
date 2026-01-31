import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MusicItem } from '../../../core/models/music-item';

@Component({
  selector: 'app-music-card',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './music-card.component.html',
  styleUrl: './music-card.component.css'
})
export class MusicCardComponent {
  @Input({ required: true }) item!: MusicItem;

  get typeLabel(): string {
    return this.item.type === 'song' ? 'שיר' : 'אלבום';
  }
}
