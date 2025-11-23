import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactService, ContactReason } from '../../shared/services/contact.service';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit {
  nombre = '';
  correo = '';
  asunto = '';
  mensaje = '';
  motivo: ContactReason = 'contacto';
  sending = false;
  status: { tipo: 'ok' | 'error'; texto: string } | null = null;

  constructor(
    private contactService: ContactService,
    private title: Title,
    private meta: Meta
  ) {}

  ngOnInit(): void {
    this.title.setTitle('Contacto | Kalad');
    this.meta.updateTag({
      name: 'description',
      content: 'Ponte en contacto con Kalad para dudas, pedidos especiales o información sobre nuestras colecciones.'
    });
  }

  async enviar() {
    this.status = null;

    if (!this.nombre || !this.correo || !this.asunto || !this.mensaje) {
      this.status = { tipo: 'error', texto: 'Por favor completa todos los campos.' };
      return;
    }

    this.sending = true;
    try {
      await this.contactService.send({
        nombre: this.nombre,
        correo: this.correo,
        asunto: this.asunto,
        mensaje: this.mensaje,
        motivo: this.motivo
      });
      this.status = { tipo: 'ok', texto: 'Mensaje enviado correctamente. Te contactaremos pronto.' };
      this.nombre = '';
      this.correo = '';
      this.asunto = '';
      this.mensaje = '';
      this.motivo = 'contacto';
    } catch (e) {
      console.error('No se pudo enviar el mensaje', e);
      this.status = { tipo: 'error', texto: 'No se pudo enviar tu mensaje. Intenta de nuevo.' };
    } finally {
      this.sending = false;
    }
  }
}
