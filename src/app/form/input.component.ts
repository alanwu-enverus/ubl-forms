import {Component, forwardRef, Input} from '@angular/core';
import {CvaDirective} from "./cva.directive";
import {NG_VALUE_ACCESSOR, ReactiveFormsModule} from "@angular/forms";
import {ErrorComponent} from "./error.component";
import {NgIf} from "@angular/common";

type InputType = 'text' | 'number' | 'email' | 'date' | 'time' | 'datetime-local';

@Component({
  selector: 'ubl-input',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ErrorComponent,
    NgIf
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div *ngIf="control">
      @if (input?.value) {
        <label [for]="inputId" class="form__label">{{ label }}</label>
      }
      <input
        [required]="isRequired"
        [type]="inputType"
        [id]="inputId"
        [formControl]="control"
        [placeholder]="label"
        class="form__input"
        #input
      />

      <ubl-error *ngIf="control.invalid && control.dirty"
                 [customErrorMessages]="customErrorMessages"
                 [errors]="control.errors"
      >
      </ubl-error>
    </div>
  `,
  styles: `
    .ubl-form-control {
      label,
      input {
        display: block;
      }

      label {
        margin-bottom: 4px;
        font-weight: 600;

        &.required {
          &:after {
            content: "*";
            color: red;
          }
        }
      }

      input {
        box-sizing: border-box;
        padding: 8px;
        width: 100%;
      }
    }
  `
})
export class InputComponent<T> extends CvaDirective<T>{
  @Input() inputId = '';
  @Input() label = '';
  @Input() inputType: InputType = 'text';
  @Input() customErrorMessages?: Record<string, string> = {};
}
