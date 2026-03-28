import {TestBed} from '@angular/core/testing';
import {BasicService} from './basic.service';
import {Ubl} from '../model/ubl.model';
import Basic = Ubl.Basic;
import Extension = Ubl.Extension;

const CBC_REF = '../common/UBL-CommonBasicComponents-2.3.json#/definitions/CustomizationID';
const QDT_REF = '../common/UBL-QualifiedDataTypes-2.3.json#/definitions/ChannelCodeType';
const UDT_REF = '../common/BDNDR-UnqualifiedDataTypes-1.1.json#/definitions/AmountType';
const CEC_REF = '../common/UBL-CommonExtensionComponents-2.3.json#/definitions/UBLExtension';
const UNKNOWN_REF = 'https://example.com/unknown.json#/definitions/Foo';

describe('BasicService', () => {
  let service: BasicService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BasicService);
  });

  describe('ref type predicates', () => {
    it('isCbcRef returns true for CBC URL', () => {
      expect(service.isCbcRef(CBC_REF)).toBe(true);
    });

    it('isCbcRef returns false for non-CBC URL', () => {
      expect(service.isCbcRef(UDT_REF)).toBe(false);
    });

    it('isQdtRef returns true for QDT URL', () => {
      expect(service.isQdtRef(QDT_REF)).toBe(true);
    });

    it('isUdtRef returns true for UDT URL', () => {
      expect(service.isUdtRef(UDT_REF)).toBe(true);
    });

    it('isCecRef returns true for CEC URL', () => {
      expect(service.isCecRef(CEC_REF)).toBe(true);
    });

    it('isCctRef returns true for CCT URL', () => {
      const cctRef = '../common/BDNDR-CCTS_CCT_SchemaModule-1.1.json#/definitions/AmountType';
      expect(service.isCctRef(cctRef)).toBe(true);
    });

    it('isBasicRef returns true for CBC ref', () => {
      expect(service.isBasicRef(CBC_REF)).toBe(true);
    });

    it('isBasicRef returns true for QDT ref', () => {
      expect(service.isBasicRef(QDT_REF)).toBe(true);
    });

    it('isBasicRef returns true for UDT ref', () => {
      expect(service.isBasicRef(UDT_REF)).toBe(true);
    });

    it('isBasicRef returns true for CEC ref', () => {
      expect(service.isBasicRef(CEC_REF)).toBe(true);
    });

    it('isBasicRef returns false for unknown ref', () => {
      expect(service.isBasicRef(UNKNOWN_REF)).toBe(false);
    });
  });

  describe('getBasicByRef', () => {
    it('resolves a CBC ref to a Basic instance', () => {
      const result = service.getBasicByRef(CBC_REF);
      expect(result).toBeInstanceOf(Basic);
    });

    it('resolves a UDT ref to a Basic instance', () => {
      const result = service.getBasicByRef(UDT_REF);
      expect(result).toBeInstanceOf(Basic);
    });

    it('resolves a CEC ref to an Extension instance', () => {
      const result = service.getBasicByRef(CEC_REF);
      expect(result).toBeInstanceOf(Extension);
    });

    it('throws for an unknown ref', () => {
      expect(() => service.getBasicByRef(UNKNOWN_REF)).toThrow();
    });

    it('returned Basic has title and properties', () => {
      const result = service.getBasicByRef(CBC_REF) as Basic;
      expect(result.title).toBeTruthy();
      expect(result.properties).toBeDefined();
    });
  });

  describe('getCbcByRef', () => {
    it('resolves a CBC ref to a Basic instance', () => {
      const result = service.getCbcByRef(CBC_REF);
      expect(result).toBeInstanceOf(Basic);
    });
  });

  describe('getUdtByRef', () => {
    it('resolves a UDT ref to a Basic instance', () => {
      const result = service.getUdtByRef(UDT_REF);
      expect(result).toBeInstanceOf(Basic);
    });
  });

  describe('getExtensionByRef', () => {
    it('resolves a CEC ref to an Extension with description and properties', () => {
      const result = service.getExtensionByRef(CEC_REF);
      expect(result).toBeInstanceOf(Extension);
      expect(result.description).toBeTruthy();
      expect(result.properties).toBeDefined();
    });
  });
});
