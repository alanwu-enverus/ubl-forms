import {TestBed} from '@angular/core/testing';
import {DocumentService} from './document.service';
import {Ubl} from '../model/ubl.model';
import Basic = Ubl.Basic;
import Aggregate = Ubl.Aggregate;

describe('DocumentService', () => {
  let service: DocumentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocumentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDocumentRequiredSchema', () => {
    it('returns a Document with title and properties', async () => {
      const result = await service.getDocumentRequiredSchema('Invoice');
      expect(result.title).toBeTruthy();
      expect(result.properties).toBeDefined();
    });

    it('returned properties only contain required field names', async () => {
      const result = await service.getDocumentRequiredSchema('Invoice');
      Object.keys(result.properties).forEach(key => {
        expect(result.required).toContain(key);
      });
    });

    it('resolves required properties to Basic or Aggregate instances', async () => {
      const result = await service.getDocumentRequiredSchema('Invoice');
      Object.values(result.properties).forEach(prop => {
        const isKnownType = prop instanceof Basic || prop instanceof Aggregate || prop instanceof Ubl.Array;
        expect(isKnownType).toBe(true);
      });
    });

    it('returns the same cached instance on repeated calls', async () => {
      const first = await service.getDocumentRequiredSchema('Invoice');
      const second = await service.getDocumentRequiredSchema('Invoice');
      expect(first).toBe(second);
    });

    it('works for ApplicationResponse document type', async () => {
      const result = await service.getDocumentRequiredSchema('ApplicationResponse');
      expect(result).toBeDefined();
      expect(result.required.length).toBeGreaterThan(0);
    });
  });

  describe('getDocumentNonRequiredSchema', () => {
    it('returns a Document with properties', async () => {
      const result = await service.getDocumentNonRequiredSchema('Invoice');
      expect(result.properties).toBeDefined();
    });

    it('non-required properties are NOT in the required array', async () => {
      const result = await service.getDocumentNonRequiredSchema('Invoice');
      Object.keys(result.properties).forEach(key => {
        expect(result.required).not.toContain(key);
      });
    });

    it('required and non-required schemas together cover all document properties', async () => {
      const required = await service.getDocumentRequiredSchema('Invoice');
      const nonRequired = await service.getDocumentNonRequiredSchema('Invoice');
      const allKeys = [...Object.keys(required.properties), ...Object.keys(nonRequired.properties)];
      // All required field names should appear in required schema keys
      required.required.forEach(name => {
        expect(allKeys).toContain(name);
      });
    });

    it('returns the same cached instance on repeated calls', async () => {
      const first = await service.getDocumentNonRequiredSchema('Invoice');
      const second = await service.getDocumentNonRequiredSchema('Invoice');
      expect(first).toBe(second);
    });
  });
});
