import {Component, ComponentRef, inject, Input, OnInit, viewChild, ViewContainerRef} from '@angular/core';
import {BasicComponent} from "./basic.component";
import {DocumentService} from "../service/document.service";
import {JsonPipe} from "@angular/common";
import {FormGroup, ReactiveFormsModule} from "@angular/forms";
import {Aggregate, Schema, UblElementType} from "../service/util";

@Component({
  selector: 'ubl-group',
  standalone: true,
  imports: [
    BasicComponent,
    JsonPipe,
    ReactiveFormsModule
  ],
  template: `
    <ng-container [formGroup]="group">
      <fieldset>
        <legend>{{ title }}</legend>
        <ng-container #groupContainer></ng-container>
      </fieldset>
    </ng-container>
  `,
  styles: `
    fieldset {
      border-radius: 10px;
      border: 1px solid #607d8b;
      margin-top: 8px;
    }
    legend {
      font-weight: bold;
    }
  `
})
export class GroupComponent implements OnInit {
  @Input() model: any;
  @Input() aggregates: Aggregate[] = [];
  @Input({ required: true }) formGroupKey = '';
  @Input({ required: true }) title = '';
  @Input({ required: true }) parentFormGroup: FormGroup;
  @Input({ required: true }) elementType: UblElementType;

  group: FormGroup = new FormGroup({});
  vcr = viewChild('groupContainer', {read: ViewContainerRef});
  basicComponentRef?: ComponentRef<BasicComponent>;
  groupComponentRef?: ComponentRef<GroupComponent>;

  ngOnInit() {
    console.log('GroupComponent', this.aggregates);
    if(UblElementType.RequiredAggregate === this.elementType) {
      this.aggregates.forEach((aggregate) => {
        const schema = aggregate.schemas as Schema;
        const model = this.model ? this.model[aggregate.key] : {};
        this.basicComponentRef = this.vcr()?.createComponent(BasicComponent);
        this.basicComponentRef.setInput('model', model);
        this.basicComponentRef.setInput('schema', schema);
        this.basicComponentRef.setInput('title', schema.title);
        this.basicComponentRef.setInput('formGroupKey', aggregate.key);
        this.basicComponentRef.setInput('parentFormGroup', this.group);
      });

      this.parentFormGroup.addControl(this.formGroupKey, this.group);
    } else if(UblElementType.NonRequiredAggregate === this.elementType) {
      console.log('GroupComponent', this.aggregates);
      this.aggregates.forEach((aggregate) => {
        if(aggregate.type === undefined){
          if(Array.isArray(aggregate.schemas)){
            // handle array
          } else {
            const schema = aggregate.schemas as Schema;
            const model = this.model ? this.model[aggregate.key] : {};
            this.basicComponentRef = this.vcr()?.createComponent(BasicComponent);
            this.basicComponentRef?.setInput('model', model);
            this.basicComponentRef?.setInput('schema', schema);
            this.basicComponentRef?.setInput('title', aggregate['title']);
            this.basicComponentRef?.setInput('formGroupKey', aggregate.key);
            this.basicComponentRef?.setInput('parentFormGroup', this.group);

            this.parentFormGroup.addControl(this.formGroupKey, this.group);
          }
        } else if (aggregate.type === 'array') {
          // handle array
        }
      })
    }

  }

}
