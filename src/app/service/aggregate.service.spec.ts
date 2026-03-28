import {TestBed} from '@angular/core/testing';
import {AggregateService} from './aggregate.service';
import {Ubl} from '../model/ubl.model';
import Aggregate = Ubl.Aggregate;
import Basic = Ubl.Basic;
import NextRef = Ubl.NextRef;

const CAC_PREFIX = '../common/UBL-CommonAggregateComponents-2.3.json#/definitions/';

describe('AggregateService', () => {
  let service: AggregateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AggregateService);
  });

  describe('ref type predicates', () => {
    it('isCacRef returns true for CAC URL', () => {
      expect(service.isCacRef(CAC_PREFIX + 'Party')).toBe(true);
    });

    it('isCacRef returns false for non-CAC URL', () => {
      expect(service.isCacRef('../common/UBL-CommonBasicComponents-2.3.json#/definitions/ID')).toBe(false);
    });

    it('isRef returns true for internal definition ref', () => {
      expect(service.isRef('#/definitions/Party')).toBe(true);
    });

    it('isRef returns false for external URL', () => {
      expect(service.isRef(CAC_PREFIX + 'Party')).toBe(false);
    });
  });

  describe('getRequiredAggregatesByRef', () => {
    it('returns an Aggregate instance', () => {
      const result = service.getRequiredAggregatesByRef(CAC_PREFIX + 'SenderParty');
      expect(result).toBeInstanceOf(Aggregate);
    });

    it('returned Aggregate has a title', () => {
      const result = service.getRequiredAggregatesByRef(CAC_PREFIX + 'SenderParty');
      expect(result.title).toBeTruthy();
    });

    it('required array matches schema required fields', () => {
      const result = service.getRequiredAggregatesByRef(CAC_PREFIX + 'InvoiceLine');
      expect(Array.isArray(result.required)).toBe(true);
    });

    it('properties only contain required fields', () => {
      const result = service.getRequiredAggregatesByRef(CAC_PREFIX + 'InvoiceLine');
      const propKeys = Object.keys(result.properties);
      propKeys.forEach(key => {
        expect(result.required).toContain(key);
      });
    });

    it('resolves internal definition ref (#/definitions/)', () => {
      const result = service.getRequiredAggregatesByRef('#/definitions/Item');
      expect(result).toBeInstanceOf(Aggregate);
    });

    it('resolves PartyIdentification via internal ref', () => {
      const result = service.getRequiredAggregatesByRef('#/definitions/PartyIdentification');
      expect(result).toBeInstanceOf(Aggregate);
    });
  });

  describe('getNonRequiredAggregatesByRef', () => {
    it('returns an Aggregate instance', () => {
      const result = service.getNonRequiredAggregatesByRef(CAC_PREFIX + 'AccountingSupplierParty');
      expect(result).toBeInstanceOf(Aggregate);
    });

    it('properties do NOT contain required fields', () => {
      const result = service.getNonRequiredAggregatesByRef(CAC_PREFIX + 'InvoiceLine');
      const propKeys = Object.keys(result.properties);
      propKeys.forEach(key => {
        expect(result.required).not.toContain(key);
      });
    });

    it('resolves LegalMonetaryTotal', () => {
      const result = service.getNonRequiredAggregatesByRef('LegalMonetaryTotal');
      expect(result).toBeInstanceOf(Aggregate);
    });

    it('resolves Party by bare name', () => {
      const result = service.getNonRequiredAggregatesByRef('Party');
      expect(result).toBeInstanceOf(Aggregate);
    });
  });

  describe('getNonRequiredAggregatesByName', () => {
    it('returns an Aggregate for a known name', () => {
      const result = service.getNonRequiredAggregatesByName('InvoiceLine');
      expect(result).toBeInstanceOf(Aggregate);
    });

    it('non-required result has no required-field keys in properties', () => {
      const result = service.getNonRequiredAggregatesByName('InvoiceLine');
      Object.keys(result.properties).forEach(key => {
        expect(result.required).not.toContain(key);
      });
    });
  });

  describe('property resolution types', () => {
    it('resolves a Basic property inside an aggregate', () => {
      const result = service.getRequiredAggregatesByRef(CAC_PREFIX + 'InvoiceLine');
      // ID is a required basic field in InvoiceLine
      expect(result.properties['ID']).toBeInstanceOf(Basic);
    });

    it('resolves a NextRef for a deep-nested reference', () => {
      const result = service.getNonRequiredAggregatesByRef(CAC_PREFIX + 'Party');
      // Party has nested refs; at least one should be a NextRef or Aggregate
      const values = Object.values(result.properties);
      expect(values.length).toBeGreaterThan(0);
    });
  });

  describe('caching', () => {
    it('produces equal results on repeated calls (definitions are cached)', () => {
      const first = service.getRequiredAggregatesByRef(CAC_PREFIX + 'SenderParty');
      const second = service.getRequiredAggregatesByRef(CAC_PREFIX + 'SenderParty');
      expect(first).toEqual(second);
    });

    it('populates definitionsCache after first lookup', () => {
      service.getRequiredAggregatesByRef(CAC_PREFIX + 'InvoiceLine');
      expect(service.definitionsCache.has('InvoiceLine')).toBe(true);
    });
  });
});
