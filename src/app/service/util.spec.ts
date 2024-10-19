import {DocumentService} from "./document.service";
import {TestBed} from "@angular/core/testing";
import {removeNulls} from "./util";

describe('util', () => {
  it('removeNulls - should only keep value', () => {
    let obj = { "ID": { "_": "q", "schemeID": null, "schemeName": null, "schemeAgencyID": null, "schemeAgencyName": null, "schemeVersionID": null, "schemeDataURI": null, "schemeURI": null }, "IssueDate": { "_": null } }
    expect(removeNulls(obj)).toEqual({ "ID": { "_": "q" }, "IssueDate": {} });
  });
})
