import {Component, output} from '@angular/core';

@Component({
  selector: 'ubl-add',
  imports: [],
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round"
         class="icon" (click)="onClick()">
      <circle cx="12" cy="12" r="9"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8"  y1="12" x2="16" y2="12"/>
    </svg>
  `,
  styles: `
    .icon {
      color: #3a7d44;
      cursor: pointer;
      transition: color 0.15s, transform 0.15s;
    }
    .icon:hover { color: #276130; transform: scale(1.2); }
  `
})
export class AddComponent {
  addRequest = output();
  onClick() { this.addRequest.emit(); }
}
