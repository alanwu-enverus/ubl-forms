import {Component, inject, input, Input, OnInit, signal, viewChild, ViewContainerRef} from '@angular/core';
import {BasicComponent} from "./basic.component";
import {FormGroup, ReactiveFormsModule} from "@angular/forms";
import {camelCaseToTitle, closeComponents, isEmpty, removeEmpty, setupAComponent} from "../../service/util";
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
        <div class="loader"> </div>
      </div>
    }
    <div class="note">
      Please note: <ubl-three-dots></ubl-three-dots> is to expand the section. <ubl-expand></ubl-expand> is to load a component <ubl-up></ubl-up> is to collapse the section. <ubl-add></ubl-add> is to add a new item. <ubl-remove></ubl-remove> is to remove an item.
    </div>

    <pre>{{ removeEmpty(formGroup.value) | json }}</pre>
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

    .note{
      padding: 1rem;
      font-size: 1.8rem;
      font-weight: 100;
      text-align: center;
    }

    // Loader
    .spinner-container {
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: 100vh;
    }

    .loader {
      border: 16px solid #f3f3f3;
      border-radius: 50%;
      border-top: 16px solid #3498db;
      width: 120px;
      height: 120px;
      -webkit-animation: spin 2s linear infinite; /* Safari */
      animation: spin 2s linear infinite;
    }

    /* Safari */
    @-webkit-keyframes spin {
      0% { -webkit-transform: rotate(0deg); }
      100% { -webkit-transform: rotate(360deg); }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `
})

export class DocumentComponent implements OnInit {
  @Input() model?: any;
  @Input() docTypeName: string;

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

    this.required = this.docSchema.required || [];

    await this.populateModel();
    this.initRequired();

    this.isLoading.set(false);
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
