import {BasicComponent} from "../form/ubl/basic.component";
import {LoadedComponent, Ubl} from "../model/ubl.model";
import Basic = Ubl.Basic;
import Aggregate = Ubl.Aggregate;
import NextRef = Ubl.NextRef;
import {ArrayComponent} from "../form/ubl/array.component";
import {RefComponent} from "../form/ubl/ref.component";
import {ViewContainerRef} from "@angular/core";
import {FormGroup} from "@angular/forms";
import {AggregateComponent} from "../form/ubl/aggregate.component";

export function getRefName(ref: string): string {
  return ref?.includes('/') ? ref.substring(ref.lastIndexOf('/') + 1) : ref;
}

export function removeEmpty(object: any) {
  if (object === null || object === undefined) return {};
  Object.entries(object).forEach(([k, v]) => {
    if (v && typeof v === 'object') removeEmpty(v);
    if ((v && typeof v === 'object' && !Object.keys(v).length) || v === null || v === undefined) {
      if (Array.isArray(object) && typeof k === 'number') {
        object.splice(k, 1);
      } else {
        delete object[k];
      }
    } else if (v === '') {
      delete object[k];
    }
  });
  return object;
}

export function isEmpty(obj: any): boolean {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj)) return obj.length === 0 || obj.every(isEmpty);
  if (typeof obj === 'object') {
    return Object.keys(obj).length === 0 || Object.keys(obj).every(k => isEmpty(obj[k]));
  }
  if (typeof obj === 'string') return obj.trim() === '';
  return false;
}

export function camelCaseToTitle(text: string): string {
  return text?.split(/([A-Z]|\d)/).map((v, i, arr) => {
    if (!i) return v.charAt(0).toUpperCase() + v.slice(1);
    if (!v) return v;
    if (v === '_') return ' ';
    if (v.length === 1 && v === v.toUpperCase()) {
      const previousCapital = !arr[i - 1] || arr[i - 1] === '_';
      const nextWord = i + 1 < arr.length && arr[i + 1] && arr[i + 1] !== '_';
      const nextTwoCapitalsOrEndOfString = i + 3 > arr.length || !arr[i + 1] && !arr[i + 3];
      if (!previousCapital || nextWord) v = ' ' + v;
      if (nextWord || (!previousCapital && !nextTwoCapitalsOrEndOfString)) v = v;
    }
    return v;
  }).join('');
}

export async function getSampleDocument(name: string): Promise<any> {
  const data = await import(`../../../public/${name}.json`);
  return data[name];
}

export function createBasicComponentRef(vcr: ViewContainerRef, formGroup: FormGroup, schema: Basic, data: any, name: string, isDocumentLevel = false) {
  const ref = vcr.createComponent(BasicComponent);
  ref.setInput('model', data);
  ref.setInput('schema', schema);
  ref.setInput('title', name);
  ref.setInput('formGroupKey', name);
  ref.setInput('parentFormGroup', formGroup);
  ref.setInput('documentLevel', isDocumentLevel);
  return ref;
}

export function createAggregateComponentRef(vcr: ViewContainerRef, formGroup: FormGroup, schema: Aggregate, data: any, name: string) {
  const ref = vcr.createComponent(AggregateComponent);
  ref.setInput('model', data);
  ref.setInput('schema', schema);
  ref.setInput('title', schema.title);
  ref.setInput('description', schema.description);
  ref.setInput('formGroupKey', name);
  ref.setInput('parentFormGroup', formGroup);
  return ref;
}

export function createArrayComponentRef(vcr: ViewContainerRef, formGroup: FormGroup, schema: Ubl.Array, data: any, name: string) {
  const ref = vcr.createComponent(ArrayComponent);
  ref.setInput('model', data);
  ref.setInput('schema', schema.items);
  ref.setInput('title', schema.title);
  ref.setInput('formGroupKey', name);
  ref.setInput('parentFormGroup', formGroup);
  return ref;
}

export function createRefComponentRef(vcr: ViewContainerRef, formGroup: FormGroup, schema: NextRef, data: any, name: string) {
  const ref = vcr.createComponent(RefComponent);
  ref.setInput('model', data);
  ref.setInput('title', schema.title);
  ref.setInput('description', schema.description);
  ref.setInput('parentFormGroup', formGroup);
  ref.setInput('formGroupKey', name);
  ref.setInput('ref', schema.$ref);
  ref.setInput('loadRef', !isEmpty(data));
  ref.setInput('refName', name);
  return ref;
}

export function createComponentRef(vcr: ViewContainerRef, formGroup: FormGroup, schema: any, data: any, name: string, isDocumentLevel = false) {
  if (schema instanceof Basic) return createBasicComponentRef(vcr, formGroup, schema, data, name, isDocumentLevel);
  if (schema instanceof Aggregate) return createAggregateComponentRef(vcr, formGroup, schema, data, name);
  if (schema instanceof NextRef) return createRefComponentRef(vcr, formGroup, schema, data, name);
  return null;
}

