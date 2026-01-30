import { Component, OnDestroy, OnInit } from "@angular/core";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { HeaderComponent } from "./shared/components/header/header.components";
import { FooterComponent } from "./shared/components/footer/footer.components";
import { Meta, Title } from "@angular/platform-browser";
import { Ga4Service } from "./shared/services/ga4.service";
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
  uiMessage$ = this.uiMessageService.message$;
  isAdminRoute = false;

  constructor(
    private titleService: Title,
    private meta: Meta,
    private router: Router,
    private analytics: Ga4Service,
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

  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }
}

