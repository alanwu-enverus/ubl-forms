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

export function getRefName(ref: string) {
  let result = ref;

  try {
    result = ref?.includes("/") ? ref.substring(ref.lastIndexOf('/') + 1) : ref;
  } catch (e) {
    console.log(e);
  }

  return result;
}

export function removeEmpty(object: any) {
  if(object === null || object === undefined) {
    return {}
  }
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
      } else if (v === '' || v === null || v === undefined) {
        delete object[k];
      }
    });
  return object;
}

export function isEmpty(obj: any) {
  if (obj === null || obj === undefined) {
    return true;
  }

  if (typeof obj === "object" && !Array.isArray(obj)) {
    if (Object.keys(obj).length === 0) {
      return true;
    }
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && !isEmpty(obj[key])) {
        return false;
      }
    }
    return true;
  }
  if (Array.isArray(obj)) {
    return obj.length === 0 || obj.every((item) => isEmpty(item));
  }

  if(typeof obj === 'string') {
    return obj.trim() === '';
  }
  return false;
}

export function camelCaseToTitle(text: string) {
  return text?.split(/([A-Z]|\d)/).map((v, i, arr) => {
    if (!i) return v.charAt(0).toUpperCase() + v.slice(1);
    if (!v) return v;
    if (v === '_') return " ";
    if (v.length === 1 && v === v.toUpperCase()) {
      const previousCapital = !arr[i - 1] || arr[i - 1] === '_';
      const nextWord = i + 1 < arr.length && arr[i + 1] && arr[i + 1] !== '_';
      const nextTwoCapitalsOrEndOfString = i + 3 > arr.length || !arr[i + 1] && !arr[i + 3];
      if (!previousCapital || nextWord) v = " " + v;
      if (nextWord || (!previousCapital && !nextTwoCapitalsOrEndOfString)) v = v;
    }
    return v;
  }).join("");
}

export async function getSampleDocument(name: string): Promise<any> {
  let data = await import(`../../../public/${name}.json`)
  return data[name];
}

export function createBasicComponentRef(vcr: ViewContainerRef, formGroup: FormGroup,  schema: Basic, data: any, name: string, isDocumentLevel: boolean = false) {
  const ref = vcr.createComponent(BasicComponent);
  ref?.setInput('model', data);
  ref?.setInput('schema', schema);
  ref?.setInput('title', name);
  ref?.setInput('formGroupKey', name);
  ref?.setInput('parentFormGroup', formGroup);
  ref?.setInput('documentLevel', isDocumentLevel);
  return ref;
}

export function createAggregateComponentRef(vcr: ViewContainerRef, formGroup: FormGroup, schema: Aggregate, data: any, name: string) {
  const ref = vcr.createComponent(AggregateComponent);
  ref?.setInput('model', data);
  ref?.setInput('schema', schema);
  ref?.setInput('title', schema['title']);
  ref?.setInput('description', schema['description']);
  ref?.setInput('formGroupKey', name);
  ref?.setInput('parentFormGroup', formGroup);
  return ref;
}

export function createArrayComponentRef(vcr: ViewContainerRef, formGroup: FormGroup, schema: Ubl.Array, data: any, name: string) {
  const ref = vcr.createComponent(ArrayComponent);
  ref?.setInput('model', data);
  ref?.setInput('schema', schema.items);
  ref?.setInput('title', schema.title);
  ref?.setInput('formGroupKey', name);
  ref?.setInput('parentFormGroup', formGroup);
  return ref;
}

export function createRefComponentRef(vcr: ViewContainerRef, formGroup: FormGroup, schema: NextRef, data: any, name: string) {
  const ref = vcr.createComponent(RefComponent);
  ref?.setInput('model', data);
  ref?.setInput('title', schema['title']);
  ref?.setInput('description', schema['description']);
  ref?.setInput('parentFormGroup', formGroup);
  ref?.setInput('formGroupKey', name);
  ref?.setInput('ref', schema['$ref']);
  ref?.setInput('loadRef', !isEmpty(data));
  ref?.setInput('refName', name);
  return ref;
}

export function createComponentRef(vcr: ViewContainerRef, formGroup: FormGroup, schema: any, data: any, name: string, isDocumentLevel: boolean = false) {
  if (schema instanceof Basic) {
    return createBasicComponentRef(vcr, formGroup, schema, data, name, isDocumentLevel);
  } else if (schema instanceof Aggregate) {
    return createAggregateComponentRef(vcr, formGroup, schema, data, name);
  } else if (schema instanceof NextRef) {
    return createRefComponentRef(vcr, formGroup, schema, data, name);
  }
  return null;
}

