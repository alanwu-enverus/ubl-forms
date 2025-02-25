import {Component, ComponentRef, inject, Input, OnInit, signal, viewChild, ViewContainerRef} from '@angular/core';
import {ExpandComponent} from "../helper/expand.component";
import {FormGroup, ReactiveFormsModule} from "@angular/forms";
import {Ubl} from "../../model/ubl.model";
import Aggregate = Ubl.Aggregate;
import {AggregateService} from "../../service/aggregate.service";
import {AggregateComponent} from "./aggregate.component";
import {isEmpty} from "../../service/util";

@Component({
    selector: 'ubl-ref',
    imports: [
        ExpandComponent,
        ReactiveFormsModule
    ],
    template: `
    @if (!isExpanded()) {
      <div class="container" >
        <div class="top-item">
          <ubl-expand (expandRequest)="onExpand()" class="pt-1"></ubl-expand>
          <div class="title"> {{ title }}</div>
        </div>

        @if (isLoading()) {
          <span class="loader"></span>
        }
      </div>
    }
    <ng-container [formGroup]="parentFormGroup">
      <ng-container #aggregate></ng-container>
    </ng-container>
  `,
    styles: `
  .container {
    position: relative;
    display: block;

    .top-item {
      grid-column: span 2;
      display: flex;
      flex-direction: row;
      justify-content: start;
      align-items: center;
      gap: 0.5rem;
      background: gainsboro;
      padding: 0.1rem 0.5rem;

      .title {
        font-size: 1.5rem;
      }
    }
  }
  .pt-1 {
    padding-top: 0.5rem;
  }

  .container:hover  {
    cursor: pointer;
  }
  `
})
export class RefComponent implements OnInit {

  @Input() model: any;
  @Input({required: true}) formGroupKey = '';
  @Input({required: true}) parentFormGroup: FormGroup;
  @Input({required: true}) title = '';
  @Input({required: true}) description = '';
  @Input({required: true}) ref: string;
  @Input({required: true}) loadRef: boolean = false;
  @Input() refName: string = '';

  isExpanded = signal(false);
  isLoading = signal(false);

  vcr = viewChild('aggregate', {read: ViewContainerRef});
  schema: Aggregate;
  service = inject(AggregateService);
  aggregateComponentRef?: ComponentRef<AggregateComponent>;




  /* *** make sure ***
    aggregate will have a formGroupKey
    ref key can be ignored
   */

  ngOnInit(): void {
    if(this.loadRef) {
      this.onExpand();
    }
  }
  onExpand() {
    this.isLoading.set(true);

    this.schema = this.service.getRequiredAggregatesByRef(this.ref);
    if(this.schema.required.length === 0) {
      this.schema = this.service.getNonRequiredAggregatesByRef(this.ref);
    }

    this.aggregateComponentRef = this.vcr()?.createComponent(AggregateComponent);
    this.aggregateComponentRef?.setInput('model', this.model);
    this.aggregateComponentRef?.setInput('schema', this.schema);
    this.aggregateComponentRef?.setInput('title', this.schema['title']);
    this.aggregateComponentRef?.setInput('description', this.schema['description']);
    this.aggregateComponentRef?.setInput('formGroupKey', this.refName);
    this.aggregateComponentRef?.setInput('parentFormGroup', this.parentFormGroup);
    this.aggregateComponentRef?.setInput('loadNonRequiredIfRequiredIsEmpty', true);
    // skip refName, so aggregate component will not load non-required

    this.isLoading.set(false);
    this.isExpanded.set(true)
  }

  public get formGroup(): FormGroup {
    return this.parentFormGroup.get(this.formGroupKey) as FormGroup || new FormGroup({});
  }
  public onClose() {
    // if (isEmpty(this.aggregateComponentRef?.instance.formGroup.value)) {
      this.aggregateComponentRef?.instance?.onClose();
    // }
  }
}
