import {inject, Injectable} from '@angular/core';
import {getRefName} from "./util";
import {BasicService} from "./basic.service";
import {cac, Ubl} from "../model/ubl.model";
import Aggregate = Ubl.Aggregate;
import NextRef = Ubl.NextRef;
import Array = Ubl.Array;

type Property = {
  title?: string;
  description?: string;
  items?: { $ref: string };
  $ref?: string;
  required?: string[];
  properties?: { [key: string]: Property };
  maxItems?: number;
  minItems?: number;
  type: "array" | "object";
}

@Injectable({
  providedIn: 'root'
})
export class AggregateService {
  /* following invoice document schema and sample data
  1. aggregate element has not type, it seems can be return and require 'click-expand' to retrieve the next level details.
  2. aggregate element has type object or array, it seems can be stop point.

  plan:
  1. get first levels of aggregate elements from document schema
      a. if type is object-or-array, and it is basic, return the schema, and marked it as basic
      b. if type is object-or-array, and it is aggregate, go to the next level then return and mark as aggregate, but stop for type is not object-or-array those need click-expand
      c. if type is undefined, go to the next level and repeat a and b. from the sample data, it seems that the type is undefined can be skipped the key, and directly go to the ref
  */
  isCacRef = (ref: string) => ref.startsWith(`../common/UBL-CommonAggregateComponents-2.3.json`);

  basicService = inject(BasicService);

  aggregateCache: Map<string, Ubl.Aggregate> = new Map();
  basicCache: Map<string, Ubl.Basic | Ubl.Extension> = new Map();
  definitionsCache: Map<string, any> = new Map();

  getRequiredAggregatesByRef(ref: string) {
    let cacName = getRefName(ref)
    let def = this.getOrSetDefinition(cacName);
    let required = def['required'];
    let properties = def['properties'];
    return this.getAggregatesFromSetting(def.title, def.description, properties, required, true);
  }

  getNonRequiredAggregatesByRef(ref: string) {
    let name = getRefName(ref)
    let def = this.getOrSetDefinition(name);
    let required = def['required'];
    let properties = def['properties'];
    return this.getAggregatesFromSetting(def.title, def.description, properties, required, false);
  }

  getNonRequiredAggregatesByName(name: string) {
    let def = this.getOrSetDefinition(name);
    let required = def['required'];
    let properties = def['properties'];
    return this.getAggregatesFromSetting(def.title, def.description, properties, required, false);
  }

  getAggregatesFromSetting(title: string, description: string, properties: Property[], required?: string[], isRequiredOnly: boolean = true) {
    let propertyName = isRequiredOnly ? required ?? [] : Object.getOwnPropertyNames(properties).filter((x) => !required?.includes(x));
    let props: { [key: string]: Ubl.Basic | Ubl.Extension | Ubl.Aggregate | Ubl.Array | Ubl.NextRef } = {};
    let result = new Aggregate();
    result.title = title;
    result.description = description;
    result.required = required ?? [];

    propertyName.forEach((name) => {
      const type = properties[name].type;
      const ref = type === "array" ? properties[name].items.$ref : properties[name].$ref;
      const maxItems = properties[name].maxItems;

      if (type === "array" && maxItems === 1) {
        if (this.basicService.isBasicRef(ref)) {
          if (!this.basicCache.has(ref)) {
            const basic = this.basicService.getBasicByRef(ref);
            this.basicCache.set(ref, basic);
          }
          props[name] = this.basicCache.get(ref);
        } else if (this.isCacRef(ref)) {
          if (!this.aggregateCache.has(ref)) {
            const aggregate = this.getAggregatesFromInternalDef(ref, isRequiredOnly);
            this.aggregateCache.set(ref, aggregate);
          }
          props[name] = this.aggregateCache.get(ref);
        }
      } else if (type === "array" || type === "object") {
        if (this.basicService.isBasicRef(ref)) {
          if (!this.basicCache.has(ref)) {
            const basic = this.basicService.getBasicByRef(ref);
            this.basicCache.set(ref, basic);
          }

          if (type === "array") {
            let array = new Ubl.Array();
            array.title = properties[name].title;
            array.description = properties[name].description;
            array.items = this.basicCache.get(ref) as Ubl.Basic;
            props[name] = array;
          } else {
            props[name] = this.basicCache.get(ref);
          }
        } else if (this.isCacRef(ref)) {
          if (!this.aggregateCache.has(ref)) {
            const aggregate = this.getAggregatesFromInternalDef(ref, isRequiredOnly);
            this.aggregateCache.set(ref, aggregate);
          }
          if (type === "array") {
            let array = new Ubl.Array();
            array.title = properties[name].title;
            array.description = properties[name].description;
            array.items = this.aggregateCache.get(ref) as Ubl.Aggregate;
            props[name] = array;
          } else {
            props[name] = this.aggregateCache.get(ref);
          }
        }
      } else if (type === undefined && this.basicService.isBasicRef(ref)) {
        if (!this.basicCache.has(ref)) {
          const basic = this.basicService.getBasicByRef(ref);
          this.basicCache.set(ref, basic);
        }
        props[name] = this.basicCache.get(ref);
      } else {
        let nextRef = new NextRef();
        nextRef.$ref = ref;
        nextRef.title = properties[name].title;
        nextRef.description = properties[name].description;
        props[name] = nextRef;
      }
    });

    result.properties = props;
    return result;
  }

