import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AccountService } from 'src/app/account/account.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {

    constructor(private accountService: AccountService, private router: Router) {}

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean> {
        // router will subscribe to and unsubscribe from an Observable automatically
        return this.accountService.currentUser$.pipe(
            map(auth => {
                if (auth) return true; // if the user is logged in, just let him proceed to the checkout
                this.router.navigate(['account/login'], {queryParams: {returnUrl: state.url}}); // redirect to the login page
            })
        )
    }
}
