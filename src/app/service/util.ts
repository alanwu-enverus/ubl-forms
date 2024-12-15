export function getRefName(ref: string) {
  let result = ref;

  try {
    result = ref?.includes("/") ? ref.substring(ref.lastIndexOf('/') + 1) : ref;
  } catch (e) {
    console.log(e);
  }

  return result;
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

export function removeEmpty(object: any) {
  Object
    .entries(object)
    .forEach(([k, v]) => {
      if (v && typeof v === 'object') {
        removeEmpty(v);
      }
      if (v && typeof v === 'object' && !Object.keys(v).length || v === null || v === undefined) {
        if (Array.isArray(object) && typeof k === 'number') {
          object.splice(k, 1);
        } else {
          delete object[k];
        }
      }
    });
  return object;
}

export function isEmpty(obj: any) {
  if (obj === null || obj === undefined) {
    return true;
  }

  // Check if obj is an object (not an array)
  if (typeof obj === "object" && !Array.isArray(obj)) {
    // Check if the object has no own properties
    if (Object.keys(obj).length === 0) {
      return true;
    }

    // Recursively check each property of the object
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && !isEmpty(obj[key])) {
        return false;
      }
    }

    return true;
  }

  // Check if obj is an array
  if (Array.isArray(obj)) {
    // Check if the array is empty or all its elements are empty
    return obj.length === 0 || obj.every((item) => isEmpty(item));
  }

  // For primitive types (number, string, boolean), it's not empty
  return false;
}

export function camelCaseToTitle(text: string) {
  return text.split(/([A-Z]|\d)/).map((v, i, arr) => {
    // If first block then capitalise 1st letter regardless
    if (!i) return v.charAt(0).toUpperCase() + v.slice(1);
    // Skip empty blocks
    if (!v) return v;
    // Underscore substitution
    if (v === '_') return " ";
    // We have a capital or number
    if (v.length === 1 && v === v.toUpperCase()) {
      const previousCapital = !arr[i - 1] || arr[i - 1] === '_';
      const nextWord = i + 1 < arr.length && arr[i + 1] && arr[i + 1] !== '_';
      const nextTwoCapitalsOrEndOfString = i + 3 > arr.length || !arr[i + 1] && !arr[i + 3];
      // Insert space
      if (!previousCapital || nextWord) v = " " + v;
      // Start of word or single letter word
      if (nextWord || (!previousCapital && !nextTwoCapitalsOrEndOfString)) v = v;
    }
    return v;
  }).join("");
}

export async function getSampleDocument(name: string): Promise<any> {
  const fileName = `UBL-${name}-Example.json`;
  let data = await import(`../../../public/ubl-sample/${fileName}`)
  return data[name];
}

// export function camelCaseToTitle(text: string) {
//   return text.replace(/([A-Z]+)/g, " $1").replace(/([A-Z][a-z])/g, " $1")
// }


// export function isEmpty(myObject) {
//   if(Object.keys(myObject).length === 0) return true;
//   let result = false;
//   for(var key in myObject) {
//     if(myObject[key] == null || myObject[key] == undefined) return true;
//     if((typeof myObject[key] === 'object' && Object.keys(myObject[key]).length === 0)) return true;
//     if((typeof myObject[key] === 'string' && myObject[key].trim().length === 0)) return true;
//     if(myObject[key] instanceof Object) return isEmpty(myObject[key]);
//   }
//   return false;
// }

// export type cache = {
//   [key: string]: any;
// }
//
// export function levelString(data: string, count: number, indent = ' ') {
//   indent = indent.repeat(count * 2);
//   return `${indent} ${count} : ${data}`;
// };
//
// //host basic schema
// export type Schema = {
//   title: string;
//   description: string;
//   required: string[];
//   properties: {
//     [key: string]: {
//       type: string,
//       format?: string,
//     };
//   },
//   additionalProperties?: boolean;
// }
//
// //host properties key->schema ?? seems this is only for UblExtension type ??
// export type Properties = {
//   [key: string]: Schema
// }
//
// //aggregate type
// export type Aggregate = {
//   key: string;
//   schemas: Schema | Schema[] | Aggregate | Aggregate[]; // can be renamed to properties
//   type: string;
//   title: string;
//   description: string;
// }
//
// //host document type
// export type UblDocument = {
//   title: string;
//   description: string;
//   required: string[];
//   properties: {
//     [key: string]: Schema | Properties | Aggregate | Aggregate[];
//   },
// }

