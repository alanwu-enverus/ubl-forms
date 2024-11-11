import {Component, forwardRef, Inject, Injector, Input, OnInit} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl, FormControlDirective,
  FormControlName,
  FormGroupDirective, NG_VALUE_ACCESSOR,
  NgControl, ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {distinctUntilChanged, startWith, Subject, takeUntil, tap} from "rxjs";
import {ErrorComponent} from "../error.component";

type InputType = 'text' | 'number' | 'email' | 'date' | 'time' | 'datetime-local';

@Component({
  selector: 'ubl-input',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ErrorComponent,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    @if (control) {
      <div>
        @if (control?.value) {
          <label [for]="inputId" class="form__label">{{ label }}</label>
        }
        <input
          [required]="isRequired"
          [type]="inputType"
          [id]="inputId"
          [formControl]="control"
          [placeholder]="label"
          class="form__input"
        />
        @if (control.invalid && control.dirty && false) { // set false to hide error messages for now
          <ubl-error [customErrorMessages]="customErrorMessages"
                     [errors]="control.errors">
          </ubl-error>
        }
      </div>
    }
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
export class InputComponent<T> implements ControlValueAccessor, OnInit {
  @Input() inputId = '';
  @Input() label = '';
  @Input() inputType: InputType = 'text';
  @Input() customErrorMessages?: Record<string, string> = {};

  control: FormControl | undefined;
  isRequired = false;
  private isDisabled = false;
  private _destroy$ = new Subject<void>();
  private onTouched!: () => T;

  constructor(@Inject(Injector) private injector: Injector) {
  }


  ngOnInit(): void {
    this.setFormControl();
    this.isRequired = this.control?.hasValidator(Validators.required) ?? false;
  }

  writeValue(value: T): void {
    this.control
      ? this.control.setValue(value)
      : (this.control = new FormControl(value));
  }

  registerOnChange(fn: (val: T | null) => T): void {
    this.control?.valueChanges
      .pipe(
        takeUntil(this._destroy$),
        startWith(this.control.value),
        distinctUntilChanged(),
        tap((val) => fn(val))
      )
      .subscribe(() => this.control?.markAsUntouched());
  }

  registerOnTouched(fn: () => T): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  private setFormControl() {
    try {
      const formControl = this.injector.get(NgControl);
      switch (formControl.constructor) {
        case FormControlName:
          this.control = this.injector
            .get(FormGroupDirective)
            .getControl(formControl as FormControlName);
          break;
        default:
          this.control = (formControl as FormControlDirective)
            .form as FormControl;
          break;
      }
    } catch (err) {
      this.control = new FormControl();
    }
  }
}
