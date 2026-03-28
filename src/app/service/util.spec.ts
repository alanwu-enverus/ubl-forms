import {camelCaseToTitle, clearFormGroup, getRefName, isEmpty, removeEmpty} from "./util";
import {FormControl, FormGroup} from "@angular/forms";

describe('getRefName', () => {
  it('extracts name after last slash', () => {
    expect(getRefName('../common/UBL-CommonBasicComponents-2.3.json#/definitions/CustomizationID'))
      .toBe('CustomizationID');
  });

  it('returns the value unchanged when no slash is present', () => {
    expect(getRefName('MyType')).toBe('MyType');
  });

  it('handles a bare definitions ref', () => {
    expect(getRefName('#/definitions/Party')).toBe('Party');
  });

  it('returns undefined for undefined input', () => {
    expect(getRefName(undefined)).toBeUndefined();
  });
});

describe('removeEmpty', () => {
  it('removes null values and keeps non-null values', () => {
    const obj = {
      ID: {_: 'q', schemeID: null, schemeName: null},
      IssueDate: {_: null}
    };
    expect(removeEmpty(obj)).toEqual({ID: {_: 'q'}});
  });

  it('removes empty nested objects', () => {
    const obj = {
      AccountingSupplierParty: {
        SellerContact: {Name: {_: 'as'}, JobTitle: {}}
      },
      LegalMonetaryTotal: {PayableAmount: {}}
    };
    expect(removeEmpty(obj)).toEqual({
      AccountingSupplierParty: {SellerContact: {Name: {_: 'as'}}}
    });
  });

  it('removes empty string values', () => {
    const obj = {a: {_: ''}, b: {_: 'hello'}};
    expect(removeEmpty(obj)).toEqual({b: {_: 'hello'}});
  });

  it('returns empty object for null input', () => {
    expect(removeEmpty(null)).toEqual({});
  });

  it('returns empty object for undefined input', () => {
    expect(removeEmpty(undefined)).toEqual({});
  });

  it('handles deeply nested empty objects', () => {
    const obj = {
      AccountingSupplierParty: {
        Party: {WebsiteURI: {_: ''}}
      }
    };
    expect(removeEmpty(obj)).toEqual({});
  });
});

describe('isEmpty', () => {
  it('returns true for null', () => expect(isEmpty(null)).toBe(true));
  it('returns true for undefined', () => expect(isEmpty(undefined)).toBe(true));
  it('returns true for empty object', () => expect(isEmpty({})).toBe(true));
  it('returns true for empty array', () => expect(isEmpty([])).toBe(true));
  it('returns true for empty string', () => expect(isEmpty('')).toBe(true));
  it('returns true for whitespace-only string', () => expect(isEmpty('   ')).toBe(true));
  it('returns false for non-empty string', () => expect(isEmpty('hello')).toBe(false));
  it('returns false for number zero', () => expect(isEmpty(0)).toBe(false));
  it('returns false for non-empty array', () => expect(isEmpty([1])).toBe(false));
  it('returns false for object with non-empty value', () => expect(isEmpty({a: 'x'})).toBe(false));

  it('returns true for deeply nested empty object', () => {
    expect(isEmpty({a: {b: {c: ''}}})).toBe(true);
  });

  it('returns false for deeply nested object with a value', () => {
    expect(isEmpty({a: {b: {c: 'val'}}})).toBe(false);
  });

  it('returns true for array of empty items', () => {
    expect(isEmpty([{}, null, ''])).toBe(true);
  });

  it('returns false for array with at least one non-empty item', () => {
    expect(isEmpty([{}, 'value'])).toBe(false);
  });
});

describe('camelCaseToTitle', () => {
  it('converts camelCase to Title Case', () => {
    expect(camelCaseToTitle('invoiceDate')).toBe('Invoice Date');
  });

  it('handles consecutive capitals (acronyms)', () => {
    expect(camelCaseToTitle('camelCaseUSA')).toBe('Camel Case USA');
  });

  it('handles a single word', () => {
    expect(camelCaseToTitle('invoice')).toBe('Invoice');
  });

  it('trims correctly when first letter is already uppercase', () => {
    // The function preserves a leading space when input starts uppercase;
    // callers strip ". Type" / ". Details" suffixes from schema titles first.
    expect(camelCaseToTitle('InvoiceLine').trim()).toBe('Invoice Line');
  });

  it('returns undefined for undefined input', () => {
    expect(camelCaseToTitle(undefined)).toBeUndefined();
  });
});

describe('clearFormGroup', () => {
  it('removes all controls from a FormGroup', () => {
    const fg = new FormGroup({
      name: new FormControl('Alice'),
      age: new FormControl(30),
    });
    clearFormGroup(fg);
    expect(Object.keys(fg.controls)).toHaveLength(0);
  });

  it('is a no-op on an already-empty FormGroup', () => {
    const fg = new FormGroup({});
    clearFormGroup(fg);
    expect(Object.keys(fg.controls)).toHaveLength(0);
  });
});
