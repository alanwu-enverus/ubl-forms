import {inject, Injectable} from '@angular/core';
import {BasicService} from "./basic.service";
import {AggregateService} from "./aggregate.service";
import {cache, UblDocument} from "./util";


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

  // party (aggregate) does not have required field, so may be return non-required fields

  /*todo: maybe
     1. array that has max is 1, not be an array
     2. set up group format  for UI display
     3. if required field, but the schema (e.g party or Id) has not required field, then get all non-required fields

  */
  documentSchemaCache: cache = {}
  docTypesRequiredGroupSchemasCache: cache = {}
  docTypesNonRequiredGroupSchemasCache: cache = {}

  basicService = inject(BasicService);
  aggregateService = inject(AggregateService);

  constructor() {
  }

  async getDocTypeRequiredSchemas(docTypeName: string): Promise<UblDocument> {
    if (this.docTypesRequiredGroupSchemasCache[docTypeName]) {
      return this.docTypesRequiredGroupSchemasCache[docTypeName];
    }

    let doc = await this.getSchemaDocument(docTypeName);
    let docName = doc.required[0];
    let definitions = doc.definitions[docName];
    let required: string[] = definitions['required'];
    let properties = definitions['properties'];
    let document: UblDocument = {
      title: definitions['title'],
      description: definitions['description'],
      required: required,
      properties: {}
    }

    required.forEach((requiredName) => {
      let type = properties[requiredName]['type'];
      let ref = type === "array" ? properties[requiredName]['items']['$ref'] : properties[requiredName]['$ref'];
      if (this.aggregateService.isCacRef(ref)) {
        document.properties[requiredName] = this.aggregateService.getRequiredAggregateGroupSchemas(ref);
      } else {
        document.properties[requiredName] = this.basicService.getBasicSchemaFromRef(ref);
      }
    });

    this.docTypesRequiredGroupSchemasCache[docTypeName] = document;
    return this.docTypesRequiredGroupSchemasCache[docTypeName];
  }

  async getDocTypeNonRequiredSchemas(docTypeName: string) {
    if (this.docTypesNonRequiredGroupSchemasCache[docTypeName]) {
      return this.docTypesNonRequiredGroupSchemasCache[docTypeName];
    }

    let doc = await this.getSchemaDocument(docTypeName);
    let docName = doc.required[0];
    let definitions = doc.definitions[docName];
    let required: string[] = definitions['required'];
    let properties = definitions['properties'];
    let propertyNames = Object.keys(properties);

    this.docTypesNonRequiredGroupSchemasCache[docTypeName] = {properties: {}};
    propertyNames.forEach((name) => {
      if (!required.includes(name)) {
        let type = properties[name]['type'];
        let ref: string = type === "array" ? properties[name]['items']['$ref'] : properties[name]['$ref'];;
        if (this.aggregateService.isCacRef(ref)) {
          this.docTypesNonRequiredGroupSchemasCache[docTypeName]['properties'][name] = this.aggregateService.getRequiredAggregateGroupSchemas(ref);
        } else {
          this.docTypesNonRequiredGroupSchemasCache[docTypeName]['properties'][name] = this.basicService.getBasicSchemaFromRef(ref);
        }
      }
    });
    return this.docTypesNonRequiredGroupSchemasCache[docTypeName];
  }

  // param should be the name of the aggregate group name. e.g. cac:Party
  getNonRequiredAggregateGroupSchemas(name: string) {
    return this.aggregateService.getNonRequiredAggregateGroupSchemasByName(name);
  }

  private async getSchemaDocument(name: string): Promise<any> {
    if (this.documentSchemaCache[name]) {
      return this.documentSchemaCache[name];
    }

    const fileName = `UBL-${name}-2.3.json`;
    const schema = await import(`../../../public/ubl/maindoc/${fileName}`)

    if (schema) {
      this.documentSchemaCache[name] = schema;
      return this.documentSchemaCache[name];
    }
    throw new Error(`Schema not found for ${name}`);
  }

  //
  // async getDocTypeRequiredFieldNames(docTypeName: string): Promise<string[]> {
  //   if (this.docTypesRequiredFieldNamesCache[docTypeName]) {
  //     return this.docTypesRequiredFieldNamesCache[docTypeName];
  //   }
  //
  //   let schema = await this.getSchema(docTypeName);
  //   if (schema) {
  //     let docType = schema.required; // top level required field that is the document type itself
  //     if (docType && schema.definitions[docType]) {
  //       this.docTypesRequiredFieldNamesCache[docTypeName] = schema.definitions[docType].required as string[];
  //       return this.docTypesRequiredFieldNamesCache[docTypeName];
  //     }
  //   }
  //
  //   throw new Error(`Required fields not found for ${docTypeName}`);
  // }
  //
  //
  // async getDocTypeRequiredRefs(docTypeName: string) {
  //   if (this.docTypesRequiredRefsCache[docTypeName]) {
  //     return this.docTypesRequiredRefsCache[docTypeName];
  //   }
  //
  //   this.docTypesRequiredRefsCache[docTypeName] = {};
  //   let fieldNames = await this.getDocTypeRequiredFieldNames(docTypeName);
  //   for (const fieldName of fieldNames) {
  //     let schema = await this.getSchema(docTypeName);
  //     let property = schema['definitions'][docTypeName]['properties'][fieldName];
  //     this.docTypesRequiredRefsCache[docTypeName][fieldName] = property;
  //   }
  //
  //   return this.docTypesRequiredRefsCache[docTypeName];
  // }
  //
  //
  // async getDocTypePropertyRefs(docTypeName: string) {
  //   if (this.docTypesPropertiesRefsCache[docTypeName]) {
  //     return this.docTypesPropertiesRefsCache[docTypeName];
  //   }
  //
  //   this.docTypesPropertiesRefsCache[docTypeName] = {};
  //   let schema = await this.getSchema(docTypeName);
  //   let fieldNames = Object.keys(schema['definitions'][docTypeName]['properties']);
  //   for (const fieldName of fieldNames) {
  //     if (this.docTypesRequiredFieldNamesCache[docTypeName].includes(fieldName)) {
  //       continue; // skip required fields those are already cached
  //     }
  //     let property = schema['definitions'][docTypeName]['properties'][fieldName];
  //     this.docTypesPropertiesRefsCache[docTypeName][fieldName] = property;
  //   }
  //
  //   return this.docTypesPropertiesRefsCache[docTypeName];
  // }
  //
  //
  // // getCacSchemaFromRef(ref: string) {
  // //   if (this.aggregateRefsCache[ref]) {
  // //     return this.aggregateRefsCache[ref];
  // //   }
  // //   this.aggregateRefsCache[ref] = this.aggregateService.getAggregateRefs(ref);
  // //   this.aggregateRefsCache[ref] = this.aggregateRefsCache[ref].property;
  // //   return this.aggregateRefsCache[ref];
  // // }
  //
  // getBasicRefSchema(ref: string): Schemas {
  //   if (this.basicService.isCbcRef(ref)) {
  //     return this.basicService.getBasicSchemaFromRef(ref);
  //   } else if (this.basicService.isQdtRef(ref)) {
  //     return this.basicService.getQdtSchemaFromRef(ref);
  //   } else if (this.basicService.isUdtRef(ref)) {
  //     return this.basicService.getUdtSchemaFromRef(ref);
  //   }
  //   throw new Error(`getBasicRefSchema -- ${ref} is not cbc, qdt or udt`);
  // }


}
