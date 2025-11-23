import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.components';
import { FooterComponent } from './shared/components/footer/footer.components';
import { Meta, Title } from '@angular/platform-browser';
import { AnalyticsService } from './shared/services/analytics.service';
import { Subscription, filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { UiMessageService, UiMessage } from './shared/services/ui-message.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Kalad';
  private navSub?: Subscription;
  uiMessage$ = this.uiMessageService.message$;

  constructor(
    private titleService: Title,
    private meta: Meta,
    private router: Router,
    private analytics: AnalyticsService,
    private uiMessageService: UiMessageService
  ) {
    this.titleService.setTitle('Kalad | Mochilas artesanales');
    this.meta.updateTag({
      name: 'description',
      content:
        'Kalad: mochilas artesanales colombianas, piezas únicas hechas a mano. Conoce nuestras colecciones Origen y Essencia.'
    });
  }

  ngOnInit(): void {
    this.analytics.init();
    this.navSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.analytics.trackPageView(event.urlAfterRedirects, this.titleService.getTitle());
      });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }
}
