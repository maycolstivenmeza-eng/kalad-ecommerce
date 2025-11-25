import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NewsletterService } from '../../services/newsletter.service';
import { UiMessageService } from '../../services/ui-message.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  newsletterEmail = '';
  isSubmitting = false;

  constructor(
    private newsletter: NewsletterService,
    private uiMessage: UiMessageService
  ) {}

  async onSubmitNewsletter(event: Event): Promise<void> {
    event.preventDefault();
    const email = (this.newsletterEmail || '').trim();
    if (!email) {
      this.uiMessage.error('Por favor escribe tu correo.');
      return;
    }

    this.isSubmitting = true;
    try {
      await this.newsletter.subscribe(email, 'footer');
      this.uiMessage.success('Gracias por suscribirte a Kalad.');
      this.newsletterEmail = '';
    } catch (error) {
      console.error('Error al suscribirse al newsletter', error);
      this.uiMessage.error('No pudimos guardar tu correo. Intenta de nuevo.');
    } finally {
      this.isSubmitting = false;
    }
  }

}
