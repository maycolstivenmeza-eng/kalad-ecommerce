import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { WompiService } from '../../shared/services/wompi.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  checkoutForm!: FormGroup;
  isProcessing = false;

  // Datos de ejemplo del carrito (esto debería venir de un servicio de carrito)
  cartItems = [
    {
      id: '1',
      nombre: 'Mochila KALAD ORIGEN Clásica',
      precio: 150000,
      cantidad: 1,
      color: 'Negro',
      imagen: '/assets/images/Producto_1.jpg'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private wompiService: WompiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.checkoutForm = this.fb.group({
      // Datos personales
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      documentType: ['CC', Validators.required],
      documentNumber: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],

      // Dirección de envío
      address: ['', Validators.required],
      city: ['', Validators.required],
      department: ['', Validators.required],
      postalCode: ['', Validators.pattern(/^[0-9]{6}$/)],

      // Notas adicionales
      notes: ['']
    });
  }

  get f() {
    return this.checkoutForm.controls;
  }

  getTotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  }

  getTotalInCents(): number {
    return this.getTotal() * 100;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  /**
   * Procesa el pago con Wompi
   */
  async processPayment(): Promise<void> {
    if (this.checkoutForm.invalid) {
      this.markFormGroupTouched(this.checkoutForm);
      alert('Por favor completa todos los campos requeridos correctamente.');
      return;
    }

    this.isProcessing = true;

    try {
      const formValue = this.checkoutForm.value;

      // Configuración del pago con datos del formulario
      const checkoutConfig = {
        amountInCents: this.getTotalInCents(),
        reference: `KALAD-${Date.now()}`,
        customerData: {
          email: formValue.email,
          fullName: formValue.fullName,
          phoneNumber: formValue.phone,
          phoneNumberPrefix: '+57',
          legalId: formValue.documentNumber,
          legalIdType: formValue.documentType
        },
        shippingAddress: {
          addressLine1: formValue.address,
          city: formValue.city,
          region: formValue.department,
          country: 'CO',
          phoneNumber: formValue.phone
        },
        redirectUrl: window.location.origin + '/confirmation'
      };

      console.log('Procesando pago con configuración:', checkoutConfig);

      // Abrir el widget de Wompi
      await this.wompiService.openCheckout(checkoutConfig);

    } catch (error) {
      console.error('Error al procesar el pago:', error);
      alert('Ocurrió un error al procesar el pago. Por favor intenta de nuevo.');
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Marca todos los campos del formulario como touched para mostrar errores
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Continuar comprando (volver a productos)
   */
  continueShopping(): void {
    this.router.navigate(['/products']);
  }
}
