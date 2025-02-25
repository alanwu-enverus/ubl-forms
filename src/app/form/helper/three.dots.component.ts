import {Component, output} from '@angular/core';

@Component({
    selector: 'ubl-three-dots',
    imports: [],
    template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="blue"
      class="bi bi-three-dots"
      viewBox="0 0 15 15"
      (click)="onClick()"
    >
      <path
        d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
      />
    </svg>
  `,
    styles: ``
})
export class ThreeDotsComponent {
  openRequest = output()
  onClick() {
    this.openRequest.emit();
  }
}
