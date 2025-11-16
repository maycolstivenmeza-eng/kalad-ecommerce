import { Component } from '@angular/core';
import { collection, Firestore, getDocs } from '@angular/fire/firestore';

@Component({
  selector: 'app-origen',
  standalone: true,
  imports: [],
  templateUrl: './origen.component.html',
  styleUrl: './origen.component.css'
})
export class OrigenComponent {
  productos: any[] = [];
  filtros = { ordenar: false, talla: false, color: false };

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    await this.obtenerProductos();
  }

  async obtenerProductos() {
   
  }

  toggleFiltro(tipo: string) {
  
  }

  ordenar(metodo: string) {
    if (metodo === 'A-Z') {
      this.productos.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } else if (metodo === 'Z-A') {
      this.productos.sort((a, b) => b.nombre.localeCompare(a.nombre));
    } else if (metodo === 'Mayor precio') {
      this.productos.sort((a, b) => b.precio - a.precio);
    } else if (metodo === 'Menor precio') {
      this.productos.sort((a, b) => a.precio - b.precio);
    }
  }
  open = [false, false, false];

  toggle(i: number) {
  this.open[i] = !this.open[i];
  }


}
