import { registerLocaleData } from '@angular/common';
import localeHe from '@angular/common/locales/he';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

registerLocaleData(localeHe);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