  getAggregatesFromInternalDef(ref: string, isRequiredOnly: boolean = true) {
    const refName = getRefName(ref);
    const def = this.getOrSetDefinition(refName);
    const required = def?.required || [];

    return this.getAggregatesFromSetting(def.title, def.description, def.properties, required, isRequiredOnly);
  }

  private getOrSetDefinition(cacName: string) {
    if (this.definitionsCache.has(cacName)) return this.definitionsCache.get(cacName);

    let definition = this.getDefinitionByRefName(cacName);

    this.definitionsCache.set(cacName, definition);

    return this.definitionsCache.get(cacName);
  };

  private getDefinitionByRefName(refName: string) {
    const definition = cac.definitions[refName];
    if (definition?.type === 'object') {
      return definition;
    }

    const ref = definition?.$ref;
    if (ref?.startsWith('#/definitions/')) {
      const cacName = ref.substring(ref.lastIndexOf('/') + 1);
      return this.getDefinitionByRefName(cacName);
    }

    throw new Error(`getDefinitionByRefName ${refName} cannot find properties`);
  }


  /*
  * below can be deleted after refactored
  * */
  // definitionsCache: Map<string, any> = new Map();
  // schemaCache: Map<string, any> = new Map();
  //
  // circulars = new Map();
  // circularCount: Map<string, number> = new Map();
  //
  // constructor() {
  //   this.circulars.set('SubsidiaryLocation', '#/definitions/SubsidiaryLocation');
  //   this.circulars.set('HeadOfficeParty', '#/definitions/HeadOfficeParty');
  //   this.circulars.set('Party', '#/definitions/Party');
  //   this.circulars.set('IssuerParty', '#/definitions/IssuerParty');
  //   this.circulars.set('SignatoryParty', '#/definitions/SignatoryParty');
  //   this.circulars.set('AgentParty', '#/definitions/AgentParty');
  //   this.circulars.set('NotaryParty', '#/definitions/NotaryParty');
  //   this.circulars.set('WitnessParty', '#/definitions/WitnessParty');
  //   this.circulars.set('PreviousPriceList', '#/definitions/PreviousPriceList');
  // }
  //
  //
  // getRequiredAggregateGroupSchemas(ref: string) {
  //   let cacName = getRefName(ref)
  //   let def = this.getOrSetDefinition(cacName);
  //   let required = def['required'];
  //   let properties = def['properties'];
  //   return this.getConfigFromJsonObjectProperty(properties, required, true);
  // }
  //
  // getNonRequiredAggregateGroupSchemasByName(name: string) {
  //   //assume that when call this method, just try to get  schemas for a non-required property of aggregate field
  //   let def = this.getOrSetDefinition(name);
  //   let required = def['required'];
  //   let properties = def['properties'];
  //   return this.getConfigFromJsonObjectProperty(properties, required, false);
  // }
  //
  // private getConfigFromJsonObjectProperty(properties, required?: string[], isRequiredOnly: boolean = true): Aggregate[] {
  //   let ownProds = isRequiredOnly ? required ?? [] : Object.getOwnPropertyNames(properties).filter((x) => !required?.includes(x));
  //
  //   return ownProds.flatMap((name) => {
  //     let type = properties[name]['type'];
  //     let ref = type === "array" ? properties[name]['items']['$ref'] : properties[name]['$ref'];
  //     if (this.basicService.isBasicRef(ref)) {
  //       if (this.schemaCache.has(ref)) {
  //         return this.schemaCache.get(ref);
  //       }
  //       const schema = this.generateOutput(name, this.basicService.getBasicByRef(ref), type, properties[name]['title'], properties[name]['description']);
  //       this.schemaCache.set(ref, schema);
  //       return schema;
  //     } else if (ref.startsWith('#/definitions/')) {
  //       if (this.schemaCache.has(ref)) {
  //         return this.schemaCache.get(ref);
  //       }
  //       const schema = this.generateOutput(name, this.getConfigFromInternalDef(ref, isRequiredOnly), type, properties[name]['title'], properties[name]['description']);
  //       this.schemaCache.set(ref, schema);
  //       return this.schemaCache.get(ref);
  //     } else {
  //       throw new Error(`${ref} is not cbc or internal definition`);
  //     }
  //   }).filter((x) => x != null);
  // }
  //
  // private getOrSetDefinition(cacName: string) {
  //   if (this.definitionsCache.has(cacName)) return this.definitionsCache.get(cacName);
  //
  //   let definition = this.getDefinitionByRefName(cacName);
  //
  //   this.definitionsCache.set(cacName, definition);
  //
  //   return this.definitionsCache.get(cacName);
  // };
  //
  // private getDefinitionByRefName(refName: string) {
  //   const definition = cac.definitions[refName];
  //   if (definition?.type === 'object') {
  //     return definition;
  //   }
  //
  //   const ref = definition?.$ref;
  //   if (ref?.startsWith('#/definitions/')) {
  //     const cacName = ref.substring(ref.lastIndexOf('/') + 1);
  //     return this.getDefinitionByRefName(cacName);
  //   }
  //
  //   throw new Error(`getDefinitionByRefName ${refName} cannot find properties`);
  // }
  //
  //
  // // not sure if necessary to add name to map schemas? otherwise, return an array of schemas
  // // if basic schema do not need to name, can pass the name as null, then add condition to only return schemas
  // private generateOutput(name: string, val: any, type: string, title: string, description: string) {
  //   return val ? {key: name, schemas: val, type: type, title: title, description: description} as Aggregate : null;
  // }
  //
  // private getConfigFromInternalDef(ref: string, isRequiredOnly: boolean = true): any[] {
  //   const refName = getRefName(ref);
  //
  //   if (this.circulars.has(refName)) {
  //     this.addCircularCount(refName);
  //     if (this.circularCount.get(refName) > 1) {
  //       console.log(`${refName} has circular more than 1 times`);
  //       return [];
  //     }
  //   }
  //
  //   const def = this.getOrSetDefinition(refName);
  //   const required = def?.required || [];
  //
  //   if (def?.properties) {
  //     return this.getConfigFromJsonObjectProperty(def.properties, required, isRequiredOnly);
  //   } else {
  //     console.log(`getConfigFromInternalDef ${def} cannot find properties`);
  //     return [];
  //   }
  // }
  //
  // private addCircularCount(ref) {
  //   const count = this.circularCount.get(ref) || 0;
  //   this.circularCount.set(ref, count + 1);
  // }

}


