// import * as fs from 'fs';
// import * as path from 'path';
import * as cct from '../../../public/ubl/common/BDNDR-CCTS_CCT_SchemaModule-1.1.json';
import * as cbc from '../../../public/ubl/common/UBL-CommonBasicComponents-2.3.json';
import * as cac from '../../../public/ubl/common/UBL-CommonAggregateComponents-2.3.json';
import * as udt from '../../../public/ubl/common/BDNDR-UnqualifiedDataTypes-1.1.json';
import * as qdt from '../../../public/ubl/common/UBL-QualifiedDataTypes-2.3.json';
import * as cec from '../../../public/ubl/common/UBL-CommonExtensionComponents-2.3.json';
import {BasicComponent} from "../form/ubl/basic.component";
import {RefComponent} from "../form/ubl/ref.component";
import {ViewRef} from "@angular/core";
import {AggregateComponent} from "../form/ubl/aggregate.component";
import {ArrayComponent} from "../form/ubl/array.component";
import Basic = Ubl.Basic;
import Aggregate = Ubl.Aggregate;
import NextRef = Ubl.NextRef;

export {udt};
export {cct};
export {cac};
export {cbc};
export {qdt};
export {cec};

export namespace Ubl {
  export class Basic  {
    "title": string;
    "description": string;
    "required": string[];
    "properties": {
      [key: string]: {
        "type": string,
        "format"?: string,
      };
    }
  }
  export class Aggregate  {
    "title": string;
    "description": string;
    "required": string[];
    "properties": {
      [key: string]: Basic | Aggregate | Array | Extension | NextRef;
    };
    "additionalProperties"?: boolean;
  }

  export class Array  {
    "title": string;
    "description": string;
    items: Basic | Aggregate | NextRef;
  }

  export class ExtensionContent  {
    "description": string;
    "type": object;
  }

  export class Extension  {
    "title": string;
    "description": string;
    "required": string[];
    "properties": {
      [key: string]: Basic | ExtensionContent;
    }
  }

  // this is for the next level of the aggregate
  export class NextRef  {
    "title": string;
    "description": string;
    $ref: string;
  }


  export class Document  {
    title: string;
    description: string;
    required: string[];
    properties: {
      [key: string]: Basic | Aggregate | Array | Extension;
    }
  }

  export interface Cache<T>  {
    [key: string]: T;
  }
}

// this type just host the json schema
export type Schema = {
  title: string;
  description: string;
  required: string[];
  properties: {
    [key: string]: {
      type: string,
      format?: string,
    };
  },
  additionalProperties?: boolean;
}

export interface LoadedComponent {
  component: BasicComponent | AggregateComponent | RefComponent;
  array: ArrayComponent;
  viewRef: ViewRef;
  isRequired: boolean;
  position: number;
  name: string;
  isLoaded: boolean;
}

export type UblElementType = Basic | Aggregate | NextRef;


