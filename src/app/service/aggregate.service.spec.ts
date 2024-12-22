import { TestBed } from '@angular/core/testing';

import { AggregateService } from './aggregate.service';

describe('CacService', () => {
  let service: AggregateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AggregateService);
  });

  it("getRequiredAggregatesByRef -- SenderParty", async () => {
    let result = await service.getRequiredAggregatesByRef('../common/UBL-CommonAggregateComponents-2.3.json#/definitions/SenderParty');
    expect(result).not.toBeNull();
  });

  it("getRequiredAggregatesByRef -- SalesItem", async () => {
    let result = await service.getRequiredAggregatesByRef('../common/UBL-CommonAggregateComponents-2.3.json#/definitions/SalesItem');
    expect(result).not.toBeNull();
  });

  it("getRequiredAggregatesByRef -- #/definitions/Item", async () => {
    let result = await service.getRequiredAggregatesByRef('#/definitions/Item');
    expect(result).not.toBeNull();
  });

  it("getRequiredAggregatesByRef -- #/definitions/PartyIdentification", async () => {
    let result = await service.getRequiredAggregatesByRef('#/definitions/PartyIdentification');
    expect(result).not.toBeNull();
  });

  it("getNonRequiredAggregatesByRef -- Party", async () => {
    let result = await service.getNonRequiredAggregatesByRef('Party');
    expect(result).not.toBeNull();
  });

  it("getNonRequiredAggregatesByRef -- LegalMonetaryTotal", async () => {
    let result = await service.getNonRequiredAggregatesByRef('LegalMonetaryTotal');
    expect(result).not.toBeNull();
  });

  it("getNonRequiredAggregatesByRef -- InvoiceLine", async () => {
    let result = await service.getNonRequiredAggregatesByRef('InvoiceLine');
    expect(result).not.toBeNull();
  });

  it("getNonRequiredAggregatesByRef --PartyIdentification", async () => {
    let result = await service.getNonRequiredAggregatesByRef('PartyIdentification');
    expect(result).not.toBeNull();
  });




  it("getRequiredAggregatesByRef -- AccountingSupplierParty", async () => {
    let result = await service.getRequiredAggregatesByRef("../common/UBL-CommonAggregateComponents-2.3.json#/definitions/InvoiceLine");
    expect(result).not.toBeNull();
  });

  it("getNonRequiredAggregatesByRef -- AccountingSupplierParty", async () => {
    let result = await service.getNonRequiredAggregatesByRef("../common/UBL-CommonAggregateComponents-2.3.json#/definitions/AccountingSupplierParty");
    expect(result).not.toBeNull();
  });




  /* below maybe outdate */
  // it('getRequiredAggregateGroupSchemas get SalesItem', () => {
  //   let result = service.getRequiredAggregateGroupSchemas('../common/UBL-CommonAggregateComponents-2.3.json#/definitions/SalesItem');
  //   expect(result).not.toBeNull();
  // });
  //
  // it('getNonRequiredAggregateGroupSchemasByName get SalesItem', () => {
  //   let result = service.getNonRequiredAggregateGroupSchemasByName('SalesItem');
  //   expect(result).not.toBeNull();
  // });
  //
  // it('getRequiredAggregateGroupSchemas get LotsGroup', () => {
  //   let result = service.getRequiredAggregateGroupSchemas('../common/UBL-CommonAggregateComponents-2.3.json#/definitions/LotsGroup');
  //   expect(result).not.toBeNull();
  // });
  //
  // it('getRequiredAggregateGroupSchemas get sender party', () => {
  //   let result = service.getRequiredAggregateGroupSchemas('../common/UBL-CommonAggregateComponents-2.3.json#/definitions/SenderParty');
  //   expect(result).not.toBeNull();
  // });
  //
  // it('getNonRequiredAggregateGroupSchemas get sender party', () => {
  //   let result = service.getNonRequiredAggregateGroupSchemasByName('SenderParty');
  //   expect(result).not.toBeNull();
  // });
  //
  // it('getNonRequiredAggregateGroupSchemas get PhysicalLocation', () => {
  //   let result = service.getNonRequiredAggregateGroupSchemasByName('PhysicalLocation');
  //   expect(result).not.toBeNull();
  // });
  //
  // it('getNonRequiredAggregateGroupSchemas get Contact', () => {
  //   let result = service.getNonRequiredAggregateGroupSchemasByName('Person');
  //   expect(result).not.toBeNull();
  // });
});
