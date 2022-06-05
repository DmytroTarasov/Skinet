import { Component, OnInit } from '@angular/core';
import { AsyncValidatorFn, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { of, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AccountService } from '../account.service';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
    registerForm: FormGroup;
    errors: string[];

    // FormBuilder allows to create FormControls slightly easier
    constructor(private fb: FormBuilder, private accountService: AccountService, private router: Router) { }

    ngOnInit(): void {
        this.createRegisterForm();
    }

    createRegisterForm() {
        this.registerForm = this.fb.group({
          displayName: [null, [Validators.required]],
          email: [null, 
            [
                Validators.required, // sync validator
                Validators.pattern('^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$') // sync validator
            ], 
            [this.validateEmailNotTaken()] // async validator (this type of validator is called only 
            // if the value satisfies the sync validators)
          ],
          password: [null, Validators.required]
        });
      }

    onSubmit() {
        this.accountService.register(this.registerForm.value)
            .subscribe(response => {
                this.router.navigateByUrl('/shop');
            }, error => {
                console.log(error);
                this.errors = error.errors;
            });
    }

    // function that creates some delay and then checks from the API if typed email exists
    validateEmailNotTaken(): AsyncValidatorFn {
        return control => {
            return timer(500).pipe( // some delay
                switchMap(() => {
                    if (!control.value) return of(null); // if there is no email, return an Observable of 'null'
                    return this.accountService.checkEmailExists(control.value) // if email exists, got to the API and then pipe the result
                        .pipe(
                            map(res => {
                                return res ? {emailExists: true} : null
                            })
                        )
                })
            );
        }
    }

}
