import {Injectable} from '@angular/core';
import {getRefName} from "./util";
import {cbc, cct, cec, qdt, Schema, Ubl, udt} from "../model/ubl.mdel";
import Extension = Ubl.Extension;
import Basic = Ubl.Basic;

@Injectable({
  providedIn: 'root'
})
export class BasicService {

  constructor() {
  }

  isCbcRef = (ref: string) => ref.includes(`UBL-CommonBasicComponents-2.3.json`);

  isQdtRef = (ref: string) => ref.includes(`UBL-QualifiedDataTypes-2.3.json`);

  isCctRef = (ref: string) => ref.includes(`BDNDR-CCTS_CCT_SchemaModule-1.1.json`);

  isUdtRef = (ref: string) => ref.includes(`BDNDR-UnqualifiedDataTypes-1.1.json`);

  isCecRef = (ref: string) => ref.includes(`UBL-CommonExtensionComponents-2.3.json`);

  isBasicRef = (ref: string) => this.isCbcRef(ref) || this.isQdtRef(ref) || this.isUdtRef(ref) || this.isCecRef(ref);

  getBasicByRef(ref: string): Basic | Extension {
    if (this.isBasicRef(ref)) {
      if (this.isCbcRef(ref)) {
        return this.getCbcByRef(ref);
      } else if (this.isQdtRef(ref)) {
        return this.getQdtByRef(ref);
      } else if (this.isUdtRef(ref)) {
        return this.getUdtByRef(ref);
      } else if (this.isCctRef(ref)) {
        return this.getCctByRef(ref);
      } else if (this.isCecRef(ref)) {
        return this.getExtensionByRef(ref);
      }
    }

    throw new Error(`getCbcRefSchema -- ${ref} is not cbc`);
  }

  getCbcByRef(ref: string): Basic | Extension {
    if (this.isCbcRef(ref)) {
      let refName = getRefName(ref);
      let cbcRef = cbc.definitions[refName]['$ref'];
      if (this.isQdtRef(cbcRef)) {
        return this.getQdtByRef(cbcRef);
      } else if (this.isUdtRef(cbcRef)) {
        return this.getUdtByRef(cbcRef);
      } else if (this.isCctRef(cbcRef)) {
        return this.getCctByRef(cbcRef);
      }
      throw new Error(`getCbcRefSchema --  ${cbcRef}  is qdt or udt`);
    } else if (this.isCecRef(ref)) {
      return this.getExtensionByRef(ref);
    }
    throw new Error(`getCbcRefSchema -- ${ref} is not cbc`);
  }

  getQdtByRef(ref: string): Basic {
    let qdtRefName = getRefName(ref);
    let udtRef = qdt.definitions[qdtRefName]['$ref'];
    if (this.isUdtRef(udtRef)) {
      return this.getUdtByRef(udtRef);
    }
    throw new Error(`getCbcRefSchema -- ${ref} -> ${qdtRefName} -> ${udtRef} is not cct`);
  }

  getUdtByRef(ref: string): Basic {
    let udtRefName = getRefName(ref);
    let schema = udt.definitions[udtRefName];

    if (schema['$ref']) {
      return this.getCctByRef(schema['$ref']);
    }
    return this.toBasic(schema)
  }

  getCctByRef(ref: string): Basic {
    let cctRefName = getRefName(ref);
    return this.toBasic(cct.definitions[cctRefName]);
  }

  getExtensionByRef(ref: string): Extension {
    let ext = cec.definitions[getRefName(ref)];
    let result = new Extension();
    result.title = ext.title;
    result.description = ext.description;
    result.required = ext.required;
    result.properties = ext.properties;
    return result;
  }

  private toBasic(schema: Schema): Basic {
    let result = new Basic();
    result.title = schema.title;
    result.description = schema.description;
    result.required = schema.required;
    result.properties = schema.properties;
    return result;
  }

  /*
  * below all methods can be deleted after refactored
  * */

  // getBasicSchemaFromRef(ref: string) : Schema | Properties {
  //   if(this.isBasicRef(ref)) {
  //     if (this.isCbcRef(ref)) {
  //       return this.getCbcSchemaFromRef(ref);
  //     } else if (this.isQdtRef(ref)) {
  //       return this.getQdtSchemaFromRef(ref);
  //     } else if (this.isUdtRef(ref)) {
  //       return this.getUdtSchemaFromRef(ref);
  //     } else if (this.isCctRef(ref)) {
  //       return this.getCctSchemaFromRef(ref);
  //     } else if(this.isCecRef(ref)){
  //       return this.getCecSchema(ref);
  //     }
  //   }
  //
  //   throw new Error(`getCbcRefSchema -- ${ref} is not cbc`);
  // }
  //
  // getCbcSchemaFromRef(ref: string): Schema | Properties {
  //   if(this.isCbcRef(ref)){
  //     let refName = getRefName(ref);
  //     let cbcRef = cbc.definitions[refName]['$ref'];
  //     if(this.isQdtRef(cbcRef)){
  //       return this.getQdtSchemaFromRef(cbcRef);
  //     } else if(this.isUdtRef(cbcRef)){
  //       return this.getUdtSchemaFromRef(cbcRef);
  //     } else if(this.isCctRef(cbcRef)){
  //       return this.getCctSchemaFromRef(cbcRef);
  //     }
  //     throw new Error(`getCbcRefSchema --  ${cbcRef}  is qdt or udt`);
  //   } else if(this.isCecRef(ref)) {
  //     return this.getCecSchema(ref);
  //   }
  //   throw new Error(`getCbcRefSchema -- ${ref} is not cbc`);
  // }
  //
  // getQdtSchemaFromRef(ref: string): Schema {
  //   let qdtRefName = getRefName(ref);
  //   let udtRef = qdt.definitions[qdtRefName]['$ref'];
  //   if(this.isUdtRef(udtRef)){
  //    return this.getUdtSchemaFromRef(udtRef);
  //   }
  //   throw new Error(`getCbcRefSchema -- ${ref} -> ${qdtRefName} -> ${udtRef} is not cct`);
  // }
  //
  // getUdtSchemaFromRef(ref: string): Schema {
  //   let udtRefName = getRefName(ref);
  //   let schema =  udt.definitions[udtRefName];
  //
  //   if(schema['$ref']){
  //     return this.getCctSchemaFromRef(schema['$ref']);
  //   }
  //   return schema
  // }
  //
  // getCctSchemaFromRef(ref: string): Schema {
  //   let cctRefName = getRefName(ref);
  //   return cct.definitions[cctRefName];
  // }
  //
  // getCecSchema(ref: string): Schema {
  //   return cec.definitions[getRefName(ref)];
  //   // todo: do this later. it is a special case
  //   //let extension  = cec.definitions[getRefName(ref)]
  //   // extension['title'] = 'UBLExtension';
  //   // return extension;
  // }
}


