import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './collections.component.html',
  styleUrl: './collections.component.css'
})
export class CollectionsComponent implements OnInit {

  constructor(private title: Title, private meta: Meta) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.title.setTitle('Colecciones | Kalad');
    this.meta.updateTag({
      name: 'description',
      content: 'Explora todas las colecciones de Kalad: Origen, Essencia y KALAD LUME, mochilas artesanales tejidas a mano en Colombia.'
    });
  }
}
