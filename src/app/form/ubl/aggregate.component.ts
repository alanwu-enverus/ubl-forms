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
import {LoadedComponent, Ubl, UblElementType} from "../../model/ubl.model";
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
  @Input({required: true}) refName: string;  // this is used by RefComponent and ArrayComponent that has only required schemas

  public formGroup: FormGroup = new FormGroup({});
  vcr = viewChild('items', {read: ViewContainerRef});
  basicComponentRef?: ComponentRef<BasicComponent>;
  aggregateComponentRef?: ComponentRef<AggregateComponent>;
  refComponentRef?: ComponentRef<RefComponent>;
  arrayComponentRef?: ComponentRef<ArrayComponent>;

  service = inject(AggregateService);

  isExpanded = signal(false);
  isLoading = signal(false);

  required = []
  nonRequired = [];
  nonRequiredAdded = false;
  allNonRequiredIsEmptyAndHaveNotRequired = false;
  isHostedByArray = false;

  private loadedComponents: LoadedComponent[] = [];

  ngOnInit(): void {
    this.required = this.schema.required || [];
    // Note: skip UBLExtensions for now
    this.nonRequired = Object.keys(this.schema.properties).filter(n => n !== 'UBLExtensions').filter(name => !this.schema.required.includes(name)) || [];
    this.isHostedByArray =  this.parentFormGroup instanceof FormArray;

    this.populateModel();
    this.initRequired();

    if (this.loadNonRequiredIfRequiredIsEmpty && this.required.length === 0 && isEmpty(this.model)) {
      this.isExpanded.set(true);
      this.setupNonRequiredComponent();
      this.nonRequiredAdded = true;
    }

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
    this.closeComponents();
  }

  onOpen() {
    this.initNonRequired();
  }

  private initNonRequired() {
    this.isExpanded.set(true);
    if (!this.nonRequiredAdded) {
      // this is first and only time to load non-required
      this.setupNonRequiredComponent();
      this.nonRequiredAdded = true;
    } else {
      if(this.vcr()?.length === 0) {
        // means clear all components, so reset required and non-required
        this.populateModel(); // is needed?
        this.initRequired(); // likely required is empty
        this.setupNonRequiredComponent();
      } else {
        this.loadedComponents.filter((component) => !component.isRequired && !component.isLoaded).forEach((component) => {
              if (component.component) {
                this.vcr().insert(component.viewRef, component.position);
                component.isLoaded = true;
              }
              if (component.array && (component.array.formArray.length === 0 || component.array.formArray.controls.every(control => isEmpty(control.value)))) {
                this.vcr().insert(component.viewRef, component.position);
                component.isLoaded = true;
              }
            })
      }
    }
  }

  private initRequired() {
    // if(!isEmpty(this.model)) {
    //   Object.keys(this.model).forEach((name) => {
    //     if (!!this.model[name] && this.required.includes(name)) {
    //       const field = this.schema.properties[name];
    //       const data = this.model[name];
    //       this.setupComponent(field, data, name);
    //     }
    //   })
    // }

    this.required.forEach((name) => {
      if (!this.loadedComponents.filter(c => c.isLoaded).map(c => c.name).includes(name)) {
        const field = this.schema.properties[name];
        const data = this.model ? this.model[name] : {};
        this.setupComponent(field, data, name, false);
      }
    })
  }

  private setupNonRequiredComponent() {
    this.getNonRequiredSchema();
    this.nonRequired.forEach((name) => {
      if (!this.loadedComponents.filter(c => c.isLoaded).map(c => c.name).includes(name)) {
        const field = this.schema.properties[name];
        const data = this.model ? this.model[name] : {};
        this.setupComponent(field, data, name, false);
      }
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
        position: this.vcr().length - 1,
        array: null,
        name: name,
        isLoaded: true
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
        position: this.vcr().length - 1,
        array: null,
        name: name,
        isLoaded: true
      });
    } else if (field instanceof Array) {
      this.arrayComponentRef = this.vcr()?.createComponent(ArrayComponent);
      this.arrayComponentRef?.setInput('model', data);
      this.arrayComponentRef?.setInput('schema', field.items);
      this.arrayComponentRef?.setInput('title', field.title);
      this.arrayComponentRef?.setInput('formGroupKey', name);
      this.arrayComponentRef?.setInput('parentFormGroup', this.formGroup);

      this.loadedComponents.push({
        array: this.arrayComponentRef.instance,
        viewRef: this.vcr().get(this.vcr().length - 1),
        isRequired: isRequired,
        position: this.vcr().length - 1,
        component: null,
        name: name,
        isLoaded: true
      });
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
        position: this.vcr().length - 1,
        array: null,
        name: name,
        isLoaded: true
      });
    }
  }

  private closeComponents() {
    if (this.vcr()?.length > 0) {
      const nonRequiredComponents = this.loadedComponents.filter((component) => !component.isRequired);
      const requiredComponents = this.loadedComponents.filter((component) => component.isRequired);

      if (this.required.length === 0) {
        this.allNonRequiredIsEmptyAndHaveNotRequired = nonRequiredComponents.every((component) => (component.component && isEmpty(component.component.formGroup?.value))
          || (component.array && component.array.formArray.controls.every(control => isEmpty(control.value))));
        if (this.allNonRequiredIsEmptyAndHaveNotRequired) {
          this.vcr().clear();
          this.loadedComponents = [];
        } else {
          nonRequiredComponents.forEach((component) => {
            this.closeAComponent(component);
          });
        }
      } else {
        nonRequiredComponents.forEach((component) => {
          this.closeAComponent(component);
        });

        requiredComponents.forEach((component) => {
          component.component.onClose();
        });
      }
    }
  }

  private closeAComponent(component) {
    if (component.component) {
      if (isEmpty(component.component.formGroup.value)) {
        const index = this.vcr().indexOf(component.viewRef);
        if (index >= 0) {
          this.vcr().detach(index);
          component.isLoaded = false;
        }
      } else {
        component.component.onClose();
      }
    }
    if (component.array) {
      if (component.array.formArray.length === 0 || component.array.formArray.controls.every(control => isEmpty(control.value))) {
        const index = this.vcr().indexOf(component.viewRef);
        if (index >= 0) {
          this.vcr().detach(index);
          component.isLoaded = false;
        }
      } else {
        component.array.formArray.controls.forEach(control => {
          if (control instanceof BasicComponent || control instanceof AggregateComponent || control instanceof RefComponent) {
            control.onClose();
          }
        })
      }
    }
  }

  private populateModel() {
    if (!isEmpty(this.model)) {
      this.getNonRequiredSchema();
      Object.keys(this.model).forEach((name) => {
        // if (!!this.model[name] && this.nonRequired.includes(name)) { //will including required and non-required fields
        if (!!this.model[name] && Object.keys(this.schema.properties).includes(name)) {
          const field = this.schema.properties[name];
          const data = this.model[name];
          this.setupComponent(field, data, name, false);
        }
      })
    }
  }

private getNonRequiredSchema() {
  if (this.nonRequired.length === 0) {
    const ref = typeof this.formGroupKey === 'number' ? this.refName : this.formGroupKey;
    const non_required = this.service.getNonRequiredAggregatesByRef(ref);
    this.schema.properties = { ...this.schema.properties, ...non_required.properties };
    this.nonRequired = Object.keys(this.schema.properties)
      .filter(name => name !== 'UBLExtensions' && !this.schema.required.includes(name)) || [];
  }
}
}
