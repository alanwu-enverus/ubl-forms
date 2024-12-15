import {
  Component,
  ComponentRef,
  inject,
  Input,
  OnInit,
  signal,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import {FormArray, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {LoadedComponent, Ubl} from "../../model/ubl.model";
import Aggregate = Ubl.Aggregate;
import {BasicComponent} from "./basic.component";
import {UpComponent} from "../helper/up.component";
import Basic = Ubl.Basic;
import Extension = Ubl.Extension;
import NextRef = Ubl.NextRef;
import Array = Ubl.Array;
import {AggregateService} from "../../service/aggregate.service";
import {RefComponent} from "./ref.component";
import {isEmpty} from "../../service/util";
import {ThreeDotsComponent} from "../helper/three.dots.component";
import {ArrayComponent} from "./array.component";

@Component({
  selector: 'ubl-aggregate',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ThreeDotsComponent,
    UpComponent
  ],
  template: `
    <ng-container [formGroup]="formGroup">
      <div class="container">
        <div class="top-item">
          @if (isExpanded()) {
            <ubl-up (closeRequest)="onClose()"></ubl-up>
          } @else {
            <ubl-three-dots (openRequest)="onOpen()"></ubl-three-dots>
          }
          <div class="title"> {{ title }}</div>
          @if (isLoading()) {
            <span class="loader"></span>
          }
        </div>
        <div class="folder">
          <ng-container #items></ng-container>
        </div>
      </div>
    </ng-container>
  `,
  styles: `
    // Container
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

      .folder {
        margin: 0 0 0.5em 0.86em;
        padding: 0.5em 0em 0.5em 1.5em;
        border-left: 0.1em #ccc dotted;
        border-bottom: 0.1em #ccc dotted;
      }
    }

    // Loader
    .loader {
      width: 48px;
      height: 48px;
      border: 5px solid #FFF;
      border-bottom-color: transparent;
      border-radius: 50%;
      display: inline-block;
      box-sizing: border-box;
      animation: rotation 1s linear infinite;
    }

    @keyframes rotation {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

  `
})
export class AggregateComponent implements OnInit {
  @Input() model: any;
  @Input() schema: Aggregate;
  @Input({required: true}) formGroupKey = '';
  @Input({required: true}) parentFormGroup: FormGroup | FormArray;
  @Input({required: true}) title = '';
  @Input({required: true}) description = '';
  @Input({required: true}) loadNonRequiredIfRequiredIsEmpty: boolean = false;
  @Input({required: true}) refName: string;

  public formGroup: FormGroup = new FormGroup({});
  vcr = viewChild('items', {read: ViewContainerRef});
  basicComponentRef?: ComponentRef<BasicComponent>;
  aggregateComponentRef?: ComponentRef<AggregateComponent>;
  refComponentRef?: ComponentRef<RefComponent>;
  arrayComponentRef?: ComponentRef<ArrayComponent>;

  service = inject(AggregateService);

  isExpanded = signal(false);
  isLoading = signal(false);
  isAllHaveValue = () => false;
  isAllHaveNotValue = false;
  required = []
  nonRequired = [];
  nonRequiredAdded = false;
  allNonRequiredIsEmptyAndHaveNotReqiured = false;

  // note: this is to keep track of the components created in order.
  // when onClose, if the component has NOT value, then close it. The ViewContainerRef API does not have a way to get the component instance
  // private requiredComponentRefs = new Map<number, ComponentRef<BasicComponent | AggregateComponent | RefComponent>>(); //when conClose, call subcomponent to close too
  // private nonRequiredComponentRefs = new Map<number, ComponentRef<BasicComponent | AggregateComponent | RefComponent>>(); // keep track of the non-required component created
  // private viewRefs = new Map<number, ViewRef>();  // keep track of the view ref created, they are used to re-insert the component when open

  private loadedComponents: LoadedComponent[] = [];

  ngOnInit(): void {
    this.required = this.schema.required;
    this.nonRequired = Object.keys(this.schema.properties).filter(name => !this.schema.required.includes(name));

    if(this.isModelEmpty(this.model)) {
      if (this.required?.length > 0) {
        this.initRequired();
      } else if (this.loadNonRequiredIfRequiredIsEmpty) {
        this.initNonRequired();
      }
    } else {
      if (this.required?.length > 0) {
        this.initRequired();
      }
      if(!this.isModelNotRequiredEmpty(this.model) || this.loadNonRequiredIfRequiredIsEmpty) {
        this.initNonRequired();
      }
      /*
        for some reason, closing components here does not work
       */
      // this.closeComponent();
    }

    this.loadNonRequiredIfRequiredIsEmpty = false; // try to load non-required only once
    this.addToParentControl();
  }

  private addToParentControl() {
    if (this.parentFormGroup instanceof FormGroup) {
      this.parentFormGroup.addControl(this.formGroupKey, this.formGroup);
    } else {
      this.parentFormGroup.push(this.formGroup);
    }
  }

  onClose() {
    this.isExpanded.set(false);
    this.closeComponent();
  }

  onOpen() {
    this.initNonRequired();
  }

  private initNonRequired() {
    this.isExpanded.set(true);
    if (!this.nonRequiredAdded) {
      this.getNonRequired();
      this.nonRequiredAdded = true;
    } else {
      if (this.allNonRequiredIsEmptyAndHaveNotReqiured) {
        this.getNonRequired();
      } else {
        this.loadedComponents.filter((component) => !component.isRequired).forEach((component) => {
          if (isEmpty(component.component.formGroup.value)) {
            this.vcr().insert(component.viewRef, component.position);
          }
        })
      }
    }
  }

  private initRequired() {
    this.required.forEach((name) => {
      const field = this.schema.properties[name];
      const data = this.model ? this.model[name] : {};
      this.setupComponent(field, data, name);
    })
  }

  private getNonRequired() {
      if(this.formGroupKey === '0'){
        console.log('here')
      }
      this.schema = this.service.getNonRequiredAggregatesByRef(this.formGroupKey);
      this.nonRequired = Object.keys(this.schema.properties).filter(name => !this.schema.required.includes(name));
      this.nonRequired.forEach((name) => {
        const field = this.schema.properties[name];
        const data = this.model ? this.model[name] : {};
        this.setupComponent(field, data, name, false);
      })
  }

  private setupComponent(field: any, data, name, isRequired = true) {
    if (field instanceof Basic) {
      this.basicComponentRef = this.vcr()?.createComponent(BasicComponent);
      this.basicComponentRef?.setInput('model', data);
      this.basicComponentRef?.setInput('schema', field);
      this.basicComponentRef?.setInput('title', name);
      this.basicComponentRef?.setInput('formGroupKey', name);
      this.basicComponentRef?.setInput('parentFormGroup', this.formGroup);

      this.loadedComponents.push({
        component: this.basicComponentRef.instance,
        viewRef: this.vcr().get(this.vcr().length - 1),
        isRequired: isRequired,
        position: this.vcr().length - 1
      });
    } else if (field instanceof Aggregate) {
      this.aggregateComponentRef = this.vcr()?.createComponent(AggregateComponent);
      this.aggregateComponentRef?.setInput('model', data);
      this.aggregateComponentRef?.setInput('schema', field);
      this.aggregateComponentRef?.setInput('title', field['title']);
      this.aggregateComponentRef?.setInput('description', field['description']);
      this.aggregateComponentRef?.setInput('formGroupKey', name);
      this.aggregateComponentRef?.setInput('parentFormGroup', this.formGroup);

      this.loadedComponents.push({
        component: this.aggregateComponentRef.instance,
        viewRef: this.vcr().get(this.vcr().length - 1),
        isRequired: isRequired,
        position: this.vcr().length - 1
      });
    } else if (field instanceof Array) {
      this.arrayComponentRef = this.vcr()?.createComponent(ArrayComponent);
      this.arrayComponentRef?.setInput('model', data);
      this.arrayComponentRef?.setInput('schema', field.items);
      this.arrayComponentRef?.setInput('title', field.title);
      this.arrayComponentRef?.setInput('formGroupKey', name);
      this.arrayComponentRef?.setInput('parentFormGroup', this.formGroup);
    } else if (field instanceof Extension) {
      // todo: handle extension
    } else if (field instanceof NextRef) {
      this.refComponentRef = this.vcr()?.createComponent(RefComponent);
      this.refComponentRef?.setInput('model', data);
      this.refComponentRef?.setInput('title', field['title']);
      this.refComponentRef?.setInput('description', field['description']);
      this.refComponentRef?.setInput('parentFormGroup', this.formGroup);
      this.refComponentRef?.setInput('formGroupKey', name);
      this.refComponentRef?.setInput('ref', field['$ref']);
      this.refComponentRef?.setInput('loadRef', !isEmpty(data));
      this.refComponentRef?.setInput('refName', name)

      this.loadedComponents.push({
        component: this.refComponentRef.instance,
        viewRef: this.vcr().get(this.vcr().length - 1),
        isRequired: isRequired,
        position: this.vcr().length - 1
      });
    }
  }

  private closeComponent() {
    if (this.vcr()?.length > 0) {
      const nonRequiredComponents = this.loadedComponents.filter((component) => !component.isRequired);
      const requiredComponents = this.loadedComponents.filter((component) => component.isRequired);

      if (this.required.length === 0) {
        this.allNonRequiredIsEmptyAndHaveNotReqiured = nonRequiredComponents.every((component) => isEmpty(component.component.formGroup?.value));
        if (this.allNonRequiredIsEmptyAndHaveNotReqiured) {
          this.vcr().clear();
        } else {
          nonRequiredComponents.forEach((component) => {
            if (isEmpty(component.component.formGroup.value)) {
              const index = this.vcr().indexOf(component.viewRef);
              if (index >= 0) {
                this.vcr().detach(index);
              }
            } else {
              component.component.onClose();
            }
          });
        }
      } else {
        nonRequiredComponents.forEach((component) => {
          if (isEmpty(component.component.formGroup.value)) {
            const index = this.vcr().indexOf(component.viewRef);
            if (index >= 0) {
              this.vcr().detach(index);
            }
          } else {
            component.component.onClose();
          }
        });
      }

      requiredComponents.forEach((component) => {
        component.component.onClose();
      });
    }
  }

  private isModelEmpty = (model: any) => isEmpty(model);

  private isModelNotRequiredEmpty = (model: any) => this.nonRequired.every((name) => isEmpty(model[name]));
}
