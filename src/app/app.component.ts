import {Component, OnInit, signal, viewChild, ViewContainerRef} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {JsonPipe, NgClass} from "@angular/common";
import {DocumentComponent} from "./form/ubl/document.component";
import {getAllDocTypes, getSampleDocument, removeEmpty} from "./service/util";
import {ThreeDotsComponent} from "./form/helper/three.dots.component";
import {ExpandComponent} from "./form/helper/expand.component";
import {UpComponent} from "./form/helper/up.component";
import {AddComponent} from "./form/helper/add.component";
import {RemoveComponent} from "./form/helper/remove.component";



@Component({
    selector: 'app-root',
    imports: [ReactiveFormsModule, JsonPipe, ThreeDotsComponent, ExpandComponent, UpComponent, AddComponent, RemoveComponent, FormsModule, NgClass],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  showDescription = true;
  jsonResult: any;
  isLoadSample = true
  docTypes: string[] = getAllDocTypes().sort((a, b) => a.localeCompare(b));
  isLoadingSample = signal(false);

  vcr = viewChild('container', {read: ViewContainerRef});

  selectedDocType = "Invoice";
  ublType = 'Invoice';
  data: any;

  async ngOnInit(): Promise<void> {
    if(window.innerWidth < 900) {
      this.showDescription = false;
    }
    await this.getSampleData();

    this.setupDocumentComponent(this.vcr(), this.ublType, this.data);
  }


  create() {
    this.isLoadSample = false;
    this.data = {};
    this.ublType = this.selectedDocType;

    this.setupDocumentComponent(this.vcr(), this.ublType, this.data);
    // this.jsonResult = this.data;
  }

  async loadSample() {
    this.isLoadSample = true;
    await this.getSampleData();

    this.setupDocumentComponent(this.vcr(), this.ublType, this.data);

    // this.ublType = this.selectedDocType;
    // this.jsonResult = this.data;
  }


  async onSelectDoc(target: any) {
    this.selectedDocType = target.value;
    if (this.isLoadSample) {
      await this.getSampleData();
    } else {
      this.data = {};
    }

    this.setupDocumentComponent(this.vcr(), this.ublType, this.data);

    // this.ublType = this.selectedDocType;
    // this.jsonResult = this.data;
  }

  onDataChange(data: any) {
    this.jsonResult = data
  }

  protected readonly removeEmpty = removeEmpty;
  year =  new Date().getFullYear();

  onClickMenu() {
    this.showDescription = !this.showDescription;
  }

  async getSampleData() {
    this.isLoadingSample.set(true);
    try {
      this.data = await getSampleDocument(this.ublType);
    } catch (e) {
      this.data = {};
    }

    this.isLoadingSample.set(false);
  }

  private setupDocumentComponent(vcr?: ViewContainerRef, docTypeName?: string, model?: any) {
    if (this.vcr()) {
      this.vcr()?.clear()
      let ref = this.vcr()?.createComponent(DocumentComponent);
      ref.instance.docTypeName = docTypeName;
      ref.instance.model = model;
      ref.instance.onDataChange.subscribe((data) => {
        this.onDataChange(data);
      });

      this.jsonResult = model;
    }
  }

}
