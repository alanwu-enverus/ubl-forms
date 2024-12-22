import {Component, OnInit} from '@angular/core';
import { RouterOutlet } from '@angular/router';
// import {GroupComponent} from "./test/group.component";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {InputComponent} from "./form/input.component";
import {JsonPipe} from "@angular/common";
// import {DocComponent} from "./test/doc.component";
import {DocumentComponent} from "./form/ubl/document.component";
import {BasicComponent} from "./form/ubl/basic.component";
import {AggregateComponent} from "./form/ubl/aggregate.component";
import {getSampleDocument} from "./service/util";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, InputComponent, ReactiveFormsModule, JsonPipe, DocumentComponent, BasicComponent, AggregateComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'dynaform';
  ublType = 'Invoice';
  data: any;
  async ngOnInit(): Promise<void> {
    // this.data = await getSampleDocument("Invoice");
    // let doc = await getSampleDocument("Invoice");
    // this.data = doc["AccountingSupplierParty"];
    // this.data = new Array(doc['InvoiceLine'][0]);
    // console.log(this.data);
  }



  // docService = inject(DocumentService);

  // errorMessages = { required: 'The name field is required' };
  // testControl = new FormControl('MyDefaultValue', Validators.required);

   // formGroup = new FormGroup({
   //   name: new FormControl('', Validators.required),
   //   // age: new FormControl(0, Validators.required),
   // });

}
