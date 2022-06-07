import { CdkStepper } from '@angular/cdk/stepper';
import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-stepper',
    templateUrl: './stepper.component.html',
    styleUrls: ['./stepper.component.scss'],
    providers: [
        {provide: CdkStepper, useExisting: StepperComponent}
    ]
})

export class StepperComponent extends CdkStepper implements OnInit {
    @Input() linearModeSelected: boolean;

    ngOnInit(): void {
        // this.linear comes from CdkStepper and it indicates whether or not the user can proceed to the further steps 
        // in the form if he didn`t fill the previuos one
        this.linear = this.linearModeSelected; 
    }

    // keeps track the step on which the user is currently in
    onClick(index: number) {
        this.selectedIndex = index;
    }

}
