import {Component, inject, input, Input, OnInit, signal} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {BasicService} from "../service/basic.service";
import {Group} from "../service/util";
import {InputComponent} from "../form/input.component";
import {UpSvgComponent} from "../form/icon/up";
import {ThreeDotSvgComponent} from "../form/icon/three.dots";

@Component({
  selector: 'ubl-basic',
  standalone: true,
  imports: [InputComponent, ReactiveFormsModule, UpSvgComponent, ThreeDotSvgComponent],
  template: `
    <ng-container [formGroup]="group">
      <div class="basic-container">
        <div class="top-item">
          <div class="title"> {{ formGroupKey }}</div>
          @if (isExpanded()) {
            <ubl-up-svg (closeRequest)="onClose()"></ubl-up-svg>
          } @else {
            <ubl-three-dots-svg (openRequest)="onOpen()"></ubl-three-dots-svg>
          }
        </div>
        <div class="divider"></div>
        <div class="items">
          @for (item of requiredControls; track item.key; let idx = $index, e = $even) {
            <ubl-input
              [label]="item.title"
              [inputId]="item.key"
              [formControlName]="item.key"
              [inputType]="item.type"
            ></ubl-input>
          }
          @if (isExpanded()) {
            @for (item of nonRequiredControls; track item.key; let idx = $index, e = $even) {
              <ubl-input
                [label]="item.key"
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
  styles: ``
})
export class BasicComponent implements OnInit {
  @Input() model: any;
  @Input() schema: Group;
  @Input({ required: true }) formGroupKey = '';
  @Input({ required: true }) parentFormGroup: FormGroup;

  service = inject(BasicService);

  requiredControls = [];
  nonRequiredControls = [];
  group: FormGroup = new FormGroup({});

  isExpanded = signal(false);
  isAllHaveValue= ()=> false;

  ngOnInit() {
      this.initGroup();
  }


  private initGroup() {
    this.getRequired()
    this.requiredControls.forEach(control => {
      this.group.addControl(control.key, new FormControl(control.value, Validators.required))
    })
    this.group.valueChanges.subscribe(() => {
      this.checkIsAllHaveValue.call(this);
    })
    this.parentFormGroup.addControl(this.formGroupKey, this.group);
    this.checkIsAllHaveValue.call(this);
  }

  private getRequired() {
   let required =  this.schema.required
    if(required && required.length > 0) {
      required.forEach(name => {
        let type = this.convertStringType(name);
        this.requiredControls.push({ key: name, value: this.model ? this.model[name] : null, type: type, title:this.convertDefaultName(name) })
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

  // this method needs to be tested if work as expected
  private getNonRequired() {
    let nonRequired = Object.keys(this.schema.properties).filter(name => !this.schema.required.includes(name))
    if(nonRequired && nonRequired.length > 0) {
      nonRequired.forEach(name => {
        let type = this.convertStringType(name);
        this.nonRequiredControls.push({ key: name, value: this.model ? this.model[name] : null, type: type, title:name })
      })
    }

    this.nonRequiredControls.forEach(control => {
      this.group.addControl(control.key, new FormControl(control.value))
    })

  }

  onClose() {
    if (!this.isAllHaveValue()) {
      this.isExpanded.set( false);
    }
  }

  onOpen() {
    this.isExpanded.set(true);
    this.getNonRequired();
  }

  private checkIsAllHaveValue() {
    this.isAllHaveValue = () => Object.keys(this.schema.properties).every((property) => this.group.value[property]);
    if (this.isAllHaveValue()) {
      this.isExpanded.set(true);
    }
  }

  private convertDefaultName(name: string) {
    return name === '_' ?  this.schema.title.replace('. Type', '') : name
  }
}
