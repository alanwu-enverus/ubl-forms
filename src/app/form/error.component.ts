import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {ValidationErrors} from "@angular/forms";
import {KeyValuePipe, NgForOf} from "@angular/common";

@Component({
    selector: 'ubl-error',
    imports: [
        KeyValuePipe,
        NgForOf
    ],
    template: `
    <ul class="ubl-validation-errors">
      <li *ngFor="let error of errors | keyvalue">
        {{ errorMessages[error.key] }}
      </li>
    </ul>
  `,
    styles: `
    .ubl-validation-errors {
      margin: 0;
      padding-left: 16px;

      li {
        margin-top: 4px;
        color: red;
        font-size: 0.8rem;
      }
    }`
})
export class ErrorComponent implements OnChanges{
  @Input() errors: Record<string, ValidationErrors> | null = {};
  @Input() customErrorMessages: Record<string, string> = {};
  errorMessages: Record<string, string> = {
    required: 'This field is required',
  };

  ngOnChanges(changes: SimpleChanges): void {
    const { customErrorMessages } = changes;
    if (customErrorMessages) {
      this.errorMessages = {
        ...this.errorMessages,
        ...customErrorMessages.currentValue,
      };
    }
  }
}
