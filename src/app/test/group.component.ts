import {Component, inject} from '@angular/core';
import {BasicComponent} from "./basic.component";
import {DocumentService} from "../service/document.service";
import {JsonPipe} from "@angular/common";

@Component({
  selector: 'ubl-group',
  standalone: true,
  imports: [
    BasicComponent,
    JsonPipe
  ],
  template: `
    <p>
      group works!
      {{schema | json}}
<!--      <ubl-basic></ubl-basic>-->
<!--      <ubl-group></ubl-group>-->
    </p>
  `,
  styles: ``
})
export class GroupComponent {
  private ublService = inject(DocumentService);
  schema:string='';

  ngOnInit() {
    console.log(this.ublService);
  }
}
