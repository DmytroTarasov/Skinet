import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-pager',
    templateUrl: './pager.component.html',
    styleUrls: ['./pager.component.scss']
})
export class PagerComponent implements OnInit {
    @Input() totalCount: number;
    @Input() pageSize: number;
    @Input() pageNumber: number;
    @Output() pageChanged = new EventEmitter<number>(); // 'Output' property to pass data 
    // from child component to a parent

    constructor() { }

    ngOnInit(): void {
    }

    onPagerChange(event: any) {
        this.pageChanged.emit(event.page);
    } 

}
