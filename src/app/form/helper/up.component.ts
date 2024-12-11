import {Component, output} from '@angular/core';

@Component({
  selector: 'ubl-up',
  standalone: true,
  imports: [],
  template: ` <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="blue"
    class="bi bi-chevron-up"
    viewBox="0 0 20 20"
    (click)="onClick()">
    <path
      fill-rule="evenodd"
      d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z" />
  </svg>`,
  styles: ``
})
export class UpComponent {
  closeRequest = output()
  onClick() {
    this.closeRequest.emit();
  }
}
