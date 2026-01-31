import { Routes } from '@angular/router';
import { DetailsPageComponent } from './features/details/details-page/details-page.component';
import { SearchPageComponent } from './features/search/search-page/search-page.component';

export const routes: Routes = [
  { path: '', component: SearchPageComponent },
  { path: 'details/:id', component: DetailsPageComponent },
  { path: '**', redirectTo: '' }
];
