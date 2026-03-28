<h1 align="center">
  <img src="icon.svg" width="60" alt="UBL Forms icon" valign="middle"/>
  &nbsp;UBL Forms
</h1>

<p align="center">
  <a href="https://github.com/alanwu-enverus/ubl-forms/actions/workflows/test.yml">
    <img src="https://github.com/alanwu-enverus/ubl-forms/actions/workflows/test.yml/badge.svg" alt="test"/>
  </a>
</p>

A dynamic form generator for [Universal Business Language (UBL) 2.3](https://docs.oasis-open.org/ubl/os-UBL-2.3/UBL-2.3.html) documents, built with Angular 19.

## What it does

Reads UBL JSON schemas and renders interactive forms on the fly — no hardcoded fields. Supports all 80+ UBL document types (Invoice, Order, CreditNote, etc.).

- Required fields load immediately; optional fields expand on demand
- Load a sample document to pre-populate the form
- Outputs clean JSON as you type

## Getting started

```bash
npm install
npm start        # http://localhost:4200
```

## Commands

| Command | Description |
|---|---|
| `npm start` | Start dev server |
| `npm run build` | Production build |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

## How it works

```
Select document type
  → DocumentComponent loads required schema fields
  → Expand (···) to reveal optional fields
  → Expand (↗) to load a nested reference
  → JSON output updates in real time
```

**Services**
- `DocumentService` — loads the top-level document schema
- `AggregateService` — resolves nested object schemas (CAC)
- `BasicService` — resolves primitive field schemas (CBC, QDT, UDT, CCT, CEC)

**Components**
- `ubl-document` — root form container
- `ubl-basic` — primitive fields (text, date, number, …)
- `ubl-aggregate` — nested object group
- `ubl-array` — repeatable list of items
- `ubl-ref` — lazy-loaded nested reference

## Project structure

```
src/app/
├── form/
│   ├── ubl/        # core form components
│   └── helper/     # input, error, icon components
├── service/        # schema resolution services + utilities
└── model/          # TypeScript types and imported JSON schemas
public/             # UBL 2.3 JSON schema files
```

## Tech stack

- Angular 19 (standalone components, signals)
- Reactive Forms
- Jest + jest-preset-angular
