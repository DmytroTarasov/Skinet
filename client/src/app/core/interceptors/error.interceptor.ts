import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { NavigationExtras, Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

    constructor(private router: Router, private toastr: ToastrService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            catchError(error => {
                if (error) {
                    switch (error.status) {
                        case 400:
                            if (error.error.errors) {
                                // error.error is actually an error we are returning back from the API if smth went wrong
                                throw error.error; // throw to the component itself
                            } else {
                                this.toastr.error(error.error.message, error.error.statusCode);
                            }
                            break;
                        case 401:
                            this.toastr.error(error.error.message, error.error.statusCode);
                            break;
                        case 404:
                            this.router.navigateByUrl('/not-found');
                            break;
                        case 500:
                            const navigationExtras: NavigationExtras = {state: {error: error.error}};
                            this.router.navigateByUrl('/server-error', navigationExtras);
                            break;
                    }
                }
                return throwError(error);
            })
        );
    }
}
