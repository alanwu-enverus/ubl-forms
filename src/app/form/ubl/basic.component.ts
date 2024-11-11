import {Component, inject, input, Input, signal} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {Ubl} from "../../model/ubl.mdel";
import Basic = Ubl.Basic;
import {BasicService} from "../../service/basic.service";
import {UpComponent} from "../helper/up.component";
import {DownComponent} from "../helper/down.component";
import {InputComponent} from "../helper/input.component";

@Component({
  selector: 'ubl-basic',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    UpComponent,
    DownComponent,
    InputComponent
  ],
  template: `
    <ng-container [formGroup]="group">
      <div class="basic-container">
        <div class="top-item">
          <div class="title"> {{ title() }}</div>
          @if (isExpanded()) {
            <ubl-up (closeRequest)="onClose()"></ubl-up>
          } @else {
            <ubl-down (openRequest)="onOpen()"></ubl-down>
          }
        </div>
        <div class="divider"></div>
        <div class="items">
          @for (item of requiredControls; track item.key; ) {
            <ubl-input
              [label]="item.title"
              [inputId]="item.key"
              [formControlName]="item.key"
              [inputType]="item.type"
            ></ubl-input>
          }

          @if (nonRequiredAdded) {
            @for (item of nonRequiredControls; track item.key; let idx = $index, e = $even) {
              @if (isExpanded() || group.controls[item.key].value) {
                <ubl-input
                  [label]="item.title"
                  [inputId]="item.key"
                  [formControlName]="item.key"
                  [inputType]="item.type"
                ></ubl-input>
              }
            }
          }
        </div>
      </div>
      <ng-container>
  `,
  styles: ``
})
export class BasicComponent {
  @Input() model: any;
  @Input() schema: Basic;
  @Input({required: true}) formGroupKey = '';
  @Input({required: true}) parentFormGroup: FormGroup;
  title = input('title', {
    transform: (value: string) => value?.replace('. Type', '').replace('. Details', '')
  });

  service = inject(BasicService);

  requiredControls = [];
  nonRequiredControls = [];
  group: FormGroup = new FormGroup({});

  isExpanded = signal(false);
  isAllHaveValue = () => false;
  nonRequired: string[] = [];
  nonRequiredHasAtLeaseOneValue = () => false;
  nonRequiredAdded = false;

  ngOnInit() {
    this.initGroup();
  }

  onClose() {
    if (!this.isAllHaveValue()) {
      this.isExpanded.set(false);
    }
  }

  onOpen() {
    this.isExpanded.set(true);
    if (!this.nonRequiredAdded) {
      this.getNonRequired();
      this.nonRequiredAdded = true;
    }
  }

  private initGroup() {
    this.getRequiredControls()
    this.requiredControls.forEach(control => {
      this.group.addControl(control.key, new FormControl(control.value, Validators.required))
    })
    this.getNonRequiredIfItHasValue()

    this.group.valueChanges.subscribe(() => {
      this.checkValue.call(this);
    })

    this.parentFormGroup.addControl(this.formGroupKey, this.group);
    this.checkValue.call(this);
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
    return name === '_' ? this.schema.title.replace('. Type', '') : name
  }

  private checkValue() {
    this.isAllHaveValue = () => Object.keys(this.schema.properties).every((property) => this.group.value[property]);
    if (this.isAllHaveValue()) {
      this.isExpanded.set(true);
    }
  }

  private getNonRequired() {
    this.nonRequired = Object.keys(this.schema.properties).filter(name => !this.schema.required.includes(name) && !this.nonRequiredControls.includes(name))
    if (this.nonRequired && this.nonRequired.length > 0) {
      this.nonRequired.forEach(name => {
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
      this.group.addControl(control.key, new FormControl(control.value))
    })

  }

  private getNonRequiredIfItHasValue() {
    this.nonRequired.forEach(name => {
      if (this.model[name]) {
        let type = this.convertStringType(name);
        this.nonRequiredControls.push({
          key: name,
          value: this.model ? this.model[name] : null,
          type: type,
          title: this.convertDefaultName(name)
        })
      }
    })
  }
}