// pass it to ui aggregate component to determine how to render
// export enum UblElementType  {
//   BasicAggregate = 0,
//   RequiredAggregate = 1,
//   NonRequiredAggregate = 2,
//   ArrayAggregate = 3,
// }


// // todo: should not needed to pass parent formGroup and return new formControl like as real function? is it better
// export function generateControl(formGroup: FormGroup, model: any, name: string, required: boolean) {
//   if (!formGroup.controls[name]) {
//     const controlValue = model?.[name] ?? null;
//     formGroup.addControl(name, new FormControl(controlValue, required ? Validators.required : null));
//   }
//   return formGroup.get(name) as FormControl;
// }
//
// export function generateGroup(formGroup: FormGroup, name: string, required: boolean) {
//   //todo: pass required to force expend
//   if (formGroup.controls[name] == undefined) {
//     formGroup.addControl(name, new FormGroup({}));
//   }
//   return formGroup.get(name) as FormGroup;
// }
//
//
// export function indentString(data: string, count: number, indent = ' ') {
//   indent = indent.repeat(count * 2);
//   return `${indent}${data}`;
// };
//
//
//
//
// export function getLevel1() {
//   return [
//     'ActivityProperty',
//     'AddressLine',
//     'AirTransport',
//     'AuctionTerms',
//     'CardAccount',
//     'CatalogueReference',
//     'Clause',
//     'CommodityClassification',
//     'Communication',
//     'Condition',
//     'ConsumptionAverage',
//     'ConsumptionCorrection',
//     'ContractExecutionRequirement',
//     'ContractingActivity',
//     'ContractingPartyType',
//     'ContractingRepresentationType',
//     'ContractingSystem',
//     'Country',
//     'CreditAccount',
//     'DeliveryUnit',
//     'Dimension',
//     'DocumentMetadata',
//     'EconomicOperatorRole',
//     'EncryptionCertificatePathChain',
//     'EncryptionSymmetricAlgorithm',
//     'EventComment',
//     'EventTacticEnumeration',
//     'EvidenceSupplied',
//     'ExternalReference',
//     'Fee',
//     'ForecastException',
//     'ForecastExceptionCriterionLine',
//     'ItemComparison',
//     'ItemPropertyGroup',
//     'ItemPropertyRange',
//     'Language',
//     'LocationCoordinate',
//     'MessageDelivery',
//     'MeterProperty',
//     'MeterReading',
//     'MonetaryTotal',
//     'PartyIdentification',
//     'PartyName',
//     'Payment',
//     'Period',
//     'PhysicalAttribute',
//     'PortCallPurpose',
//     'PostAwardProcess',
//     'Prize',
//     'ProcessJustification',
//     'ProcurementAdditionalType',
//     'ProcurementProjectLotReference',
//     'RailTransport',
//     'Regulation',
//     'RelatedItem',
//     'ResponseValue',
//     'RoadTransport',
//     'SanitaryMeasure',
//     'SecondaryHazard',
//     'SecurityClearanceTerm',
//     'SecurityMeasure',
//     'ServiceFrequency',
//     'ShipRequirement',
//     'SocialMediaProfile',
//     'SubcontractTerms',
//     'Temperature',
//     'TransportEquipmentSeal',
//     'UnstructuredPrice',
//     'VesselDynamics',
//     'WebSiteAccess',
//   ];
// }
//
// export function getLevel2() {
//   return [
//     'Address',
//     'AppealTerms',
//     'Attachment',
//     'Clause',
//     'ConsumptionHistory',
//     'ConsumptionReportReference',
//     'Contact',
//     'ContractingParty',
//     'Declaration',
//     'DocumentDistribution',
//     'EconomicOperatorShortList',
//     'EventTactic',
//     'FinancialGuarantee',
//     'HazardousGoodsTransit',
//     'ImmobilizedSecurity',
//     'ItemIdentification',
//     'LotsGroup',
//     'Meter',
//     'PropertyIdentification',
//     'Renewal',
//     'ResultOfVerification',
//     'RetailPlannedImpact',
//     'ServiceLevelAgreement',
//     'ShareholderParty',
//     'Status',
//     'Stowage',
//     'TenderingCriterionResponse',
//     'WebSite',
//     'WinningParty',
//   ];
// }
//
// //start from here, the ordering must be keeped
// export function getLevel3() {
//   return [
//     'FinancialInstitution',
//     'Response',
//     'DocumentReference',
//     'TaxScheme',
//     'TaxCategory',
//     'Signature',
//     'Certificate',
//     'Storage',
//     'Location',
//     'Despatch',
//     'TransportEvent'
//   ]
// }
//
// export class removeEmpty {
// }
