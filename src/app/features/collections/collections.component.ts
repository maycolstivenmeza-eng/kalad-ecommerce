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
    this.title.setTitle('Colecciones | Kalad');
    this.meta.updateTag({
      name: 'description',
      content: 'Explora las colecciones Kalad Origen y Essencia, piezas artesanales tejidas a mano.'
    });
  }
}
