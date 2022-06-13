import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { IBrand } from '../shared/models/brand';
import { IProduct } from '../shared/models/product';
import { IType } from '../shared/models/productType';
import { ShopParams } from '../shared/models/shopParams';
import { ShopService } from './shop.service';

@Component({
    selector: 'app-shop',
    templateUrl: './shop.component.html',
    styleUrls: ['./shop.component.scss']
})
export class ShopComponent implements OnInit {
    @ViewChild('search', {static: false}) searchTerm: ElementRef;
    products: IProduct[];
    brands: IBrand[];
    types: IType[];
    shopParams: ShopParams;
    totalCount: number;
    sortOptions = [
        {name: 'Alphabetical', value: 'name'},
        {name: 'Price: Low to High', value: 'priceAsc'},
        {name: 'Price: High to Low', value: 'priceDesc'}
    ]

    constructor(private shopService: ShopService) {
        this.shopParams = this.shopService.getShopParams(); // get the shop params from a service
    }

    ngOnInit(): void {
        this.getProducts(true);
        this.getBrands();
        this.getTypes();
    }

    getProducts(useCache = false) {
        this.shopService.getProducts(useCache)
            .subscribe(response => {
                this.products = response.data;
                this.totalCount = response.count;
            },
            error => console.log(error));
    }

    getBrands() {
        this.shopService.getBrands().subscribe(response => this.brands = [{id: 0, name: 'All'}, ...response],
            error => console.log(error));
    }

    getTypes() {
        this.shopService.getTypes().subscribe(response => this.types = [{id: 0, name: 'All'}, ...response],
            error => console.log(error));
    }

    onBrandSelected(brandId: number) {
        const params = this.shopService.getShopParams();
        params.brandId = brandId;
        params.pageNumber = 1; // reset the pageNumber back to '1' (initial value) so the products are displayed
        // correctly, without any errors
        this.shopService.setShopParams(params);
        this.getProducts();
    }

    onTypeSelected(typeId: number) {
        const params = this.shopService.getShopParams();
        params.typeId = typeId;
        params.pageNumber = 1;
        this.shopService.setShopParams(params);
        this.getProducts();
    }

    onSortSelected(sort: string) {
        const params = this.shopService.getShopParams();
        params.sort = sort;
        this.shopService.setShopParams(params);
        this.getProducts();
    }

    onPageChanged(event: any) {
        const params = this.shopService.getShopParams();
        // check if we are really changing a page in pagination list
        // (because, pagination component calls this function even if items 'totalCount' has changed 
        // and this causes an additional request to a API server be made)
        if (params.pageNumber !== event) {
            params.pageNumber = event;
            this.shopService.setShopParams(params);
            this.getProducts(true);
        }
    }

    onSearch() {
        const params = this.shopService.getShopParams();
        params.search = this.searchTerm.nativeElement.value; // get the value from the 'input' 
        params.pageNumber = 1;
        this.shopService.setShopParams(params);
        this.getProducts();
    }

    onReset() {
        this.searchTerm.nativeElement.value = '';
        this.shopParams = new ShopParams();
        this.shopService.setShopParams(this.shopParams);
        this.getProducts();
    }
}
