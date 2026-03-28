import {Component, output} from '@angular/core';

@Component({
  selector: 'ubl-up',
  imports: [],
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2.5"
         stroke-linecap="round" stroke-linejoin="round"
         class="icon" (click)="onClick()">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  `,
  styles: `
    .icon {
      color: #516cb2;
      cursor: pointer;
      transition: color 0.15s, transform 0.15s;
    }
    .icon:hover { color: #2e3d78; transform: scale(1.2); }
  `
})
export class UpComponent {
  closeRequest = output();
  onClick() { this.closeRequest.emit(); }
}
