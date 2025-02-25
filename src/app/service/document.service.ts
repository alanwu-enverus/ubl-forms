import {inject, Injectable} from '@angular/core';
import {BasicService} from "./basic.service";
import {AggregateService} from "./aggregate.service";
import {Ubl} from "./../model/ubl.model";


@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  // 1. get required refs for a document type
  // 2. if required ref is a basic, get required schema from cac
  // 3. if required ref is an aggregate,
  //   3.1 get required refs from aggregate for the required ref
  //   3.2 if required ref is a basic, get required schema from cac
  //   3.3 if required ref is an aggregate, repeat 3.1 and 3.2

  // this service provides 1. get required schema for a document type 2. get non-required schema for a document type


  /*todo: maybe
     1. array that has max is 1, not be an array
     2. set up group format  for UI display
     3. if required field, but the schema (e.g party or Id) has not required field, then get all non-required fields

  */
  // documentSchemaCache: cache = {}
  // docTypesRequiredGroupSchemasCache: cache = {}
  // docTypesNonRequiredGroupSchemasCache: cache = {}

  basicService = inject(BasicService);
  aggregateService = inject(AggregateService);

  documentRequiredSchemaCache: Ubl.Cache<Ubl.Document> = {}
  documentNonRequiredSchemaCache: Ubl.Cache<Ubl.Document> = {}
  documentSchemaCache = {}

  constructor() {
  }

  async getDocumentRequiredSchema(docTypeName: string): Promise<Ubl.Document> {
    if (this.documentRequiredSchemaCache[docTypeName]) {
      return this.documentRequiredSchemaCache[docTypeName];
    }
    let doc = await this.getSchemaDocument(docTypeName);
    let docName = doc.required[0];
    let definitions = doc.definitions[docName];
    let required: string[] = definitions['required'];
    let properties = definitions['properties'];
    let document: Ubl.Document = {
      title: definitions['title'],
      description: definitions['description'],
      required: required,
      properties: {}
    }

    required.forEach((requiredName) => {
      const property = properties[requiredName];
      const type = property['type'];
      const ref = type === "array" ? property['items']['$ref'] : property['$ref'];
      const isArray = type === "array" && !property['maxItems'];

      let basicOrAggregate; // can be NextRef?
      if (this.aggregateService.isCacRef(ref)) {
        basicOrAggregate = this.aggregateService.getRequiredAggregatesByRef(ref);
        if (basicOrAggregate.required?.length === 0 && Object.keys(basicOrAggregate.properties).length === 0) {
          // get non-required aggregates if required is empty. otherwise, show empty in top level
          basicOrAggregate = this.aggregateService.getNonRequiredAggregatesByRef(ref);
        }
      } else {
        basicOrAggregate = this.basicService.getBasicByRef(ref);
      }

      if (isArray) {
        let array = new Ubl.Array();
        array.title = property.title;
        array.description = property.description;
        array.items = basicOrAggregate;
        document.properties[requiredName] = array;
      } else {
        document.properties[requiredName] = basicOrAggregate;
      }
    });
    this.documentRequiredSchemaCache[docTypeName] = document;
    return this.documentRequiredSchemaCache[docTypeName];
  }

  async getDocumentNonRequiredSchema(docTypeName: string): Promise<Ubl.Document> {
    if (this.documentNonRequiredSchemaCache[docTypeName]) {
      return this.documentNonRequiredSchemaCache[docTypeName];
    }
    let doc = await this.getSchemaDocument(docTypeName);
    let docName = doc.required[0];
    let definitions = doc.definitions[docName];
    let required: string[] = definitions['required'];
    let properties = definitions['properties'];
    let document: Ubl.Document = {
      title: definitions['title'],
      description: definitions['description'],
      required: required,
      properties: {}
    }
    let nonRequired = Object.keys(properties).filter((name) => !required.includes(name));

    nonRequired.forEach((requiredName) => {
      const property = properties[requiredName];
      const type = property['type'];
      const ref = type === "array" ? property['items']['$ref'] : property['$ref'];
      const isArray = type === "array" && !property['maxItems'];

      let basicOrAggregate; // can be NextRef?
      if (this.aggregateService.isCacRef(ref)) {
        basicOrAggregate = this.aggregateService.getRequiredAggregatesByRef(ref);
        if (basicOrAggregate.required?.length === 0 && Object.keys(basicOrAggregate.properties).length === 0) {
          // get non-required aggregates if required is empty. otherwise, show empty in top level
          basicOrAggregate = this.aggregateService.getNonRequiredAggregatesByRef(ref);
        }
      } else {
        basicOrAggregate = this.basicService.getBasicByRef(ref);
      }

      if (isArray) {
        let array = new Ubl.Array();
        array.title = property.title;
        array.description = property.description;
        array.items = basicOrAggregate;
        document.properties[requiredName] = array;
      } else {
        document.properties[requiredName] = basicOrAggregate;
      }
    });
    this.documentNonRequiredSchemaCache[docTypeName] = document;
    return this.documentNonRequiredSchemaCache[docTypeName];
  }

  private async getSchemaDocument(name: string): Promise<any> {
    if (this.documentSchemaCache[name]) {
      return this.documentSchemaCache[name];
    }

    // const fileName = `UBL-${name}-2.3.json`;
    const schema = await import(`../../../public/UBL-${name}-2.3.json`)

    if (schema) {
      this.documentSchemaCache[name] = schema;
      return this.documentSchemaCache[name];
    }
    throw new Error(`Schema not found for ${name}`);
  }
}
