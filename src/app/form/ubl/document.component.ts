import {Component, ComponentRef, inject, Input, OnInit, viewChild, ViewContainerRef} from '@angular/core';
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
import {Ubl} from "../../model/ubl.mdel";
import Aggregate = Ubl.Aggregate;

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
    JsonPipe
  ],
  template: `
    <form [formGroup]="formGroup">
      <div>{{ doc?.title }}</div>
      <div>{{ doc?.description }}</div>
      <ng-container #container></ng-container>
    </form>
    <pre>{{ removeEmpty(formGroup.value) | json }}</pre>
  `,
  styles: ``
})
// todo: need to add expand to load non-required fields
export class DocumentComponent implements OnInit {
  @Input() model?: any;
  @Input() title?: string;
  @Input() docTypeName: string;

  docService = inject(DocumentService);
  aggregateService = inject(AggregateService);
  basicService = inject(BasicService);

  doc: Document;
  formGroup = new FormGroup({});
  vcr = viewChild('container', {read: ViewContainerRef});
  basicComponentRef?: ComponentRef<BasicComponent>;
  groupComponentRef?: ComponentRef<AggregateComponent>;

  protected readonly removeNulls = removeEmpty;


  async ngOnInit() {
    this.doc = await this.docService.getDocumentRequiredSchema(this.docTypeName);
    console.dir(this.doc)
    this.vcr()?.clear()

    // this.doc?.required.filter(r => r === 'InvoiceLine').forEach((name) => {
    this.doc?.required.forEach((name) => {
      const field = this.doc.properties[name];
      const data = this.model ? this.model[name] : {};

      if (field instanceof Basic) {
        this.basicComponentRef = this.vcr()?.createComponent(BasicComponent);
        this.basicComponentRef?.setInput('model', data);
        this.basicComponentRef?.setInput('schema', field);
        this.basicComponentRef?.setInput('title', field.title);
        this.basicComponentRef?.setInput('formGroupKey', name);
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
      }
    })
  }

  protected readonly removeEmpty = removeEmpty;
}
