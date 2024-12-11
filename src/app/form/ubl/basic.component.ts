import {Component, inject, input, Input, OnInit, signal} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {Ubl} from "../../model/ubl.mdel";
import Basic = Ubl.Basic;
import {BasicService} from "../../service/basic.service";
import {UpComponent} from "../helper/up.component";
import {DownComponent} from "../helper/down.component";
import {InputComponent} from "../helper/input.component";
import {ThreeDotsComponent} from "../helper/three.dots.component";

@Component({
  selector: 'ubl-basic',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    UpComponent,
    DownComponent,
    InputComponent,
    ThreeDotsComponent
  ],
  template: `
    <ng-container [formGroup]="formGroup">
      <div class="basic-container">
        <div class="top-item">
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
            <ubl-input
              [label]="item.title"
              [inputId]="item.key"
              [formControlName]="item.key"
              [inputType]="item.type"
            ></ubl-input>
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
          font-weight: 700;
        }
      }

      .divider {
        width: 1px;
        background: #5643fa;
        margin-inline: 0.3rem;
      }

      .items {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }
    }
  `
})
export class BasicComponent implements OnInit {
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
    this.getNonRequiredIfItHasValue()

    this.formGroup.valueChanges.subscribe(() => {
      this.checkValue.call(this);
    })

    this.parentFormGroup.addControl(this.formGroupKey, this.formGroup);
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

  private getNonRequiredIfItHasValue() {
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
