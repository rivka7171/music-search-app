import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.css'
})
export class SearchBarComponent {
  @Input({ required: true }) queryControl!: FormControl<string>;
  @Input({ required: true }) searchType!: 'song' | 'album';
  @Output() searchTypeChange = new EventEmitter<'song' | 'album'>();
  @Output() clear = new EventEmitter<void>();
}
