import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
 nombre = '';
  correo = '';
  asunto = '';
  mensaje = '';

  enviar() {
    if (!this.nombre || !this.correo || !this.asunto || !this.mensaje) {
      alert('Por favor completa todos los campos.');
      return;
    }

    alert('✅ Mensaje enviado correctamente.');
    this.nombre = '';
    this.correo = '';
    this.asunto = '';
    this.mensaje = '';
  }
}
