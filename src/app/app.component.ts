import { Component, OnDestroy, OnInit } from "@angular/core";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { HeaderComponent } from "./shared/components/header/header.components";
import { FooterComponent } from "./shared/components/footer/footer.components";
import { Meta, Title } from "@angular/platform-browser";
import { AnalyticsService } from "./shared/services/analytics.service";
import { Subscription, filter } from "rxjs";
import { CommonModule } from "@angular/common";
import { UiMessageService } from "./shared/services/ui-message.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, CommonModule],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit, OnDestroy {
  title = "Kalad";
  private navSub?: Subscription;
  private launchIntervalId?: any;
  uiMessage$ = this.uiMessageService.message$;
  isAdminRoute = false;

  // Mensajes rotativos para la franja de lanzamiento
  launchMessages: string[] = [
    "Lanzamiento oficial KALAD",
    "Edición especial disponible",
    "Envíos nacionales",
  ];
  currentLaunchIndex = 0;

  constructor(
    private titleService: Title,
    private meta: Meta,
    private router: Router,
    private analytics: AnalyticsService,
    private uiMessageService: UiMessageService
  ) {
    this.titleService.setTitle("Kalad | Mochilas artesanales");
    this.meta.updateTag({
      name: "description",
      content:
        "Kalad: mochilas artesanales colombianas, piezas únicas hechas a mano. Conoce nuestras colecciones.",
    });
  }

  ngOnInit(): void {
    this.analytics.init();
    this.navSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.isAdminRoute = event.urlAfterRedirects.startsWith("/admin");
        this.analytics.trackPageView(
          event.urlAfterRedirects,
          this.titleService.getTitle()
        );
      });

    // Rotación de mensajes de lanzamiento
    this.launchIntervalId = setInterval(() => {
      this.currentLaunchIndex =
        (this.currentLaunchIndex + 1) % this.launchMessages.length;
    }, 4000);
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
    if (this.launchIntervalId) {
      clearInterval(this.launchIntervalId);
    }
  }
}
