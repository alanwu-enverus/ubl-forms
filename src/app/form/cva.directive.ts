import {Directive, Inject, Injector, OnInit} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl, FormControlDirective,
  FormControlName, FormGroup,
  FormGroupDirective,
  NgControl,
  Validators
} from "@angular/forms";
import {distinctUntilChanged, startWith, Subject, takeUntil, tap} from "rxjs";

@Directive({
  selector: '[ublCva]',
  standalone: true
})
export class CvaDirective<T> implements ControlValueAccessor, OnInit {

  control: FormControl | undefined;
  isRequired = false;

  private isDisabled = false;
  private _destroy$ = new Subject<void>();
  private onTouched!: () => T;
  constructor(@Inject(Injector) private injector: Injector) { }

  ngOnInit() {
    this.setFormControl();
    this.isRequired = this.control?.hasValidator(Validators.required) ?? false;
  }

  setFormControl() {
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

}


