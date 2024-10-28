import { Injectable } from '@angular/core';
import {cbc, cct, getRefName, qdt, Properties, cec, udt, Schema} from "./util";

@Injectable({
  providedIn: 'root'
})
export class BasicService {

  constructor() { }

  isCbcRef = (ref: string) => ref.includes(`UBL-CommonBasicComponents-2.3.json`) ;

  isQdtRef = (ref: string) => ref.includes(`UBL-QualifiedDataTypes-2.3.json`);

  isCctRef = (ref: string) => ref.includes(`BDNDR-CCTS_CCT_SchemaModule-1.1.json`);

  isUdtRef = (ref: string) => ref.includes(`BDNDR-UnqualifiedDataTypes-1.1.json`);

  isCecRef = (ref: string) => ref.includes(`UBL-CommonExtensionComponents-2.3.json`);

  isBasicRef = (ref: string) => this.isCbcRef(ref) || this.isQdtRef(ref) || this.isUdtRef(ref) || this.isCecRef(ref);


  getBasicSchemaFromRef(ref: string) : Schema | Properties {
    if(this.isBasicRef(ref)) {
      if (this.isCbcRef(ref)) {
        return this.getCbcSchemaFromRef(ref);
      } else if (this.isQdtRef(ref)) {
        return this.getQdtSchemaFromRef(ref);
      } else if (this.isUdtRef(ref)) {
        return this.getUdtSchemaFromRef(ref);
      } else if (this.isCctRef(ref)) {
        return this.getCctSchemaFromRef(ref);
      } else if(this.isCecRef(ref)){
        return this.getCecSchema(ref);
      }
    }

    throw new Error(`getCbcRefSchema -- ${ref} is not cbc`);
  }

  getCbcSchemaFromRef(ref: string): Schema | Properties {
    if(this.isCbcRef(ref)){
      let refName = getRefName(ref);
      let cbcRef = cbc.definitions[refName]['$ref'];
      if(this.isQdtRef(cbcRef)){
        return this.getQdtSchemaFromRef(cbcRef);
      } else if(this.isUdtRef(cbcRef)){
        return this.getUdtSchemaFromRef(cbcRef);
      } else if(this.isCctRef(cbcRef)){
        return this.getCctSchemaFromRef(cbcRef);
      }
      throw new Error(`getCbcRefSchema --  ${cbcRef}  is qdt or udt`);
    } else if(this.isCecRef(ref)) {
      return this.getCecSchema(ref);
    }
    throw new Error(`getCbcRefSchema -- ${ref} is not cbc`);
  }

  getQdtSchemaFromRef(ref: string): Schema {
    let qdtRefName = getRefName(ref);
    let udtRef = qdt.definitions[qdtRefName]['$ref'];
    if(this.isUdtRef(udtRef)){
     return this.getUdtSchemaFromRef(udtRef);
    }
    throw new Error(`getCbcRefSchema -- ${ref} -> ${qdtRefName} -> ${udtRef} is not cct`);
  }

  getUdtSchemaFromRef(ref: string): Schema {
    let udtRefName = getRefName(ref);
    let schema =  udt.definitions[udtRefName];

    if(schema['$ref']){
      return this.getCctSchemaFromRef(schema['$ref']);
    }
    return schema
  }

  getCctSchemaFromRef(ref: string): Schema {
    let cctRefName = getRefName(ref);
    return cct.definitions[cctRefName];
  }

  getCecSchema(ref: string): Properties {
    return cec.definitions[getRefName(ref)];
    // todo: do this later. it is a special case
    //let extension  = cec.definitions[getRefName(ref)]
    // extension['title'] = 'UBLExtension';
    // return extension;
  }
}


