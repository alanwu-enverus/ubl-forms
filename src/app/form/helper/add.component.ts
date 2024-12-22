import {Component, output} from '@angular/core';

@Component({
  selector: 'ubl-add',
  standalone: true,
  imports: [],
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="currentColor" class="bi bi-plus"
         viewBox="0 0 15 15" (click)="onClick()">
      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
    </svg>
  `,
  styles: ``
})
export class AddComponent {
  addRequest = output()
  onClick() {
    this.addRequest.emit();
  }
}
