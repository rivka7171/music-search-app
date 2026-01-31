import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { SearchHistoryItem } from '../../../core/services/search-history.service';

@Component({
  selector: 'app-search-history',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search-history.component.html',
  styleUrl: './search-history.component.css'
})
export class SearchHistoryComponent {
  @Input({ required: true }) items: SearchHistoryItem[] = [];
  @Output() selectTerm = new EventEmitter<string>();
}
