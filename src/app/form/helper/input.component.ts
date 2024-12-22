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
      <div class="container">
        @if (control?.value) {
          <label [for]="inputId" class="form__label">{{ label }}:</label>
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
    .container {
      display: flex;
      width: 100%;
      flex-wrap: wrap;
      justify-content: start;
      align-items: center;
    }
    //form input
    .form__input {
      font-size: 1.5rem;
      font-family: inherit;
      color: inherit;
      padding: 0.2rem;
      border-radius: 2px;
      background-color: rgba(#f7f7f7, 0.5);
      border: none;
      border-bottom: 3px solid transparent;
      transition: all .3s;
      flex-basis: 85%;
      flex-grow: 1;
    }

    .form__input:required {
      border-right: 1px solid #ff7730;
    }

    .form__input:valid {
      border-right: none;
    }

    .form__input:focus {
      outline: none;
      box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.1);
      border-bottom: 2px solid #55c57a;
    }

    .form__input:focus:invalid {
      border-bottom: 2px solid #ff7730;
    }

    .form__input::-webkit-input-placeholder {
      color: #999;
    }

    .form__label {
      font-size: 1.2rem;
      font-style: italic;
      font-weight: 700;
      margin-left: 0.2rem;
      margin-top: 1px;
      margin-bottom: 0px;
      flex-basis: 10%;
      align-self: center;
      text-align: right;
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
