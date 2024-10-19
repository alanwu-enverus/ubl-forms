# Dynaform

feature:
1. basic form component (element)-> generate input (text, email...), select, radio, checkbox, textarea, file
2. group form component (object)-> generate form group to host object
3. array form component (list)-> generate form array to host array element or object

design:
1. input: json schema or json data (use tools to generate json schema from json data)
2. option: ui schema (should be json and css for customizing ui? and select options pre-setup?) 
3. option: typeahead service?  lisent to form change event and call service to get data for typeahead if needed


plan:
1. test codes 
   a. generate basic form from json schema 
   b. generate group form from level 1 json schema
   c. generate array form from level 1 json schema
2. create service to get ubl json schema
   a. only get required fields json schema
   b. get other fields json schema on demand


note:
1. set "resolveJsonModule": true, tsconfig.json  to import json file in typescript