export function setupAComponent(loadedComponents: LoadedComponent[], vcr: ViewContainerRef, formGroup: FormGroup, schema: any, data: any, name: string, isRequired: boolean, isDocumentLevel = false) {
  const componentRef = !(schema instanceof Ubl.Array) ? createComponentRef(vcr, formGroup, schema, data, name, isDocumentLevel) : null;
  const arrayComponentRef = schema instanceof Ubl.Array ? createArrayComponentRef(vcr, formGroup, schema, data, name) : null;

  if (componentRef || arrayComponentRef) {
    loadedComponents.push({
      component: componentRef ? componentRef.instance : null,
      viewRef: vcr.get(vcr.length - 1),
      isRequired,
      position: vcr.length - 1,
      array: arrayComponentRef ? arrayComponentRef.instance : null,
      name,
      isLoaded: true
    });
  }
}

export function closeAComponent(component: LoadedComponent, vcr: ViewContainerRef) {
  if (component.component) {
    if (isEmpty(component.component.formGroup.value)) {
      const index = vcr.indexOf(component.viewRef);
      if (index >= 0) {
        vcr.detach(index);
        component.isLoaded = false;
      }
    } else {
      component.component.onClose();
    }
  }
  if (component.array) {
    const allEmpty = component.array.formArray.length === 0
      || component.array.formArray.controls.every(c => isEmpty(c.value));
    if (allEmpty) {
      const index = vcr.indexOf(component.viewRef);
      if (index >= 0) {
        vcr.detach(index);
        component.isLoaded = false;
      }
    }
  }
}

export function closeComponents(loadedComponents: LoadedComponent[], vcr: ViewContainerRef, required: string[]) {
  if (!vcr?.length) return;

  const nonRequired = loadedComponents.filter(c => !c.isRequired);
  const requiredComponents = loadedComponents.filter(c => c.isRequired);

  if (required.length === 0) {
    const allEmpty = nonRequired.every(c =>
      (c.component && isEmpty(c.component.formGroup?.value)) ||
      (c.array && c.array.formArray.controls.every(ctrl => isEmpty(ctrl.value)))
    );
    if (allEmpty) {
      vcr.clear();
      loadedComponents.length = 0;
    } else {
      nonRequired.forEach(c => closeAComponent(c, vcr));
    }
  } else {
    nonRequired.forEach(c => closeAComponent(c, vcr));
    requiredComponents.forEach(c => c.component?.onClose());
  }
}

export function clearFormGroup(formGroup: FormGroup) {
  Object.keys(formGroup.controls).forEach(key => formGroup.removeControl(key));
}

export function getAllDocTypes(): string[] {
  return [
    'ApplicationResponse', 'AttachedDocument', 'AwardedNotification',
    'BillOfLading', 'BusinessCard',
    'CallForTenders', 'Catalogue', 'CatalogueDeletion', 'CatalogueItemSpecificationUpdate',
    'CataloguePricingUpdate', 'CatalogueRequest', 'CertificateOfOrigin',
    'CommonTransportationReport', 'ContractAwardNotice', 'ContractNotice', 'CreditNote',
    'DebitNote', 'DespatchAdvice', 'DigitalAgreement', 'DigitalCapability', 'DocumentStatus',
    'DocumentStatusRequest',
    'EnquiryResponse', 'Enquiry', 'ExceptionCriteria', 'ExceptionNotification',
    'ExportCustomsDeclaration', 'ExpressionOfInterestRequest', 'ExpressionOfInterestResponse',
    'Forecast', 'ForecastRevision', 'ForwardingInstructions', 'FreightInvoice',
    'FulfilmentCancellation',
    'GoodsCertificate', 'GoodsItemItinerary', 'GoodsItemPassport', 'GuaranteeCertificate',
    'ImportCustomsDeclaration', 'InstructionForReturns', 'InventoryReport', 'Invoice',
    'ItemInformationRequest',
    'Manifest',
    'Order', 'OrderCancellation', 'OrderChange', 'OrderResponse', 'OrderResponseSimple',
    'PackingList', 'PriorInformationNotice', 'ProductActivity', 'ProofOfReexportation',
    'ProofOfReexportationReminder', 'ProofOfReexportationRequest',
    'QualificationApplicationRequest', 'QualificationApplicationResponse', 'Quotation',
    'ReceiptAdvice', 'Reminder', 'RemittanceAdvice', 'RequestForQuotation', 'RetailEvent',
    'SelfBilledCreditNote', 'SelfBilledInvoice', 'Statement', 'StockAvailabilityReport',
    'Tender', 'TenderContract', 'TendererQualification', 'TendererQualificationResponse',
    'TenderReceipt', 'TenderStatus', 'TenderStatusRequest', 'TenderWithdrawal',
    'TradeItemLocationProfile', 'TransitCustomsDeclaration', 'TransportationStatus',
    'TransportationStatusRequest', 'TransportExecutionPlan', 'TransportExecutionPlanRequest',
    'TransportProgressStatus', 'TransportProgressStatusRequest', 'TransportServiceDescription',
    'TransportServiceDescriptionRequest',
    'UnawardedNotification', 'UnsubscribeFromProcedureRequest', 'UnsubscribeFromProcedureResponse',
    'UtilityStatement',
    'Waybill', 'WeightStatement',
  ];
}
