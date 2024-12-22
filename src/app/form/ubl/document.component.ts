import {Component, ComponentRef, inject, Input, OnInit, signal, viewChild, ViewContainerRef} from '@angular/core';
import {BasicComponent} from "./basic.component";
import {FormGroup, ReactiveFormsModule} from "@angular/forms";
import {removeEmpty} from "../../service/util";
import {DocumentService} from "../../service/document.service";
import {AggregateService} from "../../service/aggregate.service";
import {BasicService} from "../../service/basic.service";
import Document = Ubl.Document;
import Basic = Ubl.Basic;
import {AggregateComponent} from "./aggregate.component";
import {JsonPipe} from "@angular/common";
import {Ubl} from "../../model/ubl.model";
import Aggregate = Ubl.Aggregate;
import Array = Ubl.Array;
import {ArrayComponent} from "./array.component";
import {ThreeDotsComponent} from "../helper/three.dots.component";
import {UpComponent} from "../helper/up.component";

/*
  1. when the first level, can skip the required clicking to expand. otherwise, too many expand in such as party has 4 expands
  2. when click expand, load reference schema and create aggregate component
 */

@Component({
  selector: 'ubl-document',
  standalone: true,
  imports: [
    BasicComponent,
    ReactiveFormsModule,
    JsonPipe,
    ThreeDotsComponent,
    UpComponent
  ],
  template: `
    <form [formGroup]="formGroup">
      <div class="document-container">
        <div class="title">{{ doc?.title }}</div>
        <div class="sub-title">
          <div class="description">
            {{ doc?.description }}
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
    <pre>{{ removeEmpty(formGroup.value) | json }}</pre>
  `,
  styles: `
    .document-container {
      padding: 0px 0.4rem;
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


  `
})
// todo: need to add expand to load non-required fields
export class DocumentComponent implements OnInit {
  @Input() model?: any;
  @Input() title?: string;
  @Input() docTypeName: string;

  isExpanded = signal(false);
  protected readonly removeEmpty = removeEmpty;
  nonRequiredAdded = false;

  docService = inject(DocumentService);
  aggregateService = inject(AggregateService);
  basicService = inject(BasicService);

  doc: Document;
  formGroup = new FormGroup({});
  vcr = viewChild('container', {read: ViewContainerRef});
  basicComponentRef?: ComponentRef<BasicComponent>;
  groupComponentRef?: ComponentRef<AggregateComponent>;
  arrayComponentRef?: ComponentRef<ArrayComponent>;


  async ngOnInit() {
    this.doc = await this.docService.getDocumentRequiredSchema(this.docTypeName);
    this.vcr()?.clear()

    // this.doc?.required.filter(r => r === 'InvoiceLine').forEach((name) => {
    //   const schema = this.doc.properties[name];
    //   this.setupComponent(schema, this.model, name);
    // });

    this.doc?.required.forEach((name) => {
      const field = this.doc.properties[name];
      const data = this.model ? this.model[name] : {};
      this.setupComponent(field, data, name);
    })

  }

  onClose() {
    this.isExpanded.set(false);
  }

  async onOpen() {
    this.isExpanded.set(true);
    if (!this.nonRequiredAdded) {
      await this.getNonRequired();
      this.nonRequiredAdded = true;
    }
  }

  private setupComponent(field: Ubl.Basic | Ubl.Aggregate | Array | Ubl.Extension, data, name) {
    if (field instanceof Basic) {
      this.basicComponentRef = this.vcr()?.createComponent(BasicComponent);
      this.basicComponentRef?.setInput('model', data);
      this.basicComponentRef?.setInput('schema', field);
      this.basicComponentRef?.setInput('title', name);
      this.basicComponentRef?.setInput('formGroupKey', name);
      this.basicComponentRef?.setInput('documentLevel', true);
      this.basicComponentRef?.setInput('parentFormGroup', this.formGroup);
    } else if (field instanceof Aggregate) {
      this.groupComponentRef = this.vcr()?.createComponent(AggregateComponent);
      this.groupComponentRef?.setInput('model', data);
      this.groupComponentRef?.setInput('schema', field);
      this.groupComponentRef?.setInput('title', field.title);
      this.groupComponentRef?.setInput('description', field.description);
      this.groupComponentRef?.setInput('formGroupKey', name);
      this.groupComponentRef?.setInput('parentFormGroup', this.formGroup);
      this.groupComponentRef?.setInput('loadNonRequiredIfRequiredIsEmpty', true);
    } else if (field instanceof Array) {
      this.arrayComponentRef = this.vcr()?.createComponent(ArrayComponent);
      this.arrayComponentRef?.setInput('model', data);
      this.arrayComponentRef?.setInput('schema', field.items);
      this.arrayComponentRef?.setInput('title', field.title);
      this.arrayComponentRef?.setInput('formGroupKey', name);
      this.arrayComponentRef?.setInput('parentFormGroup', this.formGroup);
    }
  }




  private async getNonRequired() {
    let nonRequiredFields = await this.docService.getDocumentNonRequiredSchema(this.docTypeName);
    let nonRequiredFieldNames = Object.keys(nonRequiredFields.properties)
    nonRequiredFieldNames.forEach((name) => {
      const field = nonRequiredFields.properties[name];
      const data = this.model ? this.model[name] : {};
      this.setupComponent(field, data, name);
    })
  }
}
