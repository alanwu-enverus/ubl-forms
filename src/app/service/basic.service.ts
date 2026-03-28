import {Injectable} from '@angular/core';
import {getRefName} from "./util";
import {cbc, cct, cec, qdt, Schema, Ubl, udt} from "../model/ubl.model";
import Extension = Ubl.Extension;
import Basic = Ubl.Basic;

@Injectable({
  providedIn: 'root'
})
export class BasicService {
  isCbcRef = (ref: string) => ref.includes('UBL-CommonBasicComponents-2.3.json');
  isQdtRef = (ref: string) => ref.includes('UBL-QualifiedDataTypes-2.3.json');
  isCctRef = (ref: string) => ref.includes('BDNDR-CCTS_CCT_SchemaModule-1.1.json');
  isUdtRef = (ref: string) => ref.includes('BDNDR-UnqualifiedDataTypes-1.1.json');
  isCecRef = (ref: string) => ref.includes('UBL-CommonExtensionComponents-2.3.json');
  isBasicRef = (ref: string) => this.isCbcRef(ref) || this.isQdtRef(ref) || this.isUdtRef(ref) || this.isCecRef(ref);

  getBasicByRef(ref: string): Basic | Extension {
    if (this.isCbcRef(ref)) return this.getCbcByRef(ref);
    if (this.isQdtRef(ref)) return this.getQdtByRef(ref);
    if (this.isUdtRef(ref)) return this.getUdtByRef(ref);
    if (this.isCecRef(ref)) return this.getExtensionByRef(ref);
    throw new Error(`getBasicByRef: unknown ref type -- ${ref}`);
  }

  getCbcByRef(ref: string): Basic {
    const cbcRef = cbc.definitions[getRefName(ref)]['$ref'];
    if (this.isQdtRef(cbcRef)) return this.getQdtByRef(cbcRef);
    if (this.isUdtRef(cbcRef)) return this.getUdtByRef(cbcRef);
    if (this.isCctRef(cbcRef)) return this.getCctByRef(cbcRef);
    throw new Error(`getCbcByRef: unsupported inner ref -- ${cbcRef}`);
  }

  getQdtByRef(ref: string): Basic {
    const udtRef = qdt.definitions[getRefName(ref)]['$ref'];
    if (this.isUdtRef(udtRef)) return this.getUdtByRef(udtRef);
    throw new Error(`getQdtByRef: expected UDT ref but got -- ${udtRef}`);
  }

  getUdtByRef(ref: string): Basic {
    const schema = udt.definitions[getRefName(ref)];
    return schema['$ref'] ? this.getCctByRef(schema['$ref']) : this.toBasic(schema);
  }

  getCctByRef(ref: string): Basic {
    return this.toBasic(cct.definitions[getRefName(ref)]);
  }

  getExtensionByRef(ref: string): Extension {
    const ext = cec.definitions[getRefName(ref)];
    const result = new Extension();
    result.title = ext.title;
    result.description = ext.description;
    result.required = ext.required;
    result.properties = ext.properties;
    return result;
  }

  private toBasic(schema: Schema): Basic {
    const result = new Basic();
    result.title = schema.title;
    result.description = schema.description;
    result.required = schema.required;
    result.properties = schema.properties;
    return result;
  }
}
