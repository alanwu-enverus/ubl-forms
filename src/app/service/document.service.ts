import {inject, Injectable} from '@angular/core';
import {BasicService} from "./basic.service";
import {AggregateService} from "./aggregate.service";
import {Ubl} from "./../model/ubl.model";


@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  basicService = inject(BasicService);
  aggregateService = inject(AggregateService);

  documentRequiredSchemaCache: Ubl.Cache<Ubl.Document> = {}
  documentNonRequiredSchemaCache: Ubl.Cache<Ubl.Document> = {}
  documentSchemaCache: Ubl.Cache<any> = {}

  async getDocumentRequiredSchema(docTypeName: string): Promise<Ubl.Document> {
    if (this.documentRequiredSchemaCache[docTypeName]) {
      return this.documentRequiredSchemaCache[docTypeName];
    }
    const doc = await this.getSchemaDocument(docTypeName);
    const document = this.buildDocument(doc, true);
    this.documentRequiredSchemaCache[docTypeName] = document;
    return document;
  }

  async getDocumentNonRequiredSchema(docTypeName: string): Promise<Ubl.Document> {
    if (this.documentNonRequiredSchemaCache[docTypeName]) {
      return this.documentNonRequiredSchemaCache[docTypeName];
    }
    const doc = await this.getSchemaDocument(docTypeName);
    const document = this.buildDocument(doc, false);
    this.documentNonRequiredSchemaCache[docTypeName] = document;
    return document;
  }

  private buildDocument(doc: any, requiredOnly: boolean): Ubl.Document {
    const docName = doc.required[0];
    const definitions = doc.definitions[docName];
    const required: string[] = definitions['required'];
    const properties = definitions['properties'];

    const document: Ubl.Document = {
      title: definitions['title'],
      description: definitions['description'],
      required,
      properties: {}
    };

    const names = requiredOnly
      ? required
      : Object.keys(properties).filter(name => !required.includes(name));

    names.forEach(name => {
      const property = properties[name];
      const type = property['type'];
      const ref = type === 'array' ? property['items']['$ref'] : property['$ref'];
      const isArray = type === 'array' && !property['maxItems'];

      let basicOrAggregate;
      if (this.aggregateService.isCacRef(ref)) {
        basicOrAggregate = this.aggregateService.getRequiredAggregatesByRef(ref);
        if (basicOrAggregate.required?.length === 0 && Object.keys(basicOrAggregate.properties).length === 0) {
          basicOrAggregate = this.aggregateService.getNonRequiredAggregatesByRef(ref);
        }
      } else {
        basicOrAggregate = this.basicService.getBasicByRef(ref);
      }

      if (isArray) {
        const array = new Ubl.Array();
        array.title = property.title;
        array.description = property.description;
        array.items = basicOrAggregate;
        document.properties[name] = array;
      } else {
        document.properties[name] = basicOrAggregate;
      }
    });

    return document;
  }

  private async getSchemaDocument(name: string): Promise<any> {
    if (this.documentSchemaCache[name]) {
      return this.documentSchemaCache[name];
    }
    const schema = await import(`../../../public/UBL-${name}-2.3.json`);
    if (schema) {
      this.documentSchemaCache[name] = schema;
      return schema;
    }
    throw new Error(`Schema not found for ${name}`);
  }
}
