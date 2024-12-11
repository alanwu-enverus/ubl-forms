import {
  Component,
  ComponentRef,
  inject,
  Input,
  OnInit,
  signal,
  viewChild,
  ViewContainerRef,
  ViewRef
} from '@angular/core';
import {FormGroup, ReactiveFormsModule} from "@angular/forms";
import {Ubl} from "../../model/ubl.mdel";
import Aggregate = Ubl.Aggregate;
import {BasicComponent} from "./basic.component";
// import {DownComponent} from "../helper/down.component";
import {UpComponent} from "../helper/up.component";
import Basic = Ubl.Basic;
import Extension = Ubl.Extension;
import NextRef = Ubl.NextRef;
import {AggregateService} from "../../service/aggregate.service";
import {RefComponent} from "./ref.component";
import {isEmpty} from "../../service/util";
import {ThreeDotsComponent} from "../helper/three.dots.component";

type UblElementType = Basic | Aggregate | Extension | NextRef;

interface LoadedComponent {
  component: BasicComponent | AggregateComponent | RefComponent;
  viewRef: ViewRef;
  isRequired: boolean;
  position: number;
}

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
            <ubl-three-dots (openRequest) ="onOpen()"  ></ubl-three-dots>
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
  @Input({required: true}) parentFormGroup: FormGroup;
  @Input({required: true}) title = '';
  @Input({required: true}) description = '';
  @Input({required: true}) loadNonRequiredIfRequiredIsEmpty: boolean = false;
  @Input({required: true}) refName: string;

  public formGroup: FormGroup = new FormGroup({});
  vcr = viewChild('items', {read: ViewContainerRef});
  basicComponentRef?: ComponentRef<BasicComponent>;
  aggregateComponentRef?: ComponentRef<AggregateComponent>;
  refComponentRef?: ComponentRef<RefComponent>;

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
    console.log('AggregateComponent', this.schema);
    this.required = this.schema.required;
    if (this.required?.length > 0) {
      this.initRequired();
    } else if (this.loadNonRequiredIfRequiredIsEmpty) {
      this.initNonRequired();
    }

    this.loadNonRequiredIfRequiredIsEmpty = false; // try to load non-required only once
    this.parentFormGroup.addControl(this.formGroupKey, this.formGroup);
  }

  onClose() {
    this.isExpanded.set(false);
    if (this.vcr()?.length > 0) {
      if (this.required.length === 0) {
        this.allNonRequiredIsEmptyAndHaveNotReqiured = this.loadedComponents.filter((component) => !component.isRequired).every((component) => isEmpty(component.component.formGroup?.value));
        if(this.allNonRequiredIsEmptyAndHaveNotReqiured) {
          this.vcr().clear();
        } else {
          this.loadedComponents.filter((component) => !component.isRequired).forEach((component) => {
            if (isEmpty(component.component.formGroup.value)) {
              try {
                let index = this.vcr().indexOf(component.viewRef);
                if(index >=0){
                  this.vcr().detach(index);
                }
                // this.vcr().detach(this.vcr().indexOf(component.viewRef));
              } catch (e) {
                console.error(e);
              }

              // this.vcr().detach(component.position);
            } else {
              component.component.onClose();
            }
          })
        }
      } else {
        this.loadedComponents.filter((component) => !component.isRequired).forEach((component) => {
          if (isEmpty(component.component.formGroup.value)) {
            let index = this.vcr().indexOf(component.viewRef);
            if(index >=0){
              this.vcr().detach(index);
            }
            // this.vcr().detach(this.vcr().indexOf(component.viewRef));
          } else {
            component.component.onClose();
          }
        })
      }

      this.loadedComponents.filter((component) => component.isRequired).forEach((component) => {
        component.component.onClose();
      })
    }
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
      const model = this.model ? this.model[name] : {};
      this.setupComponent(field, model, name);
    })
  }

  private getNonRequired() {
    this.schema = this.service.getNonRequiredAggregatesByRef(this.formGroupKey);
    this.nonRequired = Object.keys(this.schema.properties).filter(name => !this.schema.required.includes(name));
    this.nonRequired.forEach((name) => {
      const field = this.schema.properties[name];
      const model = this.model ? this.model[name] : {};
      this.setupComponent(field, model, name, false);
    })
  }

  private setupComponent(field: any, model, name, isRequired = true) {
    if (field instanceof Basic) {
      this.basicComponentRef = this.vcr()?.createComponent(BasicComponent);
      this.basicComponentRef?.setInput('model', model);
      this.basicComponentRef?.setInput('schema', field);
      // this.basicComponentRef?.setInput('title', field['title']);  // this seems not working
      this.basicComponentRef?.setInput('title', name);
      this.basicComponentRef?.setInput('formGroupKey', name);
      this.basicComponentRef?.setInput('parentFormGroup', this.formGroup);

      this.loadedComponents.push({component: this.basicComponentRef.instance, viewRef: this.vcr().get(this.vcr().length - 1), isRequired: isRequired, position: this.vcr().length - 1});
    } else if (field instanceof Aggregate) {
      this.aggregateComponentRef = this.vcr()?.createComponent(AggregateComponent);
      this.aggregateComponentRef?.setInput('model', model);
      this.aggregateComponentRef?.setInput('schema', field);
      this.aggregateComponentRef?.setInput('title', field['title']);
      this.aggregateComponentRef?.setInput('description', field['description']);
      this.aggregateComponentRef?.setInput('formGroupKey', name);
      this.aggregateComponentRef?.setInput('parentFormGroup', this.formGroup);

      this.loadedComponents.push({component: this.aggregateComponentRef.instance, viewRef: this.vcr().get(this.vcr().length - 1), isRequired: isRequired, position: this.vcr().length - 1});
    } else if (field instanceof Array) {
      console.log(`Array: ${field}`);
    } else if (field instanceof Extension) {
      console.log(`Extension: ${field}`);
    } else if (field instanceof NextRef) {
      console.log(`NextRef: ${field}`);
      this.refComponentRef = this.vcr()?.createComponent(RefComponent);
      this.refComponentRef?.setInput('model', model);
      this.refComponentRef?.setInput('title', field['title']);
      this.refComponentRef?.setInput('description', field['description']);
      this.refComponentRef?.setInput('parentFormGroup', this.formGroup);
      this.refComponentRef?.setInput('formGroupKey', name);
      this.refComponentRef?.setInput('ref', field['$ref']);
      // this.refComponentRef?.setInput('loadRef', this.loadNonRequiredIfRequiredIsEmpty);
      this.refComponentRef?.setInput('loadRef', false); // temp testing

      this.loadedComponents.push({component: this.refComponentRef.instance, viewRef: this.vcr().get(this.vcr().length - 1), isRequired: isRequired, position: this.vcr().length - 1});
    }
  }
}
