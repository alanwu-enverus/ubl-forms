import {DocumentService} from "./document.service";
import {TestBed} from "@angular/core/testing";
import {camelCaseToTitle, removeEmpty} from "./util";

describe('util', () => {
  it('removeNulls - should only keep value', () => {
    let obj = { "ID": { "_": "q", "schemeID": null, "schemeName": null, "schemeAgencyID": null, "schemeAgencyName": null, "schemeVersionID": null, "schemeDataURI": null, "schemeURI": null }, "IssueDate": { "_": null } }
    expect(removeEmpty(obj)).toEqual({ "ID": { "_": "q" }});
  });

  it('removeNulls - should remove empty object', () => {
    let obj = { "ID": { "_": "q", "schemeName": "aa", "schemeAgencyID": "as" }, "IssueDate": { "_": "2024-11-12" }, "AccountingSupplierParty": { "CustomerAssignedAccountID": {}, "DataSendingCapability": {}, "SellerContact": { "ID": {}, "Name": { "_": "as" }, "JobTitle": {}, "Department": {}, "Telephone": {}, "Telefax": {}, "ElectronicMail": {} } }, "LegalMonetaryTotal": { "PayableAmount": {} }, "InvoiceLine": { "ID": {}, "LineExtensionAmount": {} } }
    expect(removeEmpty(obj)).toEqual({ "ID": { "_": "q", "schemeName": "aa", "schemeAgencyID": "as" }, "IssueDate": { "_": "2024-11-12" }, "AccountingSupplierParty": { "SellerContact": { "Name": { "_": "as" } } } });
  });

  it('camelCaseToTitleCase - should convert camelCase to Title Case', () => {
    expect(camelCaseToTitle('camelCaseUSA')).toEqual('Camel Case USA');
  });
})
