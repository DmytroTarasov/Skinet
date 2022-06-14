import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { BusyService } from '../services/busy.service';
import { delay, finalize } from 'rxjs/operators';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {

    constructor(private busyService: BusyService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // we can specify requests for which this loading indicator won`t be displayed
        if (request.method === 'POST' && request.url.includes('orders')) {
            return next.handle(request);
        }
        if (request.method === 'DELETE') {
            return next.handle(request);
        }
        if (request.url.includes('emailexists')) {
            return next.handle(request);
        }
        this.busyService.busy();
        return next.handle(request).pipe(
            // delay(1000), // add some delay (for production mode only)
            finalize(() => this.busyService.idle()) // turn off the spinner
        );
    }
}
