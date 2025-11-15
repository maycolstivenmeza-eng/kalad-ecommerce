import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Product } from '../../shared/models/product.model';
import { ProductService } from '../../shared/services/product.service';

interface HighlightInfo {
  icon: string;
  title: string;
  description: string;
}

interface AssuranceInfo {
  title: string;
  description: string;
}

interface ReviewInfo {
  name: string;
  location: string;
  date: string;
  rating: number;
  comment: string;
}

@Component({
  selector: 'app-details-products',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './details-products.component.html',
  styleUrl: './details-products.component.css'
})
export class DetailsProductsComponent implements OnInit {
  product: Product | undefined;
  selectedColor: string = '';
  quantity: number = 1;
  selectedImage: string = '';
  thumbnailImages: string[] = [];
  readonly defaultDimensions: Product['dimensiones'] = {
    alto: '18 cm',
    ancho: '22 cm',
    profundidad: '7 cm',
    capacidad: '4 L'
  };
  displayDimensions: Product['dimensiones'] | undefined = this.defaultDimensions;

  readonly stars = Array(5).fill(0);

  readonly highlightInfo: HighlightInfo[] = [
    {
      icon: '🌊',
      title: 'Hecha a mano',
      description: 'Cada pieza es trabajada por artesanas colombianas del Caribe.'
    },
    {
      icon: '🧵',
      title: 'Fibras naturales',
      description: 'Tejida con fibras vegetales curadas para mayor resistencia.'
    },
    {
      icon: '🎁',
      title: 'Edición limitada',
      description: 'Producciones pequeñas para asegurar exclusividad en cada entrega.'
    }
  ];

  readonly assuranceInfo: AssuranceInfo[] = [
    {
      title: 'Envío seguro',
      description: 'Empaque ecológico y seguimiento en tiempo real.'
    },
    {
      title: 'Pagos protegidos',
      description: 'Aceptamos todas las tarjetas y transferencias de forma segura.'
    },
    {
      title: 'Cambios sin costo',
      description: '10 días para cambios por diseño o talla.'
    }
  ];

  readonly careTips: string[] = [
    'Limpiar con paño húmedo y dejar secar a la sombra.',
    'Evitar contacto prolongado con agua salada o arena húmeda.',
    'Guardar en bolsa de tela para mantener su forma natural.'
  ];

  readonly reviews: ReviewInfo[] = [
    {
      name: 'Sophie Bennet',
      location: 'Cartagena, Colombia',
      date: '12 de enero 2025',
      rating: 5,
      comment: 'La compré para mis vacaciones en Barú y es perfecta. Ligera, espaciosa y con un tejido precioso. Se siente especial saber que es artesanal.'
    },
    {
      name: 'Mariana Ruiz',
      location: 'Medellín, Colombia',
      date: '03 de enero 2025',
      rating: 4,
      comment: 'Los detalles bordados son hermosos y se nota la calidad. La uso para la oficina y siempre me preguntan dónde la compré.'
    },
    {
      name: 'Camila Ospina',
      location: 'Bogotá, Colombia',
      date: '28 de diciembre 2024',
      rating: 5,
      comment: 'Me encantó desde el empaque. Llegó con una nota de la artesana y eso la hizo aún más especial.'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const productId = params['id'];
      if (productId) {
        this.loadProduct(productId);
      }
    });
  }

  loadProduct(id: string): void {
    this.productService.getProductById(id).subscribe(product => {
      if (product) {
        this.product = product;

        this.thumbnailImages = Array.from({ length: 4 }, () => product.imagen);
        this.selectedImage = this.thumbnailImages[0];

        this.selectedColor = product.colores[0] || '';
        this.displayDimensions = product.dimensiones ?? this.defaultDimensions;
      } else {
        this.router.navigate(['/products']);
      }
    });
  }

  selectImage(image: string): void {
    this.selectedImage = image;
  }

  selectColor(color: string): void {
    this.selectedColor = color;
  }

  increment(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decrement(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (this.product) {
      alert(`${this.quantity} x ${this.product.nombre} (${this.selectedColor}) agregado al carrito`);
    }
  }

  buyNow(): void {
    if (this.product) {
      this.router.navigate(['/checkout']);
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }
}