export function setupAComponent(loadedComponents: LoadedComponent[], vcr:ViewContainerRef, formGroup: FormGroup, schema: any, data, name: string, isRequired:boolean, isDocumentLevel=false) {
  const componentRef = !(schema instanceof Ubl.Array) ? createComponentRef(vcr, formGroup, schema, data, name, isDocumentLevel) : null;
  const arrayComponentRef = schema instanceof Ubl. Array ? createArrayComponentRef(vcr, formGroup, schema, data, name) : null;

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

export  function closeAComponent(component: LoadedComponent, vcr:ViewContainerRef) {
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
    if (component.array.formArray.length === 0 || component.array.formArray.controls.every(control => isEmpty(control.value))) {
      const index = vcr.indexOf(component.viewRef);
      if (index >= 0) {
        vcr.detach(index);
        component.isLoaded = false;
      }
    } else {
      component.array.formArray.controls.forEach(control => {
        if (control instanceof BasicComponent || control instanceof AggregateComponent || control instanceof RefComponent) {
          control.onClose();
        }
      })
    }
  }
}

export function closeComponents(loadedComponents: LoadedComponent[], vcr:ViewContainerRef, required: string[]) {
  if (vcr?.length > 0) {
    const nonRequiredComponents = loadedComponents.filter((component) => !component.isRequired);
    const requiredComponents = loadedComponents.filter((component) => component.isRequired);

    if (required.length === 0) {
      let allNonRequiredIsEmptyAndHaveNotRequired = nonRequiredComponents.every((component) => (component.component && isEmpty(component.component.formGroup?.value))
        || (component.array && component.array.formArray.controls.every(control => isEmpty(control.value))));
      if (allNonRequiredIsEmptyAndHaveNotRequired) {
        vcr.clear();
        loadedComponents.length = 0;
      } else {
        nonRequiredComponents.forEach((component) => {
          closeAComponent(component, vcr);
        });
      }
    } else {
      nonRequiredComponents.forEach((component) => {
        closeAComponent(component, vcr);
      });

      requiredComponents.forEach((component) => {
        component.component?.onClose();
      });
    }
  }
}

export function clearFormGroup(formGroup: FormGroup) {
  while(Object.keys(formGroup.controls).length){
    const toRemove = Object.keys(formGroup.controls)[0];
    formGroup.removeControl(toRemove)
  }
}

export function getAllDocTypes() {
  return [
    "TenderReceipt",
    "ExceptionNotification",
    "CatalogueItemSpecificationUpdate",
    "FreightInvoice",
    "DespatchAdvice",
    "TenderContract",
    "SelfBilledCreditNote",
    "PackingList",
    "Enquiry",
    "FulfilmentCancellation",
    "CertificateOfOrigin",
    "StockAvailabilityReport",
    "BillOfLading",
    "DigitalCapability",
    "TransportExecutionPlanRequest",
    "TransportProgressStatusRequest",
    "TenderStatusRequest",
    "UnawardedNotification",
    "PriorInformationNotice",
    "ReceiptAdvice",
    "UnsubscribeFromProcedureResponse",
    "ContractAwardNotice",
    "ExpressionOfInterestResponse",
    "Tender",
    "Reminder",
    "ForwardingInstructions",
    "ItemInformationRequest",
    "TenderWithdrawal",
    "TenderStatus",
    "TransportProgressStatus",
    "Invoice",
    "Order",
    "UnsubscribeFromProcedureRequest",
    "GoodsItemPassport",
    "ContractNotice",
    "Catalogue",
    "DocumentStatus",
    "TransportExecutionPlan",
    "OrderChange",
    "Manifest",
    "ProductActivity",
    "QualificationApplicationResponse",
    "Forecast",
    "DigitalAgreement",
    "AwardedNotification",
    "ProofOfReexportationReminder",
    "TendererQualification",
    "CataloguePricingUpdate",
    "Waybill",
    "InventoryReport",
    "ApplicationResponse",
    "RetailEvent",
    "RemittanceAdvice",
    "SelfBilledInvoice",
    "ProofOfReexportation",
    "ProofOfReexportationRequest",
    "GuaranteeCertificate",
    "OrderResponseSimple",
    "ExportCustomsDeclaration",
    "WeightStatement",
    "UtilityStatement",
    "TradeItemLocationProfile",
    "ExceptionCriteria",
    "OrderResponse",
    "DocumentStatusRequest",
    "CatalogueRequest",
    "TransportationStatusRequest",
    "EnquiryResponse",
    "Statement",
    "TendererQualificationResponse",
    "ImportCustomsDeclaration",
    "TransportServiceDescriptionRequest",
    "ForecastRevision",
    "TransitCustomsDeclaration",
    "InstructionForReturns",
    "CommonTransportationReport",
    "DebitNote",
    "GoodsItemItinerary",
    "AttachedDocument",
    "QualificationApplicationRequest",
    "CallForTenders",
    "TransportationStatus",
    "Quotation",
    "RequestForQuotation",
    "ExpressionOfInterestRequest",
    "CatalogueDeletion",
    "BusinessCard",
    "GoodsCertificate",
    "CreditNote",
    "TransportServiceDescription",
    "OrderCancellation"
  ];
}
