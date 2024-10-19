import { TestBed } from '@angular/core/testing';

import { AggregateService } from './aggregate.service';

describe('CacService', () => {
  let service: AggregateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AggregateService);
  });

  it('getRequiredAggregateGroupSchemas get SalesItem', () => {
    let result = service.getRequiredAggregateGroupSchemas('../common/UBL-CommonAggregateComponents-2.3.json#/definitions/SalesItem');
    expect(result).not.toBeNull();
  });

  it('getNonRequiredAggregateGroupSchemasByName get SalesItem', () => {
    let result = service.getNonRequiredAggregateGroupSchemasByName('SalesItem');
    expect(result).not.toBeNull();
  });

  it('getRequiredAggregateGroupSchemas get LotsGroup', () => {
    let result = service.getRequiredAggregateGroupSchemas('../common/UBL-CommonAggregateComponents-2.3.json#/definitions/LotsGroup');
    expect(result).not.toBeNull();
  });

  it('getRequiredAggregateGroupSchemas get sender party', () => {
    let result = service.getRequiredAggregateGroupSchemas('../common/UBL-CommonAggregateComponents-2.3.json#/definitions/SenderParty');
    expect(result).not.toBeNull();
  });

  it('getNonRequiredAggregateGroupSchemas get sender party', () => {
    let result = service.getNonRequiredAggregateGroupSchemasByName('SenderParty');
    expect(result).not.toBeNull();
  });

  it('getNonRequiredAggregateGroupSchemas get PhysicalLocation', () => {
    let result = service.getNonRequiredAggregateGroupSchemasByName('PhysicalLocation');
    expect(result).not.toBeNull();
  });

  it('getNonRequiredAggregateGroupSchemas get Contact', () => {
    let result = service.getNonRequiredAggregateGroupSchemasByName('Person');
    expect(result).not.toBeNull();
  });
});
