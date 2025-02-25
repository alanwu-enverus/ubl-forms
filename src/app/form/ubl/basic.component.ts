import {Component, inject, input, Input, OnInit, signal} from '@angular/core';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {Ubl} from "../../model/ubl.model";
import Basic = Ubl.Basic;
import {BasicService} from "../../service/basic.service";
import {UpComponent} from "../helper/up.component";
import {InputComponent} from "../helper/input.component";
import {ThreeDotsComponent} from "../helper/three.dots.component";
import {NgClass} from "@angular/common";
import {camelCaseToTitle} from "../../service/util";

@Component({
    selector: 'ubl-basic',
    imports: [
        ReactiveFormsModule,
        UpComponent,
        InputComponent,
        ThreeDotsComponent,
        NgClass
    ],
    template: `
    <ng-container [formGroup]="formGroup">
      <div class="basic-container">
        <div [ngClass]="documentLevel ? 'doc-level-top-item': 'top-item'">
          <div class="title"> {{ title() }}</div>
          @if (isExpanded()) {
            <ubl-up (closeRequest)="onClose()"></ubl-up>
          } @else {
            <ubl-three-dots (openRequest)="onOpen()"></ubl-three-dots>
          }
        </div>
        <div class="divider"></div>
        <div class="items">
          @for (item of requiredControls; track item.key; ) {
            <!-- not sure if should hide the required fields, but show too much empty required fields-->
<!--            @if (isExpanded() || formGroup.controls[item.key]?.value) {-->
              <ubl-input
                [label]="item.title"
                [inputId]="item.key"
                [formControlName]="item.key"
                [inputType]="item.type"
              ></ubl-input>
<!--            }-->
          }

          @for (item of nonRequiredControls; track item.key; let idx = $index, e = $even) {
            @if (isExpanded() || formGroup.controls[item.key]?.value) {
              <ubl-input
                [label]="item.title"
                [inputId]="item.key"
                [formControlName]="item.key"
                [inputType]="item.type"
              ></ubl-input>
            }
          }
        </div>
      </div>
    </ng-container>
  `,
    styles: `
    .basic-container {
      display: grid;
      grid-template-columns: max(1rem) 1fr;
      padding: 0px 0.4rem;
      margin-bottom: 0.2rem;

      .top-item {
        grid-column: span 2;
        display: flex;
        flex-direction: row;
        justify-content: space-between;

        .title {
          font-size: 1.4rem;
          font-weight: 100;
        }
      }

      .divider {
        width: 1px;
        background: #e2e0ef;
        margin-inline: 0.3rem;
      }

      .items {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }
    }

    .doc-level-top-item {
      grid-column: span 2;
      display: flex;
      flex-direction: row;
      justify-content: start;
      align-items: center;
      gap: 0.5rem;
      background: gainsboro;
      padding: 0.1rem 0.5rem;

      .title {
        font-size: 1.5rem;
        order: 1;
      }
    }

  `
})
export class BasicComponent implements OnInit {
  @Input() model: any;
  @Input() schema: Basic;
  @Input({required: true}) formGroupKey = '';
  @Input({required: true}) parentFormGroup: FormGroup | FormArray;
  @Input() documentLevel = false;
  title = input('title', {
    transform: (value: string) => camelCaseToTitle(value?.replace('. Type', '').replace('. Details', ''))
  });

  service = inject(BasicService);

  requiredControls = [];
  nonRequiredControls = [];
  public formGroup: FormGroup = new FormGroup({});

  isExpanded = signal(false);
  isAllHaveValue = () => false;
  nonRequired: string[] = [];
  nonRequiredAdded = false;

  ngOnInit() {
    this.initGroup();
  }

  public onClose() {
    if (!this.isAllHaveValue()) {
      this.isExpanded.set(false);
    }
  }

  public onOpen() {
    this.isExpanded.set(true);
    if (!this.nonRequiredAdded) {
      this.getNonRequired();
      this.nonRequiredAdded = true;
    }
  }

  private initGroup() {
    this.getRequiredControls()
    this.requiredControls.forEach(control => {
      this.formGroup.addControl(control.key, new FormControl(control.value, Validators.required))
    })

    this.nonRequired = Object.keys(this.schema.properties).filter(name => !this.schema.required.includes(name));
    this.populateModelForNonRequired()

    this.formGroup.valueChanges.subscribe(() => {
      this.checkValue.call(this);
    })

    this.addToParentControl();

    this.checkValue.call(this);
  }

  private addToParentControl() {
    if (this.parentFormGroup instanceof FormGroup) {
      this.parentFormGroup.addControl(this.formGroupKey, this.formGroup);
    } else {
      // if not a FormGroup, then it is a FormArray
      this.parentFormGroup.push(this.formGroup);
    }
  }

  private getRequiredControls() {
    let required = this.schema.required
    if (required && required.length > 0) {
      required.forEach(name => {
        let type = this.convertStringType(name);
        this.requiredControls.push({
          key: name,
          value: this.model ? this.model[name] : null,
          type: type,
          title: this.convertDefaultName(name)
        })
      })
    }
  }

  private convertStringType(name: string) {
    let type = 'text' // default type
    let typeObject = this.schema.properties[name] as any
    type = typeObject.type
    if (typeObject.type === 'string') {
      switch (typeObject.format) {
        case 'date':
          type = 'date'
          break;
        case 'date-time':
          type = 'datetime-local'
          break;
        case 'time':
          type = 'time'
          break;
        default:
          type = 'text'
      }
    }
    return type;
  }

  private convertDefaultName(name: string) {
    let defaultName =  name === '_' ? this.schema.title.replace('. Type', '') : name
    return camelCaseToTitle(defaultName)
  }

  private checkValue() {
    this.isAllHaveValue = () => Object.keys(this.schema.properties).every((property) => this.formGroup.value[property]);
    if (this.isAllHaveValue()) {
      this.isExpanded.set(true);
    }
  }

  private getNonRequired() {
    let noReqs =this.nonRequired.filter(name => !this.nonRequiredControls.map(c=>c.key).includes(name))
    if (noReqs && noReqs.length > 0) {
      noReqs.forEach(name => {
        let type = this.convertStringType(name);
        this.nonRequiredControls.push({
          key: name,
          value: this.model ? this.model[name] : null,
          type: type,
          title: this.convertDefaultName(name)
        })
      })
    }

    this.nonRequiredControls.forEach(control => {
      this.formGroup.addControl(control.key, new FormControl(control.value))
    })

  }

  private populateModelForNonRequired() {
    this.nonRequired.forEach(name => {
      if (this.model && this.model[name]) {
        let type = this.convertStringType(name);
        this.nonRequiredControls.push({
          key: name,
          value: this.model[name],
          type: type,
          title: this.convertDefaultName(name)
        })
      }
    })

    this.nonRequiredControls.forEach(control => {
      this.formGroup.addControl(control.key, new FormControl(control.value))
    })
  }
}
