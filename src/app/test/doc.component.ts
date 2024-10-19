import {Component, ComponentRef, inject, Input, OnInit, viewChild, ViewContainerRef} from '@angular/core';
import {DocumentService} from "../service/document.service";
import {removeNulls, UblDocument} from "../service/util";
import {FormGroup, ReactiveFormsModule} from "@angular/forms";
import {BasicComponent} from "./basic.component";
import {JsonPipe} from "@angular/common";
import {BasicService} from "../service/basic.service";
import {AggregateService} from "../service/aggregate.service";

@Component({
  selector: 'ubl-doc',
  standalone: true,
  imports: [
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
export class DocComponent implements OnInit {
  @Input() model?: any;
  @Input() title?: string;
  @Input() docTypeName: string;

  docService = inject(DocumentService);
  aggregateService = inject(AggregateService);
  basicService = inject(BasicService);

  doc: UblDocument;
  formGroup = new FormGroup({});
  vcr = viewChild('container', {read: ViewContainerRef});
  basicComponentRef?: ComponentRef<BasicComponent>;

  async ngOnInit() {
    this.doc = await this.docService.getDocTypeRequiredSchemas('ApplicationResponse');
    console.dir(this.doc)
    this.vcr()?.clear()

    this.doc?.required.forEach((requiredName) => {
      let field = this.doc.properties[requiredName];
      // if type is object, means it get the basic schema
      // else this required field has not required fields, so get all non-required fields
      if (field['type'] === 'object') {
        this.basicComponentRef = this.vcr()?.createComponent(BasicComponent)
        this.basicComponentRef?.setInput('model', this.model ? this.model[requiredName] : {})
        this.basicComponentRef?.setInput('schema', field)
        this.basicComponentRef?.setInput('formGroupKey', requiredName)
        this.basicComponentRef?.setInput('parentFormGroup', this.formGroup)
      } else if (Array.isArray(field) && field.length === 0) {
        // empty array means it has no required fields
        let nonRequiredFields = this.aggregateService.getNonRequiredAggregateGroupSchemasByName(requiredName)
        console.log(nonRequiredFields)
      }
      // todo: handle array type, no-require fields
    })
  }

  protected readonly removeNulls = removeNulls;
}
