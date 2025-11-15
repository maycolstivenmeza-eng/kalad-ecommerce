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
  readonly bannerImage = '/assets/images/Banner_historia4.png';

  readonly contactInfo = [
    { label: 'Correo', value: 'kalad@gmail.com', accent: false },
    { label: 'Telefono', value: '+57 3233333333', accent: false },
    { label: 'Horarios', value: 'Lunes a sabado, 9:00 AM - 6:00 PM', accent: true }
  ];

  readonly socialLinks = [
    { label: 'Facebook', icon: 'facebook', url: '#' },
    { label: 'Instagram', icon: 'instagram', url: '#' },
    { label: 'X', icon: 'x', url: '#' },
    { label: 'TikTok', icon: 'tiktok', url: '#' }
  ];
}
