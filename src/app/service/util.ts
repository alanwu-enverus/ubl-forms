// import * as fs from 'fs';
// import * as path from 'path';
import * as cct from '../../../public/ubl/common/BDNDR-CCTS_CCT_SchemaModule-1.1.json';
import * as cbc from '../../../public/ubl/common/UBL-CommonBasicComponents-2.3.json';
import * as cac from '../../../public/ubl/common/UBL-CommonAggregateComponents-2.3.json';
import * as udt from '../../../public/ubl/common/BDNDR-UnqualifiedDataTypes-1.1.json';
import * as qdt from '../../../public/ubl/common/UBL-QualifiedDataTypes-2.3.json';
import * as cec from '../../../public/ubl/common/UBL-CommonExtensionComponents-2.3.json';
import {FormControl, FormGroup, Validators} from "@angular/forms";

export {udt};
export {cct};
export {cac};
export {cbc};
export {qdt};
export {cec};

export function getRefName(ref: string) {
  return ref.substring(ref.lastIndexOf('/') + 1);
}

export function removeNulls(obj: any) {
  for (let key in obj) {
    if (obj[key] === '' || obj[key] === null) {
      delete obj[key];
    } else if (Object.prototype.toString.call(obj[key]) === '[object Object]') {
      removeNulls(obj[key]);
    } else if (Array.isArray(obj[key])) {
      if (obj[key].length == 0) {
        delete obj[key];
      } else {
        for (let _key in obj[key]) {
          removeNulls(obj[key][_key]);
        }
        obj[key] = obj[key].filter(value => Object.keys(value).length !== 0);
        if (obj[key].length == 0) {
          delete obj[key];
        }
      }
    }
  }
  return obj;
}

export type cache = {
  [key: string]: any;
}

//host basic schema
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

//host properties key->schema ?? seems this is only for UblExtension type ??
export type Properties = {
  [key: string]: Schema
}

//aggregate type
export type Aggregate = {
  key: string;
  schemas: Schema | Schema[] | Aggregate | Aggregate[]; // can be renamed to properties
  type: string;
  title: string;
  description: string;
}

//host document type
export type UblDocument = {
  title: string;
  description: string;
  required: string[];
  properties: {
    [key: string]: Schema | Properties | Aggregate | Aggregate[];
  },
}

// pass it to ui aggregate component to determine how to render
export enum UblElementType  {
  BasicAggregate = 0,
  RequiredAggregate = 1,
  NonRequiredAggregate = 2,
  ArrayAggregate = 3,
}


// todo: should not needed to pass parent formGroup and return new formControl like as real function? is it better
export function generateControl(formGroup: FormGroup, model: any, name: string, required: boolean) {
  if (!formGroup.controls[name]) {
    const controlValue = model?.[name] ?? null;
    formGroup.addControl(name, new FormControl(controlValue, required ? Validators.required : null));
  }
  return formGroup.get(name) as FormControl;
}

export function generateGroup(formGroup: FormGroup, name: string, required: boolean) {
  //todo: pass required to force expend
  if (formGroup.controls[name] == undefined) {
    formGroup.addControl(name, new FormGroup({}));
  }
  return formGroup.get(name) as FormGroup;
}


export function indentString(data: string, count: number, indent = ' ') {
  indent = indent.repeat(count * 2);
  return `${indent}${data}`;
};

export function levelString(data: string, count: number, indent = ' ') {
  indent = indent.repeat(count * 2);
  return `${indent} ${count} : ${data}`;
};


export function getLevel1() {
  return [
    'ActivityProperty',
    'AddressLine',
    'AirTransport',
    'AuctionTerms',
    'CardAccount',
    'CatalogueReference',
    'Clause',
    'CommodityClassification',
    'Communication',
    'Condition',
    'ConsumptionAverage',
    'ConsumptionCorrection',
    'ContractExecutionRequirement',
    'ContractingActivity',
    'ContractingPartyType',
    'ContractingRepresentationType',
    'ContractingSystem',
    'Country',
    'CreditAccount',
    'DeliveryUnit',
    'Dimension',
    'DocumentMetadata',
    'EconomicOperatorRole',
    'EncryptionCertificatePathChain',
    'EncryptionSymmetricAlgorithm',
    'EventComment',
    'EventTacticEnumeration',
    'EvidenceSupplied',
    'ExternalReference',
    'Fee',
    'ForecastException',
    'ForecastExceptionCriterionLine',
    'ItemComparison',
    'ItemPropertyGroup',
    'ItemPropertyRange',
    'Language',
    'LocationCoordinate',
    'MessageDelivery',
    'MeterProperty',
    'MeterReading',
    'MonetaryTotal',
    'PartyIdentification',
    'PartyName',
    'Payment',
    'Period',
    'PhysicalAttribute',
    'PortCallPurpose',
    'PostAwardProcess',
    'Prize',
    'ProcessJustification',
    'ProcurementAdditionalType',
    'ProcurementProjectLotReference',
    'RailTransport',
    'Regulation',
    'RelatedItem',
    'ResponseValue',
    'RoadTransport',
    'SanitaryMeasure',
    'SecondaryHazard',
    'SecurityClearanceTerm',
    'SecurityMeasure',
    'ServiceFrequency',
    'ShipRequirement',
    'SocialMediaProfile',
    'SubcontractTerms',
    'Temperature',
    'TransportEquipmentSeal',
    'UnstructuredPrice',
    'VesselDynamics',
    'WebSiteAccess',
  ];
}

export function getLevel2() {
  return [
    'Address',
    'AppealTerms',
    'Attachment',
    'Clause',
    'ConsumptionHistory',
    'ConsumptionReportReference',
    'Contact',
    'ContractingParty',
    'Declaration',
    'DocumentDistribution',
    'EconomicOperatorShortList',
    'EventTactic',
    'FinancialGuarantee',
    'HazardousGoodsTransit',
    'ImmobilizedSecurity',
    'ItemIdentification',
    'LotsGroup',
    'Meter',
    'PropertyIdentification',
    'Renewal',
    'ResultOfVerification',
    'RetailPlannedImpact',
    'ServiceLevelAgreement',
    'ShareholderParty',
    'Status',
    'Stowage',
    'TenderingCriterionResponse',
    'WebSite',
    'WinningParty',
  ];
}

//start from here, the ordering must be keeped
export function getLevel3() {
  return [
    'FinancialInstitution',
    'Response',
    'DocumentReference',
    'TaxScheme',
    'TaxCategory',
    'Signature',
    'Certificate',
    'Storage',
    'Location',
    'Despatch',
    'TransportEvent'
  ]
}

export class removeEmpty {
}
