// import {Component, ComponentRef, inject, Input, OnInit, viewChild, ViewContainerRef} from '@angular/core';
// import {DocumentService} from "../service/document.service";
// import {Aggregate, Properties, removeNulls, UblDocument, UblElementType} from "../service/util";
// import {FormGroup, ReactiveFormsModule} from "@angular/forms";
// import {BasicComponent} from "./basic.component";
// import {JsonPipe} from "@angular/common";
// import {BasicService} from "../service/basic.service";
// import {AggregateService} from "../service/aggregate.service";
// import {SchematicEngineHost} from "@angular/cli/src/command-builder/utilities/schematic-engine-host";
// import {GroupComponent} from "./group.component";
//
// @Component({
//   selector: 'ubl-doc',
//   standalone: true,
//   imports: [
//     ReactiveFormsModule,
//     JsonPipe
//   ],
//   template: `
//     <form [formGroup]="formGroup">
//       <div>{{ doc?.title }}</div>
//       <div>{{ doc?.description }}</div>
//       <ng-container #container></ng-container>
//     </form>
//     {{ removeNulls(formGroup.value) | json }}
//   `,
//   styles: ``
// })
// export class DocComponent implements OnInit {
//   @Input() model?: any;
//   @Input() title?: string;
//   @Input() docTypeName: string;
//
//   docService = inject(DocumentService);
//   aggregateService = inject(AggregateService);
//   basicService = inject(BasicService);
//
//   doc: UblDocument;
//   formGroup = new FormGroup({});
//   vcr = viewChild('container', {read: ViewContainerRef});
//   basicComponentRef?: ComponentRef<BasicComponent>;
//   groupComponentRef?: ComponentRef<GroupComponent>;
//
//   async ngOnInit() {
//     // this.doc = await this.docService.getDocTypeRequiredSchemas('Invoice');
//     this.doc = {} as UblDocument;
//     console.dir(this.doc)
//     this.vcr()?.clear()
//
//     this.doc?.required.forEach((name) => {
//       const field = this.doc.properties[name];
//       const model = this.model ? this.model[name] : {};
//
//       if (field['type'] === 'object') {
//         this.basicComponentRef = this.vcr()?.createComponent(BasicComponent);
//         this.basicComponentRef?.setInput('model', model);
//         this.basicComponentRef?.setInput('schema', field);
//         this.basicComponentRef?.setInput('title', field['title']);
//         this.basicComponentRef?.setInput('formGroupKey', name);
//         this.basicComponentRef?.setInput('parentFormGroup', this.formGroup);
//       } else if (field['type'] === 'array') {
//         this.groupComponentRef = this.vcr()?.createComponent(GroupComponent);
//         this.groupComponentRef?.setInput('model', model);
//         this.groupComponentRef?.setInput('aggregates', field['schemas']);
//         this.groupComponentRef?.setInput('title', field['title']);
//         this.groupComponentRef?.setInput('formGroupKey', name);
//         this.groupComponentRef?.setInput('parentFormGroup', this.formGroup);
//         this.groupComponentRef?.setInput('elementType', UblElementType.ArrayAggregate);
//       } else if (field['type'] === undefined) {
//         const schemas = field['schemas'];
//         if (Array.isArray(schemas) && schemas.length === 0) {
//           const nonRequiredFields = this.aggregateService.getNonRequiredAggregateGroupSchemasByName(name);
//           this.groupComponentRef = this.vcr()?.createComponent(GroupComponent);
//           this.groupComponentRef?.setInput('model', model);
//           this.groupComponentRef?.setInput('aggregates', nonRequiredFields);
//           this.groupComponentRef?.setInput('title', field['title']);
//           this.groupComponentRef?.setInput('formGroupKey', name);
//           this.groupComponentRef?.setInput('parentFormGroup', this.formGroup);
//           this.groupComponentRef?.setInput('elementType', UblElementType.NonRequiredAggregate);
//           console.log(nonRequiredFields);
//         } else if (Array.isArray(schemas) && schemas.length === 1) {
//           this.groupComponentRef = this.vcr()?.createComponent(GroupComponent);
//           this.groupComponentRef?.setInput('model', model);
//           this.groupComponentRef?.setInput('aggregates', schemas);
//           this.groupComponentRef?.setInput('title', field['title']);
//           this.groupComponentRef?.setInput('formGroupKey', name);
//           this.groupComponentRef?.setInput('parentFormGroup', this.formGroup);
//           this.groupComponentRef?.setInput('elementType', UblElementType.RequiredAggregate);
//         }
//       } else {
//         console.log(`cannot handle ${name}`);
//       }
//     });
//
//   }
//
//   protected readonly removeNulls = removeNulls;
// }
