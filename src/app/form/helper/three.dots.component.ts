import {Component, output} from '@angular/core';

@Component({
  selector: 'ubl-three-dots',
  imports: [],
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round"
         class="icon" (click)="onClick()">
      <circle cx="8"  cy="12" r="1" fill="currentColor"/>
      <circle cx="12" cy="12" r="1" fill="currentColor"/>
      <circle cx="16" cy="12" r="1" fill="currentColor"/>
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
export class ThreeDotsComponent {
  openRequest = output();
  onClick() { this.openRequest.emit(); }
}
