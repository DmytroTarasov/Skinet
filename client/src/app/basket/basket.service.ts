import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Basket, IBasket, IBasketItem, IBasketTotals } from '../shared/models/basket';
import { IDeliveryMethod } from '../shared/models/deliveryMethod';
import { IProduct } from '../shared/models/product';

@Injectable({
    providedIn: 'root'
})
export class BasketService {
    baseUrl = environment.apiUrl;

    private basketSource = new BehaviorSubject<IBasket>(null);
    basket$ = this.basketSource.asObservable();

    private basketTotalSource = new BehaviorSubject<IBasketTotals>(null);
    basketTotal$ = this.basketTotalSource.asObservable();

    shipping = 0;

    constructor(private http: HttpClient) { }
    
    createPaymentIntent() {
        return this.http.post(this.baseUrl + 'payments/' + this.getCurrentBasketValue().id, {})
            .pipe(
                map((basket: IBasket) => {
                    this.basketSource.next(basket); // update the basket so all subscribers will receive an updated basket
                })
            )
    }

    setShippingPrice(deliveryMethod: IDeliveryMethod) {
        this.shipping = deliveryMethod.price;
        const basket = this.getCurrentBasketValue();
        basket.deliveryMethodId = deliveryMethod.id;
        basket.shippingPrice = deliveryMethod.price;

        this.calculateTotals();
        this.setBasket(basket);
    }

    getBasket(id: string) {
        return this.http.get(this.baseUrl + 'basket?id=' + id)
            .pipe(
                map((basket: IBasket) => {
                    this.basketSource.next(basket);
                    this.shipping = basket.shippingPrice;
                    this.calculateTotals();
                }) 
            );
    }

    setBasket(basket: IBasket) {
        return this.http.post(this.baseUrl + 'basket', basket).subscribe((response: IBasket) => {
            this.basketSource.next(response); // update the 'BehaviorSubject' value  
            this.calculateTotals();
        }, error => console.log(error));
    }

    //a helper method
    getCurrentBasketValue() {
        return this.basketSource.value;
    }

    addItemToBasket(item: IProduct, quantity = 1) {
        const itemToAdd: IBasketItem = this.mapProductItemToBasketItem(item, quantity);
        const basket = this.getCurrentBasketValue() ?? this.createBasket(); // get an existing basket or create a new one
        basket.items = this.addOrUpdateItem(basket.items, itemToAdd, quantity);
        this.setBasket(basket);
    } 

    // in the case the same item already exists in the basket,
    // then we simply increase a quantity of that item
    addOrUpdateItem(items: IBasketItem[], itemToAdd: IBasketItem, quantity: number): IBasketItem[] {
        console.log(items);
        const index = items.findIndex(i => i.id === itemToAdd.id);
        if (index === -1) { // item doesn't exist in the basket
            itemToAdd.quantity = quantity;
            items.push(itemToAdd);
        } else {
            items[index].quantity += quantity;
        }
        return items;
    }

    incrementItemQuantity(item: IBasketItem) {
        const basket = this.getCurrentBasketValue();
        const foundItemIndex = basket.items.findIndex(x => x.id === item.id);
        basket.items[foundItemIndex].quantity++;
        this.setBasket(basket);
    }

    decrementItemQuantity(item: IBasketItem) {
        const basket = this.getCurrentBasketValue();
        const foundItemIndex = basket.items.findIndex(x => x.id === item.id);
        if (basket.items[foundItemIndex].quantity > 1) {
            basket.items[foundItemIndex].quantity--;
            this.setBasket(basket);
        } else {
            this.removeItemFromBasket(item);
        }
    }

    removeItemFromBasket(item: IBasketItem) {
        const basket = this.getCurrentBasketValue();
        if (basket.items.some(x => x.id === item.id)) {
            basket.items = basket.items.filter(x => x.id !== item.id); // remove an item from array
        }
        if (basket.items.length > 0) { // if there are some other elements in the basket
            this.setBasket(basket);
        } else {
            this.deleteBasket(basket); // else - delete an entire basket
        }
    }

    // clean up method
    deleteLocalBasket(id: string) {
        this.basketSource.next(null);
        this.basketTotalSource.next(null);
        localStorage.removeItem('basket_id');
    }

    deleteBasket(basket: IBasket) {
        return this.http.delete(this.baseUrl + 'basket?id=' + basket.id)
            .subscribe(() => {
                this.basketSource.next(null);
                this.basketTotalSource.next(null);
                localStorage.removeItem('basket_id');
            }, error => console.log(error));
    }

    private createBasket(): IBasket {
        const basket = new Basket();
        localStorage.setItem('basket_id', basket.id); // persist the basket id in the local storage 
        return basket;
    }

    // a helper method for mapping IProduct into an IBasketItem
    private mapProductItemToBasketItem(item: IProduct, quantity: number): IBasketItem {
        return {
            id: item.id,
            productName: item.name,
            price: item.price,
            pictureUrl: item.pictureUrl,
            quantity,
            brand: item.productBrand,
            type: item.productType
        }
    }

    private calculateTotals() {
        const basket = this.getCurrentBasketValue();
        const shipping = this.shipping;
        const subtotal = basket.items.reduce((a, b) => b.price * b.quantity + a, 0); // a - accumulator, b - item
        const total = subtotal + shipping;
        this.basketTotalSource.next({shipping, total, subtotal});
    }
    
}
