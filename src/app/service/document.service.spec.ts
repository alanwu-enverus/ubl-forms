import { TestBed } from '@angular/core/testing';

import { DocumentService } from './document.service';

describe('DocumentService', () => {
  let service: DocumentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocumentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getRequiredSchemas -- ApplicationResponse', async () => {
    let result = await service.getDocTypeRequiredSchemas('ApplicationResponse');
    expect(result).not.toBeNull();
  });

  it('getNonRequiredSchemas -- ApplicationResponse', async () => {
    let result = await service.getDocTypeNonRequiredSchemas('ApplicationResponse');
    expect(result).toBeTruthy();
  });

  // it('getSchema -- ApplicationResponse', async () => {
  //  let result = await service.getSchema('ApplicationResponse');
  //   expect(result.description).not.toBeNull();
  // });
  //
  // it('getRequiredFields -- ApplicationResponse', async () => {
  //   let result = await service.getDocTypeRequiredFieldNames('ApplicationResponse');
  //   expect(result.length).not.toBeNull();
  // });
  //
  // it('getRequiredFieldRefs -- ApplicationResponse -  ', async () => {
  //   let result = await service.getDocTypeRequiredRefs('ApplicationResponse');
  //   expect(result.length).not.toBeNull();
  // });
  //
  // it('getRequiredFieldSchemas -- ApplicationResponse - todo ', async () => {
  //   let result = await service.getDocTypeRequiredSchemas('ApplicationResponse');
  //   expect(result).not.toBeNull();
  // });
  //
  // it('getRefSchema -- ApplicationResponse - todo', async () => {
  //  let result = await service.getBasicRefSchema('"../common/UBL-CommonBasicComponents-2.3.json#/definitions/CustomizationID"');
  //   expect(result).not.toBeNull();
  // });

});
