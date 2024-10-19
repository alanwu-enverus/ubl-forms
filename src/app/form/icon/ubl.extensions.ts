

import { Component, Input, OnInit } from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ArrayAddComponent} from "./array.add";
import {ArrayDeleteComponent} from "./array.delete";

@Component({
  selector: 'ubl-extensions',
  standalone: true,
  template: `
    <div class="border  p-1 m-2 bg-body rounded">
      <div class="container-fluid ">
        <div class="clearfix">
          <div class="float-start">extensions</div>
          <cbx-array-add
            (addRequest)="onAdd()"
            class="float-end"></cbx-array-add>
        </div>
      </div>
      <div [formGroup]="parentFormGroup">
        <div
          [formArrayName]="key"
          class="container-fluid ps-4"
          *ngFor="let u of typeFormArray.controls; index as i">
          <div class="shadow-sm bg-body p-1 rounded">
            <ng-container [formGroupName]="i">
              <div class="row form-group mb-1">
                <input
                  type="text"
                  class="col-sm-4 mx-2"
                  formControlName="key"
                  placeholder="Key"/>
                <input
                  type="text"
                  class="col-sm-4 mx-2"
                  formControlName="value"
                  placeholder="Value"/>
                <cbx-array-delete
                  [index]="i"
                  (deleteRequest)="onRemove(i)"
                  class="col-sm-1 mx-2"></cbx-array-delete>
              </div>
            </ng-container>
          </div>
        </div>
      </div>
    </div>
  `,
  imports: [
    ArrayAddComponent,
    ReactiveFormsModule,
    ArrayDeleteComponent
  ]
})
export class UBLExtensions implements OnInit {
  @Input() typeFormArray;
  @Input() model?: any;

  parentFormGroup: FormGroup;
  isExpanded = false;
  key: string = 'UBLExtensions';

  isShowformatControl = false;

  public onClose() {
    this.isExpanded = false;
    this.toggleExpand();
  }

  public onOpen() {
    this.isExpanded = true;
    this.toggleExpand();
  }

  ngOnInit(): void {
    this.parentFormGroup = this.typeFormArray.parent;
    if (Array.isArray(this.model)) {
      this.model.forEach(x => {
        if (!!x['key'] && !!x['value']) {
          this.typeFormArray.push(
            new FormGroup({
              key: new FormControl(x['key'], Validators.required),
              value: new FormControl(x['value'], Validators.required),
            })
          );
        }
      });
    }
    this.toggleExpand();
  }

  toggleExpand() {
    if (this.isExpanded) {
      if (this.typeFormArray.length == 0) {
        this.onAdd();
      }
    }
  }

  onAdd() {
    this.typeFormArray.push(
      new FormGroup({
        key: new FormControl('', Validators.required),
        value: new FormControl('', Validators.required),
      })
    );
  }

  onRemove(i: number) {
    this.typeFormArray.removeAt(i);
  }
}

