import {Component, ComponentRef, inject, Input, OnInit, viewChild, ViewContainerRef} from '@angular/core';
import {BasicComponent} from "./basic.component";
import {FormGroup, ReactiveFormsModule} from "@angular/forms";
import {removeNulls} from "../../service/util";
import {DocumentService} from "../../service/document.service";
import {AggregateService} from "../../service/aggregate.service";
import {BasicService} from "../../service/basic.service";
import Document = Ubl.Document;
import Basic = Ubl.Basic;
import {AggregateComponent} from "./aggregate.component";
import {JsonPipe} from "@angular/common";
import {Ubl} from "../../model/ubl.mdel";
import isBasic = Ubl.isBasic;

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
    {{ removeNulls(formGroup.value) | json }}
  `,
  styles: ``
})
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

  protected readonly removeNulls = removeNulls;



  async ngOnInit() {
    this.doc = await this.docService.getDocumentRequiredSchema(this.docTypeName);
    console.dir(this.doc)
    this.vcr()?.clear()

    this.doc?.required.forEach((name) => {
      const field = this.doc.properties[name];
      const model = this.model ? this.model[name] : {};

      if(isBasic(field)) {
        this.basicComponentRef = this.vcr()?.createComponent(BasicComponent);
        this.basicComponentRef?.setInput('model', model);
        this.basicComponentRef?.setInput('schema', field);
        this.basicComponentRef?.setInput('title', field['title']);
        this.basicComponentRef?.setInput('formGroupKey', name);
        this.basicComponentRef?.setInput('parentFormGroup', this.formGroup);
      }
    })
  }
}
