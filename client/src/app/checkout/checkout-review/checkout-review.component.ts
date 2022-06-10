import { CdkStepper } from '@angular/cdk/stepper';
import { Component, Input, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BasketService } from 'src/app/basket/basket.service';

@Component({
    selector: 'app-checkout-review',
    templateUrl: './checkout-review.component.html',
    styleUrls: ['./checkout-review.component.scss']
})
export class CheckoutReviewComponent implements OnInit {
    @Input() appStepper: CdkStepper;

    constructor(private basketService: BasketService, private toastr: ToastrService) { }

    ngOnInit(): void {
    }

    createPaymentIntent() {
        return this.basketService.createPaymentIntent().subscribe((response: any) => {
            this.appStepper.next(); // move the user to the next step in Stepper
        }, error => console.log(error));
    }

}
