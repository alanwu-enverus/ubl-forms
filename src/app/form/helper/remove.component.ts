import {Component, output} from '@angular/core';

@Component({
  selector: 'ubl-remove',
  imports: [],
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round"
         class="icon" (click)="onClick()">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/>
      <path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  `,
  styles: `
    .icon {
      color: #c0392b;
      cursor: pointer;
      transition: color 0.15s, transform 0.15s;
    }
    .icon:hover { color: #922b21; transform: scale(1.15); }
  `
})
export class RemoveComponent {
  removeRequest = output();
  onClick() { this.removeRequest.emit(); }
}
