import { TestBed } from '@angular/core/testing';

import { BasicService } from './basic.service';

describe('CbcService', () => {
  let service: BasicService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BasicService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it("getBasicByRef -- CustomizationID", async () => {
    let result = await service.getBasicByRef('../common/UBL-CommonBasicComponents-2.3.json#/definitions/CustomizationID');
    expect(result).not.toBeNull();
  });


  /* outdate */

  it('getCbcRefSchema -- CustomizationID', async () => {
    let result = await service.getBasicSchemaFromRef('../common/UBL-CommonBasicComponents-2.3.json#/definitions/CustomizationID');
    expect(result).not.toBeNull();
  });

  it('getUdtRefSchema -- CodeType', async () => {
    let result = await service.getUdtSchemaFromRef('BDNDR-UnqualifiedDataTypes-1.1.json#/definitions/CodeType');
    expect(result).not.toBeNull();
  });

  it('getQdtRefSchema -- AllowanceChargeReason_CodeType', async () => {
    let result = await service.getQdtSchemaFromRef('UBL-QualifiedDataTypes-2.3.json#/definitions/AllowanceChargeReason_CodeType');
    expect(result).not.toBeNull();
  });

  it('getBasicSchemaFromRef -- AllowanceChargeReason_CodeType', async () => {
    let result = await service.getBasicSchemaFromRef('BDNDR-UnqualifiedDataTypes-1.1.json#/definitions/IdentifierType');
    expect(result).not.toBeNull();
  });
});