// private getConfigFromJsonObjectProperty(properties, required?: string[], isRequiredOnly: boolean = true) {
//   let ownProds = Object.getOwnPropertyNames(properties);
//   if (isRequiredOnly) {
//     if (required == undefined) {
//       return []
//     }
//     ownProds = required;
//   } else {
//     ownProds = required == undefined ? ownProds : ownProds.filter((x) => !required.includes(x));
//   }
//
//   let result: any[] = [];
//   result = ownProds.flatMap((name) => {
//     let type = properties[name]['type'];
//     let ref = type === "array" ? properties[name]['items']['$ref'] : properties[name]['$ref'];
//     switch (true) {
//       case this.basicService.isBasicRef(ref): {
//         if (this.schemaCache.has(ref)) {
//           return this.schemaCache.get(ref);
//         }
//
//         const schema = this.generateOutput(name, this.basicService.getBasicSchemaFromRef(ref), type);
//
//         this.schemaCache.set(ref, schema);
//         return schema;
//       }
//       case ref.startsWith('#/definitions/'):
//         if (this.schemaCache.has(ref)) {
//           return this.schemaCache.get(ref);
//         }
//
//         const schema = this.generateOutput(name, this.getConfigFromInternalDef(ref, isRequiredOnly), type);  // pass isRequiredOnly to true for skip recursive
//
//         this.schemaCache.set(ref, schema);
//         return this.schemaCache.get(ref);
//       default:
//         throw new Error(`${ref} is not cbc or internal definition`);
//     }
//   });
//
//
//   return result.filter((x) => x != null);
// };
