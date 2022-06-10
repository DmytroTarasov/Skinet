import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { NavigationExtras, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BasketService } from 'src/app/basket/basket.service';
import { IBasket } from 'src/app/shared/models/basket';
import { IOrder } from 'src/app/shared/models/order';
import { CheckoutService } from '../checkout.service';

declare var Stripe;

@Component({
    selector: 'app-checkout-payment',
    templateUrl: './checkout-payment.component.html',
    styleUrls: ['./checkout-payment.component.scss']
})
export class CheckoutPaymentComponent implements AfterViewInit, OnDestroy {
    @Input() checkoutForm: FormGroup;
    @ViewChild('cardNumber', {static: true}) cardNumberElement: ElementRef;
    @ViewChild('cardExpiry', {static: true}) cardExpiryElement: ElementRef;
    @ViewChild('cardCvc', {static: true}) cardCvcElement: ElementRef;
    stripe: any;
    cardNumber: any;
    cardExpiry: any;
    cardCvc: any;
    cardErrors: any;
    cardHandler = this.onChange.bind(this); // set the value of cardHandler to an onChange() method that we`ve created underneath
    loading = false;
    cardNumberValid = false;
    cardExpiryValid = false;
    cardCvcValid = false;

    constructor(
        private basketService: BasketService, 
        private checkoutService: CheckoutService,
        private toastr: ToastrService,
        private router: Router) { }
    
    // here, we use yet another method of a component`s lifecycle - ngAfterViewInit()
    // because we want to mount Stripe elements to our html elements
    // only when the view was initialized
    ngAfterViewInit(): void {
        this.stripe = Stripe('pk_test_51L8UjiLsWNMmd7YMTm8c1iEB7OmVMCfI5L5UIa2vlSEoARq9hcvDNyx5Wd0anPiM8d0ENlXTO7WRq7UhaZHGrF1k00c24GNSW4');
        const elements = this.stripe.elements();

        this.cardNumber = elements.create('cardNumber');
        // mount a stripe element to a plain html element
        this.cardNumber.mount(this.cardNumberElement.nativeElement);
        this.cardNumber.addEventListener('change', this.cardHandler); // for error checking

        this.cardExpiry = elements.create('cardExpiry');
        this.cardExpiry.mount(this.cardExpiryElement.nativeElement);
        this.cardExpiry.addEventListener('change', this.cardHandler);

        this.cardCvc = elements.create('cardCvc');
        this.cardCvc.mount(this.cardCvcElement.nativeElement);
        this.cardCvc.addEventListener('change', this.cardHandler);
    }
      
    ngOnDestroy(): void {
        // dispose Stripe elements
        this.cardNumber.destroy();
        this.cardExpiry.destroy();
        this.cardCvc.destroy();
    }

    // onChange handler for Stripe elements
    onChange(event) {
        this.cardErrors = event.error ? event.error.message : null;
        switch(event.elementType) {
            case 'cardNumber':
                this.cardNumberValid = event.complete;
                break;
            case 'cardExpiry':
                this.cardExpiryValid = event.complete;
                break;
            case 'cardCvc':
                this.cardCvcValid = event.complete;
                break;
        }
    }

    async submitOrder() {
        this.loading = true;
        const basket = this.basketService.getCurrentBasketValue();

        try {
            const createdOrder = await this.createOrder(basket);
            const paymentResult = await this.confirmPaymentWithStripe(basket);
    
            if (paymentResult.paymentIntent) { // success payment
                this.basketService.deleteBasket(basket);
                const navigationExtras: NavigationExtras = {state: createdOrder};
                this.router.navigate(['checkout/success'], navigationExtras); // navigate to the success page
            } else {
                this.toastr.error(paymentResult.error.message);
            }
            this.loading = false;
        } catch(error) {
            console.log(error);
            this.loading = false;
        }
    }

    private async confirmPaymentWithStripe(basket) {
        return this.stripe.confirmCardPayment(basket.clientSecret, {
            payment_method: {
                card: this.cardNumber,
                billing_details: {
                    name: this.checkoutForm.get('paymentForm').get('nameOnCard').value
                }
            }
        });
    }

    private async createOrder(basket: IBasket) {
        const orderToCreate = this.getOrderToCreate(basket);
        return this.checkoutService.createOrder(orderToCreate).toPromise();
    }

    private getOrderToCreate(basket: IBasket) {
        return {
            basketId: basket.id,
            deliveryMethodId: +this.checkoutForm.get('deliveryForm').get('deliveryMethod').value, // get value from the FormGroup
            shipToAddress: this.checkoutForm.get('addressForm').value
        }
    }

}
