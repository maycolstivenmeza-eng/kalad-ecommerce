import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent implements OnInit {

  constructor(private title: Title, private meta: Meta) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.title.setTitle('Historia | Kalad');
    this.meta.updateTag({
      name: 'description',
      content: 'Conoce la historia de Kalad: inspiración, artesanas y proceso detrás de cada mochila.'
    });
  }
}

