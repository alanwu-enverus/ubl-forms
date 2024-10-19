import {inject, Injectable} from '@angular/core';
import {cac, getRefName, levelString} from "./util";
import {BasicService} from "./basic.service";

@Injectable({
  providedIn: 'root'
})
export class AggregateService {
  // this.service provides
  // 1. get required schemas for a ref name
  // 2. get non-required schemas for a ref name

  //1. get required refs for a ref name
  //1.1 if the type of the ref is an object, return the ref
  //1.2 if self-ref, find next ref until object type
  //
  //2. from the refs, get schema
  //2.1 if the ref is basic, get schema from basic
  //2.2 if the ref is aggregate, recurse get aggregate schema method

  definitionsCache: Map<string, any> = new Map();
  schemaCache: Map<string, any> = new Map();

  circulars = new Map();
  circularCount: Map<string, number> = new Map();

  constructor() {
    this.circulars.set('SubsidiaryLocation', '#/definitions/SubsidiaryLocation');
    this.circulars.set('HeadOfficeParty', '#/definitions/HeadOfficeParty');
    this.circulars.set('Party', '#/definitions/Party');
    this.circulars.set('IssuerParty', '#/definitions/IssuerParty');
    this.circulars.set('SignatoryParty', '#/definitions/SignatoryParty');
    this.circulars.set('AgentParty', '#/definitions/AgentParty');
    this.circulars.set('NotaryParty', '#/definitions/NotaryParty');
    this.circulars.set('WitnessParty', '#/definitions/WitnessParty');
    this.circulars.set('PreviousPriceList', '#/definitions/PreviousPriceList');
  }

  isCacRef = (ref: string) => ref.startsWith(`../common/UBL-CommonAggregateComponents-2.3.json`);

  basicService = inject(BasicService);

  level = 0;

  getRequiredAggregateGroupSchemas(ref: string) {
    let cacName = getRefName(ref)
    let def = this.getOrSetDefinition(cacName);
    let required = def['required'];
    let property = def['properties'];
    return this.getConfigFromJsonObjectProperty(cacName, property, required);
  }

  getNonRequiredAggregateGroupSchemasByName(name: string) {
    //assume that when call this method, just try to get  schemas for a non-required property of aggregate field
    let def = this.getOrSetDefinition(name);
    let required = def['required'];
    let property = def['properties'];
    return this.getConfigFromJsonObjectProperty(name, property, required, false);
  }

  private getConfigFromJsonObjectProperty(parent: string, property, required?: string[], isRequiredOnly: boolean = true) {
    let ownProds = Object.getOwnPropertyNames(property);
    if (isRequiredOnly) {
      if (required == undefined) {
        return []
      }
      ownProds = required;
    } else {
      ownProds = required == undefined ? ownProds : ownProds.filter((x) => !required.includes(x));
    }

    let result: any[] = [];
    result = ownProds.flatMap((name) => {
      // console.log( levelString(`getConfigFromJsonObjectProperty ${parent} -> ${name}`, this.level));
      let type = property[name]['type'];
      let ref = type === "array" ? property[name]['items']['$ref'] : property[name]['$ref'];
      switch (true) {
        case this.basicService.isBasicRef(ref): {
          if (this.schemaCache.has(ref)) {
            return this.schemaCache.get(ref);
          }

          const schema = this.generateOutput(name, this.basicService.getBasicSchemaFromRef(ref), type);
          this.schemaCache.set(ref, schema);
          return schema;
        }
        case ref.startsWith('#/definitions/'):
          if (this.schemaCache.has(ref)) {
            return this.schemaCache.get(ref);
          }

          console.log(levelString(`getConfigFromInternalDef ${name} -> ${ref}`, this.level));
          const schema =  this.generateOutput(name, this.getConfigFromInternalDef(`${parent} -> ${ref}`, ref, isRequiredOnly), type);  // pass isRequiredOnly to true for skip recursive
          this.schemaCache.set(ref, schema);
          return this.schemaCache.get(ref);
        default:
          throw new Error(`${ref} is not cbc or internal definition`);
      }
    });


    return result.filter((x) => x != null);
  };

  private getOrSetDefinition(cacName: string) {
    if (this.definitionsCache.has(cacName)) return this.definitionsCache.get(cacName);

    let definition = this.getDefinitionByRefName(cacName);

    this.definitionsCache.set(cacName, definition);

    return this.definitionsCache.get(cacName);
  };

  private getDefinitionByRefName(refName: string) {
    // console.log(refName);
    let definition = cac.definitions[refName];
    // console.log(JSON.stringify(definition, null, '\t'));
    if (definition?.type && 'object' == definition['type']) {
      return definition;
    }

    if (definition.hasOwnProperty('$ref')) {
      let ref = definition['$ref'] as string;
      if (ref.startsWith('#/definitions/')) {
        let cacName = ref.substring(ref.lastIndexOf('/') + 1);
        return this.getDefinitionByRefName(cacName);
      }
    } else {
      throw new Error(`getDefinitionByRefName ${refName} cannot find properties`);
    }
  };


  // not sure if necessary to add name to map schemas? otherwise, return an array of schemas
  // if basic schema do not need to name, can pass the name as null, then add condition to only return schemas
  private generateOutput(name: string, val: any, type: string) {
    return val ? {key: name, schemas: val, type: type} : null;
  }

  // parent is for debug purpose
  private getConfigFromInternalDef(parent: string, ref: string, isRequiredOnly: boolean = true): any[] {

    let refName = getRefName(ref);

    if (this.circulars.has(refName)) {
      this.addCircularCount(refName);
      if (this.circularCount.get(refName) > 1) {
        console.log(`${refName} has circular more than 1 times`);
        return [];
      }
    }

    let def = this.getOrSetDefinition(refName);
    let required = def['required'] || [];

    if (def && def['properties']) {
      this.level++;
      let property = def['properties'];
      console.log(levelString(`getConfigFromJsonObjectProperty ${parent} `, this.level));
      let configs = this.getConfigFromJsonObjectProperty(`${parent}`, property, required, isRequiredOnly); // limit the level of recursion
      return configs;
    } else {
      console.log(`getConfigFromInternalDef ${def} cannot find properties`);
      return [];
    }
  };

  private addCircularCount(ref) {
    if (this.circularCount.has(ref)) {
      this.circularCount.set(ref, this.circularCount.get(ref) + 1);
    } else {
      this.circularCount.set(ref, 1);
    }
  };

  getAggregateRefs(ref: string) {
    if (this.isCacRef(ref)) {
      let refName = getRefName(ref);
      let def = this.getOrSetDefinition(refName)
      let required = def['required'];
      let property = def['properties'];
      return {required, property};
    }
    throw new Error(`getCacRefSchema -- ${ref} is not cac`);
  }

}
