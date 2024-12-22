import {Component, ComponentRef, inject, Input, OnInit, viewChild, ViewContainerRef} from '@angular/core';
import {ThreeDotsComponent} from "../helper/three.dots.component";
import {UpComponent} from "../helper/up.component";
import {AddComponent} from "../helper/add.component";
import {FormArray, FormGroup} from "@angular/forms";
import {Ubl, UblElementType} from "../../model/ubl.model";
import Basic = Ubl.Basic;
import Aggregate = Ubl.Aggregate;
import Extension = Ubl.Extension;
import NextRef = Ubl.NextRef;
import {BasicComponent} from "./basic.component";
import {AggregateComponent} from "./aggregate.component";
import {NgComponentOutlet} from "@angular/common";
import {RemoveComponent} from "../helper/remove.component";
import {RefComponent} from "./ref.component";
import {isEmpty} from "../../service/util";



@Component({
  selector: 'ubl-array',
  standalone: true,
  imports: [
    AddComponent,
    NgComponentOutlet,
    RemoveComponent
  ],
  template: `
    <div class="container">
      <div class="top-item">
        <div class="title"> {{ title }}</div>
        <ubl-add (addRequest)="onAdd()"></ubl-add>
      </div>
      <div class="folder">
        @for (item of items; track item.formGroupKey; let idx = $index, e = $even) {
          <div class="array-item">
            <div class="index">{{ idx + 1 }}</div>
            <div class="item">
              <ng-container
                [ngComponentOutlet]=component
                [ngComponentOutletInputs]=item
              ></ng-container>
            </div>
            <ubl-remove class="remove" (removeRequest)="onRemove(idx)"></ubl-remove>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .container {
      position: relative;
      display: block;

      .top-item {
        grid-column: span 2;
        display: flex;
        justify-content: space-between;
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

    .array-item {
      display: flex;
      gap: 0.5rem;

      .index {
        flex-basis: 1rem;
        align-self: center;
        font-size: 1.5rem;
      }

      .item {
        flex-basis: auto;
        flex-grow: 1;
        flex-shrink: 1;
      }

      .remove {
        flex-basis: 1rem;
        padding-top: 0.5rem;
      }
    }

  `
})

export class ArrayComponent implements OnInit {
  @Input() model: any;

  @Input() schema: UblElementType;
  @Input({required: true}) formGroupKey = '';
  @Input({required: true}) parentFormGroup: FormGroup;
  @Input({required: true}) title = '';
  @Input({required: true}) description = '';
  @Input({required: true}) loadNonRequiredIfRequiredIsEmpty: boolean = false;

  items: any[] = [];
  // formGroup = new FormGroup({});
  array = new FormArray([]);
  component;

  public get formArray() : FormArray {
    return this.array;
  }

  public onClose(idx: number){
    this.onRemove(idx);
  }

  ngOnInit(): void {
    // this.component =  this.schema instanceof Basic ? BasicComponent : AggregateComponent;
    this.component =  this.getComponentType(this.schema) ?? BasicComponent;
    if (Array.isArray(this.model) && this.model.length > 0) {
      this.model.forEach((data, index) => {
        this.setupComponent(this.schema, data, this.formGroupKey, index);
      });
    } else {
      this.setupComponent(this.schema, {}, this.formGroupKey, 0);
    }
    this.parentFormGroup.addControl(this.formGroupKey, this.array);
  }

  private setupComponent(field: any, model: any, name: string, index: number) {
    if (field instanceof Basic) {
      this.items.push({
        model: model,
        schema: field,
        title: name,
        formGroupKey: index,
        parentFormGroup: this.array,
      })
    } else if (field instanceof Aggregate) {
      this.items.push({
        model: model,
        schema: field,
        title: field['title'],
        description: field['description'],
        formGroupKey: index,
        parentFormGroup: this.array,
        refName: name,
      })
    }
    else if (field instanceof NextRef) {
      // should convert ref to aggregate component?
      this.items.push({
        model: model,
        // schema: field,
        title: field['title'],
        description: field['description'],
        formGroupKey: index,
        parentFormGroup: this.array,
        ref: field['$ref'],
        loadRef: !isEmpty(model),
        refName: name
      })
     }
  }

  private getComponentType(field: any) {
    if (field instanceof NextRef) {
      return RefComponent;
    } else if (field instanceof Aggregate) {
      return AggregateComponent;
    } else if(field instanceof Basic) {
      return BasicComponent
    }
    return null;
  }


  onAdd() {
    this.setupComponent(this.schema, {}, this.formGroupKey, this.items.length + 1);
  }

  onRemove(idx: number) {
    this.items.splice(idx, 1);
    this.array.removeAt(idx);
  }
}
