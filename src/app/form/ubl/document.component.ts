import {
  Component,
  inject,
  input,
  Input,
  OnChanges,
  OnInit,
  output,
  signal,
  SimpleChanges,
  viewChild,
  ViewContainerRef
} from '@angular/core';
import {BasicComponent} from "./basic.component";
import {FormGroup, ReactiveFormsModule} from "@angular/forms";
import {
  camelCaseToTitle,
  clearFormGroup,
  closeComponents,
  isEmpty,
  removeEmpty,
  setupAComponent
} from "../../service/util";
import {DocumentService} from "../../service/document.service";
import {AggregateService} from "../../service/aggregate.service";
import {BasicService} from "../../service/basic.service";
import Document = Ubl.Document;
import {JsonPipe} from "@angular/common";
import {LoadedComponent, Ubl} from "../../model/ubl.model";
import {ThreeDotsComponent} from "../helper/three.dots.component";
import {UpComponent} from "../helper/up.component";
import {AddComponent} from "../helper/add.component";
import {RemoveComponent} from "../helper/remove.component";
import {ExpandComponent} from "../helper/expand.component";


@Component({
  selector: 'ubl-document',
  standalone: true,
  imports: [
    BasicComponent,
    ReactiveFormsModule,
    JsonPipe,
    ThreeDotsComponent,
    UpComponent,
    AddComponent,
    RemoveComponent,
    ExpandComponent
  ],
  template: `
    <form [formGroup]="formGroup">
      <div class="document-container">
        <div class="title">{{ convertTitle(docSchema?.title) }}</div>
        <div class="sub-title">
          <div class="description">
            {{ docSchema?.description }}
          </div>

          <div class="right-conner">
            @if (isExpanded()) {
              <ubl-up (closeRequest)="onClose()"></ubl-up>
            } @else {
              <ubl-three-dots (openRequest)="onOpen()"></ubl-three-dots>
            }
          </div>
        </div>

        <ng-container #container></ng-container>

      </div>
    </form>

    @if (isLoading()) {
      <div class="spinner-container">
        <div class="loader"></div>
      </div>
    }
  `,
  styles: `
    .document-container {
      padding: 0px 1rem;
      display: flex;
      flex-direction: column;
    }

    .title {
      font-size: 2.5rem;
      font-weight: 600;
      align-self: center;
    }

    .sub-title {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }

    .description {
      padding-left: 1.5rem;
      font-size: 1.5rem;
      font-weight: 500;
      flex-grow: 1;
      text-align: center;
    }

    .right-conner {
      justify-self: end;
      align-self: center;
      padding-right: 0.5rem;
    }

    // Loader
    .spinner-container {
      display: flex;
      justify-content: center;
      text-align: center;
      min-height: 100vh;
    }

    .loader {
      width: 48px;
      height: 48px;
      border: 5px solid #71fdfd;
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

export class DocumentComponent implements OnInit, OnChanges {


  @Input() model?: object;
  @Input() docTypeName: string;

  onDataChange = output<object>();


  isExpanded = signal(false);
  isLoading = signal(false);

  protected readonly removeEmpty = removeEmpty;

  docService = inject(DocumentService);

  docSchema: Document;
  formGroup = new FormGroup({});
  vcr = viewChild('container', {read: ViewContainerRef});

  required = []
  nonRequired = [];
  nonRequiredAdded = false;

  private loadedComponents: LoadedComponent[] = [];

  convertTitle = (value: string) => camelCaseToTitle(value?.replace('. Type', '').replace('. Details', ''));

  async ngOnInit() {
    this.isLoading.set(true);

    this.docSchema = await this.docService.getDocumentRequiredSchema(this.docTypeName);
    this.vcr()?.clear()
    clearFormGroup(this.formGroup)

    this.required = this.docSchema.required || [];

    await this.populateModel();
    this.initRequired();

    this.formGroup.valueChanges.subscribe((value) => {
        this.onDataChange.emit(this.formGroup.value);
    })
    this.isLoading.set(false);


    // this.formGroup.valueChanges.subscribe((value) => {
    //   this.onDataChange.emit(this.formGroup.value);
    // })
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if(changes.docTypeName && changes.docTypeName.currentValue !== changes.docTypeName.previousValue) {
      await this.setupDocumentComponent();
    }

    if(changes.model && changes.model.currentValue !== changes.model.previousValue) {
      await this.setupDocumentComponent();
    }
  }

  onClose() {
    this.isExpanded.set(false);
    closeComponents(this.loadedComponents, this.vcr(), this.required);
  }

  async onOpen() {
    this.isExpanded.set(true);
    if (!this.nonRequiredAdded) {
      await this.initNonRequired();
      this.nonRequiredAdded = true;
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

  private async setupDocumentComponent() {
    this.isLoading.set(true);

    this.docSchema = await this.docService.getDocumentRequiredSchema(this.docTypeName);
    this.vcr()?.clear()
    clearFormGroup(this.formGroup)

    this.required = this.docSchema.required || [];

    await this.populateModel();
    this.initRequired();


    this.isLoading.set(false);
  }

  private initRequired() {
    this.required.forEach((name) => {
      if (!this.loadedComponents.filter(c => c.isLoaded).map(c => c.name).includes(name)) {
        const schema = this.docSchema.properties[name];
        const data = this.model ? this.model[name] : {};
        setupAComponent(this.loadedComponents, this.vcr(), this.formGroup, schema, data, name, true, true);
      }
    })
  }

  private async initNonRequired() {
    let nonRequiredFields = await this.docService.getDocumentNonRequiredSchema(this.docTypeName);
    let nonRequiredFieldNames = Object.keys(nonRequiredFields.properties)
    nonRequiredFieldNames.forEach((name) => {
      // is this logic correct? is possible isLoaded is false but the component is already existing to cause duplicate?
      if (!this.loadedComponents.filter(c => c.isLoaded).map(c => c.name).includes(name)) {
        const schema = nonRequiredFields.properties[name];
        const data = this.model ? this.model[name] : {};
        setupAComponent(this.loadedComponents, this.vcr(), this.formGroup, schema, data, name, false, true);
      }
    })
  }

  private async populateModel() {
    if (!isEmpty(this.model)) {
      await this.getNonRequiredSchema();
      Object.keys(this.model).forEach((name) => {
        let isRequired = this.docSchema.required.includes(name);
        if (!!this.model[name] && Object.keys(this.docSchema.properties).includes(name)) {
          const schema = this.docSchema.properties[name];
          const data = this.model[name];
          setupAComponent(this.loadedComponents, this.vcr(), this.formGroup, schema, data, name, isRequired, true);
        }
      })
    }
  }

  private async getNonRequiredSchema() {
    if (this.nonRequired.length === 0) {
      const non_required = await this.docService.getDocumentNonRequiredSchema(this.docTypeName)
      this.docSchema.properties = {...this.docSchema.properties, ...non_required.properties};
      this.nonRequired = Object.keys(this.docSchema.properties)
        .filter(name => name !== 'UBLExtensions' && !this.docSchema.required.includes(name)) || [];
    }
  }

}
