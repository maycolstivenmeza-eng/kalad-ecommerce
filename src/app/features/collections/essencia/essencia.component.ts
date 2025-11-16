import { Component } from '@angular/core';

@Component({
  selector: 'app-essencia',
  standalone: true,
  imports: [],
  templateUrl: './essencia.component.html',
  styleUrl: './essencia.component.css'
})
export class EssenciaComponent {

  open = [false, false, false];
  toggle(i: number) {
  this.open[i] = !this.open[i];
}

}
