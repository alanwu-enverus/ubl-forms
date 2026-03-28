import {inject, Injectable} from '@angular/core';
import {getRefName} from "./util";
import {BasicService} from "./basic.service";
import {cac, Ubl} from "../model/ubl.model";
import Aggregate = Ubl.Aggregate;
import NextRef = Ubl.NextRef;

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
  isCacRef = (ref: string) => ref.includes('UBL-CommonAggregateComponents-2.3.json');
  isRef = (ref: string) => ref.startsWith('#/definitions/');

  basicService = inject(BasicService);

  aggregateCache: Map<string, Ubl.Aggregate> = new Map();
  basicCache: Map<string, Ubl.Basic | Ubl.Extension> = new Map();
  definitionsCache: Map<string, any> = new Map();

  getRequiredAggregatesByRef(ref: string): Aggregate {
    return this.getAggregatesByRef(ref, true);
  }

  getNonRequiredAggregatesByRef(ref: string): Aggregate {
    return this.getAggregatesByRef(ref, false);
  }

  getNonRequiredAggregatesByName(name: string): Aggregate {
    const def = this.getOrSetDefinition(name);
    return this.getAggregatesFromSetting(def.title, def.description, def.properties, def.required, false);
  }

  getAggregatesFromSetting(title: string, description: string, properties: Property[], required?: string[], isRequiredOnly = true): Aggregate {
    const names = isRequiredOnly
      ? (required ?? [])
      : Object.getOwnPropertyNames(properties).filter(x => !required?.includes(x));

    const result = new Aggregate();
    result.title = title;
    result.description = description;
    result.required = required ?? [];
    result.properties = {};

    names.forEach(name => {
      const prop = properties[name];
      const { type } = prop;
      const ref = type === 'array' ? prop.items.$ref : prop.$ref;
      const treatAsSingle = type === 'array' && prop.maxItems === 1;
      const wrapInArray = type === 'array' && !treatAsSingle;

      const item = this.resolveItem(ref, type, treatAsSingle, isRequiredOnly, prop);
      if (item) {
        result.properties[name] = wrapInArray ? this.makeArray(prop.title, prop.description, item) : item;
      }
    });

    return result;
  }

  getAggregatesFromInternalDef(ref: string, isRequiredOnly = true): Aggregate {
    const def = this.getOrSetDefinition(getRefName(ref));
    return this.getAggregatesFromSetting(def.title, def.description, def.properties, def.required ?? [], isRequiredOnly);
  }

  private getAggregatesByRef(ref: string, isRequiredOnly: boolean): Aggregate {
    const def = this.getOrSetDefinition(getRefName(ref));
    return this.getAggregatesFromSetting(def.title, def.description, def.properties, def.required, isRequiredOnly);
  }

  private resolveItem(
    ref: string,
    type: string,
    treatAsSingle: boolean,
    isRequiredOnly: boolean,
    prop: Property
  ): Ubl.Basic | Ubl.Extension | Ubl.Aggregate | Ubl.NextRef | null {
    if (this.basicService.isBasicRef(ref)) {
      return this.cachedBasic(ref);
    }
    if (this.isCacRef(ref) && type !== undefined) {
      return this.cachedAggregate(ref, isRequiredOnly);
    }
    if (this.isRef(ref) && type !== undefined && !treatAsSingle) {
      return this.makeNextRef(ref, prop.title, prop.description);
    }
    if (type === undefined) {
      return this.makeNextRef(ref, prop.title, prop.description);
    }
    return null;
  }

  private cachedBasic(ref: string): Ubl.Basic | Ubl.Extension {
    if (!this.basicCache.has(ref)) {
      this.basicCache.set(ref, this.basicService.getBasicByRef(ref));
    }
    return this.basicCache.get(ref);
  }

  private cachedAggregate(ref: string, isRequiredOnly: boolean): Ubl.Aggregate {
    if (!this.aggregateCache.has(ref)) {
      this.aggregateCache.set(ref, this.getAggregatesFromInternalDef(ref, isRequiredOnly));
    }
    return this.aggregateCache.get(ref);
  }

  private makeArray(title: string, description: string, items: Ubl.Basic | Ubl.Extension | Ubl.Aggregate | Ubl.NextRef): Ubl.Array {
    const array = new Ubl.Array();
    array.title = title;
    array.description = description;
    array.items = items;
    return array;
  }

  private makeNextRef(ref: string, title: string, description: string): NextRef {
    const nextRef = new NextRef();
    nextRef.$ref = ref;
    nextRef.title = title;
    nextRef.description = description;
    return nextRef;
  }

  private getOrSetDefinition(name: string): any {
    if (!this.definitionsCache.has(name)) {
      this.definitionsCache.set(name, this.getDefinitionByRefName(name));
    }
    return this.definitionsCache.get(name);
  }

  private getDefinitionByRefName(refName: string): any {
    const definition = cac.definitions[refName];
    if (definition?.type === 'object') return definition;

    const ref = definition?.$ref;
    if (ref?.startsWith('#/definitions/')) {
      return this.getDefinitionByRefName(ref.substring(ref.lastIndexOf('/') + 1));
    }

    throw new Error(`getDefinitionByRefName: cannot find properties for -- ${refName}`);
  }
}
