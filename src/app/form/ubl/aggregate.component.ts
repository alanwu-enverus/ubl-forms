import {
  Component,
  ComponentRef,
  inject, input,
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
import {AggregateService} from "../../service/aggregate.service";
import {RefComponent} from "./ref.component";
import {camelCaseToTitle, clearFormGroup, closeComponents, isEmpty, setupAComponent} from "../../service/util";
import {ThreeDotsComponent} from "../helper/three.dots.component";
import {ArrayComponent} from "./array.component";

@Component({
    selector: 'ubl-aggregate',
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
          <div class="title"> {{ title() }}</div>
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
        gap: 0.3rem;
        background: gainsboro;
        padding: 0.1rem 0.3rem;

        .title {
          font-size: 1.5rem;
        }
      }

      .folder {
        margin: 0 0 0.5em 0.86em;
        padding: 0.5em 0em 0.5em 0.5em;
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
  @Input({required: true}) description = '';
  @Input({required: true}) loadNonRequiredIfRequiredIsEmpty: boolean = false;
  @Input({required: true}) refName: string;  // this is used by RefComponent and ArrayComponent that has only required schemas
  title = input('title', {
    transform: (value: string) => camelCaseToTitle(value?.replace('. Type', '').replace('. Details', ''))
  });

  public formGroup: FormGroup = new FormGroup({});
  vcr = viewChild('items', {read: ViewContainerRef});

  service = inject(AggregateService);

  isExpanded = signal(false);
  isLoading = signal(false);

  required = []
  nonRequired = [];
  nonRequiredAdded = false;
  isHostedByArray = false;

  private loadedComponents: LoadedComponent[] = [];

  ngOnInit(): void {
    this.required = this.schema.required || [];
    // Note: skip UBLExtensions for now
    this.nonRequired = Object.keys(this.schema.properties).filter(n => n !== 'UBLExtensions').filter(name => !this.schema.required.includes(name)) || [];
    this.isHostedByArray = this.parentFormGroup instanceof FormArray;

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
    closeComponents(this.loadedComponents, this.vcr(), this.required);
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
      if (this.vcr()?.length === 0 && this.loadedComponents.length === 0 ) {
        // means clear all components, so reset required and non-required
        clearFormGroup(this.formGroup);

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
    this.required.forEach((name) => {
      if (!this.loadedComponents.filter(c => c.isLoaded).map(c => c.name).includes(name)) {
        const schema = this.schema.properties[name];
        const data = this.model ? this.model[name] : {};
        setupAComponent(this.loadedComponents, this.vcr(), this.formGroup, schema, data, name, true);
      }
    })
  }

  private setupNonRequiredComponent() {
    this.getNonRequiredSchema();
    this.nonRequired.forEach((name) => {
      // is this logic correct? is possible isLoaded is false but the component is already existing to cause duplicate?
      if (!this.loadedComponents.filter(c => c.isLoaded).map(c => c.name).includes(name)) {
        const schema = this.schema.properties[name];
        const data = this.model ? this.model[name] : {};
        setupAComponent(this.loadedComponents, this.vcr(), this.formGroup, schema, data, name, false);
      }
    })
  }


  private populateModel() {
    if (!isEmpty(this.model)) {
      this.getNonRequiredSchema();
      Object.keys(this.model).forEach((name) => {
        if (!!this.model[name] && Object.keys(this.schema.properties).includes(name)) {
          const schema = this.schema.properties[name];
          const data = this.model[name];
          setupAComponent(this.loadedComponents, this.vcr(), this.formGroup, schema, data, name, this.required.includes(name));
        }
      })
    }
  }

  private getNonRequiredSchema() {
    if (this.nonRequired.length === 0) {
      const ref = typeof this.formGroupKey === 'number' ? this.refName : this.formGroupKey;
      const non_required = this.service.getNonRequiredAggregatesByRef(ref);
      this.schema.properties = {...this.schema.properties, ...non_required.properties};
      this.nonRequired = Object.keys(this.schema.properties)
        .filter(name => name !== 'UBLExtensions' && !this.schema.required.includes(name)) || [];
    }
  }
}
