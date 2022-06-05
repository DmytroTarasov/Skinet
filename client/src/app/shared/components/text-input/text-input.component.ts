import { Component, ElementRef, Input, OnInit, Self, ViewChild } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

@Component({
    selector: 'app-text-input',
    templateUrl: './text-input.component.html',
    styleUrls: ['./text-input.component.scss']
})

// create a reusable text input component
export class TextInputComponent implements OnInit, ControlValueAccessor {
    @ViewChild('input', {static: true}) input: ElementRef;
    @Input() type? = 'text';
    @Input() label = 'string';

    constructor(@Self() public controlDir: NgControl) { // FormControl derives from NgControl 
                                                        // (we need to inject it here so we can implement validation 
                                                        // inside our custom input)
        this.controlDir.valueAccessor = this; // binds a controlDir to a class itself
    } 

    ngOnInit(): void {
        const control = this.controlDir.control;
        const validators = control.validator ? [control.validator] : [];

        // asyncValidator is, for example, a validator that goes to the API to check smth
        const asyncValidators = control.asyncValidator ? [control.asyncValidator] : [];

        control.setValidators(validators); // synchronous validators
        control.setAsyncValidators(asyncValidators);

        control.updateValueAndValidity();
    }

    onChange(event) {}

    onTouched() {}

    writeValue(obj: any): void {
        this.input.nativeElement.value = obj || ''; // set the value of the input field
    }

    registerOnChange(fn: any): void {
        this.onChange = fn; // fn is actually a function
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }
}
